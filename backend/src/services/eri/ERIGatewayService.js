const axios = require('axios');
const crypto = require('crypto');
const enterpriseLogger = require('../../utils/logger');
const AppError = require('../../utils/AppError');
const ErrorCodes = require('../../constants/ErrorCodes');
const { mapERIError } = require('../../utils/eriErrorMapper');
const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

class ERIGatewayService {
  constructor() {
    this.baseUrl = process.env.ERI_API_URL || 'https://api.incometax.gov.in/eri';
    this.eriUserId = process.env.ERI_USER_ID || '';
    this.eriPassword = process.env.ERI_PASSWORD || '';
    this.secretKey = process.env.ERI_SECRET_KEY || process.env.ERI_API_SECRET || '';
    this.p12CertPath = process.env.ERI_P12_CERT_PATH || '';
    this.p12Password = process.env.ERI_P12_PASSWORD || '';
    this.clientId = process.env.ERI_CLIENT_ID || '';
    this.clientSecret = process.env.ERI_CLIENT_SECRET || '';
    this.mode = process.env.ERI_MODE || (process.env.FEATURE_ERI_LIVE === 'true' ? 'LIVE' : 'MOCK');
    this._authToken = null;
    this._tokenExpiry = null;
  }

  _maskPan(pan) {
    if (!pan) return 'N/A';
    return pan.substring(0, 5) + '****' + pan.substring(9);
  }

  // ── AES Password Encryption (as per ERI guide section 3) ──
  encryptPassword(plainPassword) {
    const keyBuffer = Buffer.from(this.secretKey, 'base64');
    const algo = keyBuffer.length === 16 ? 'aes-128-ecb' : 'aes-256-ecb';
    const cipher = crypto.createCipheriv(algo, keyBuffer, null);
    let encrypted = cipher.update(plainPassword, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
  }

  // ── Load PKCS12 keystore and extract key + cert ──
  _loadKeystore() {
    const certPath = path.resolve(process.cwd(), this.p12CertPath);
    if (!fs.existsSync(certPath)) {
      throw new Error(`PKCS12 certificate not found at ${certPath}`);
    }
    const p12Buffer = fs.readFileSync(certPath);
    const p12Asn1 = forge.asn1.fromDer(forge.util.createBuffer(p12Buffer));
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, this.p12Password);

    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });

    const privateKey = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag][0].key;
    const certificate = certBags[forge.pki.oids.certBag][0].cert;

    return { privateKey, certificate };
  }

  /**
   * Sign data using CMS/PKCS#7 detached signature (as per ERI guide section 1)
   * @param {string} data - The plain text data to sign
   * @returns {string} - Base64 encoded CMS signature
   */
  signPayload(data) {
    if (this.mode === 'MOCK') return 'MOCK_SIGNATURE_BASE64';

    if (!this.p12CertPath || !this.p12Password) {
      if (this.mode === 'SANDBOX') return 'MOCK_SIGNATURE_FALLBACK';
      throw new AppError(ErrorCodes.UPSTREAM_ERROR, 'ERI_P12_CERT_PATH or ERI_P12_PASSWORD not configured', 500);
    }

    try {
      const { privateKey, certificate } = this._loadKeystore();

      const p7 = forge.pkcs7.createSignedData();
      p7.content = forge.util.createBuffer(data, 'utf8');
      p7.addCertificate(certificate);
      p7.addSigner({
        key: privateKey,
        certificate: certificate,
        digestAlgorithm: forge.pki.oids.sha256,
        authenticatedAttributes: [
          { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
          { type: forge.pki.oids.messageDigest },
          { type: forge.pki.oids.signingTime, value: new Date() },
        ],
      });
      // Detached = false per ERI guide (sigData includes content)
      p7.sign({ detached: false });

      const der = forge.asn1.toDer(p7.toAsn1()).getBytes();
      return Buffer.from(der, 'binary').toString('base64');
    } catch (error) {
      enterpriseLogger.error('CMS Signing Failed', { error: error.message });
      throw new AppError(ErrorCodes.UPSTREAM_ERROR, 'Digital Signing Failed', 500, { cause: error.message });
    }
  }

  /**
   * Build the ERI signed login payload (as per ERI guide)
   * 1. Encrypt password with AES using secret key
   * 2. Build login JSON: { serviceName, entity, pass }
   * 3. Base64 encode the JSON
   * 4. Sign the JSON with PKCS12 certificate
   * 5. Return { sign, data, eriUserId }
   */
  buildSignedLoginPayload() {
    const encryptedPass = this.encryptPassword(this.eriPassword);

    const loginPayload = JSON.stringify({
      serviceName: 'EriLoginService',
      entity: this.eriUserId,
      pass: encryptedPass,
    });

    const dataBase64 = Buffer.from(loginPayload).toString('base64');
    const signature = this.signPayload(loginPayload);

    return {
      sign: signature,
      data: dataBase64,
      eriUserId: this.eriUserId,
    };
  }

  /**
   * Authenticate with ERI Gateway (API_Login_v1.1)
   * Headers: clientId, clientSecret, accessMode
   * Response: autkn field = auth token, 24hr validity for Type 2
   * @returns {Promise<string>} Auth token
   */
  async authenticate() {
    if (this.mode === 'MOCK') return 'mock-access-token-uuid-v4';

    // Return cached token if still valid (1hr buffer before 24hr expiry)
    if (this._authToken && this._tokenExpiry && Date.now() < this._tokenExpiry - 3600000) {
      return this._authToken;
    }

    try {
      const signedPayload = this.buildSignedLoginPayload();

      enterpriseLogger.info('ERI Login attempt', { eriUserId: this.eriUserId });

      const response = await axios.post(`${this.baseUrl}/itrweb/auth/v0.1/login`, signedPayload, {
        headers: {
          'Content-Type': 'application/json',
          'clientId': this.clientId,
          'clientSecret': this.clientSecret,
          'accessMode': 'API',
        },
        timeout: 15000,
      });

      // Per spec: token is in "autkn" field
      const token = response.data?.autkn || response.data?.accessToken || response.data?.token;
      if (!token) {
        throw new Error('No auth token (autkn) in ERI login response');
      }

      this._authToken = token;
      this._tokenExpiry = Date.now() + 86400000; // 24hr session for Type 2

      enterpriseLogger.info('ERI Login successful', { entity: response.data?.entity });
      return token;
    } catch (error) {
      enterpriseLogger.error('ERI Authentication Failed', {
        error: error.message,
        response: error.response?.data,
      });
      this._authToken = null;
      this._tokenExpiry = null;
      throw mapERIError(error);
    }
  }

  // ══════════════════════════════════════════════════════
  // PREFILL APIs (API_Prefill_v1.1) — 2-step OTP flow
  // ══════════════════════════════════════════════════════

  async requestPrefillOTP(pan, assessmentYear, otpSource = 'E') {
    if (this.mode === 'MOCK') return { transactionId: `MOCK-PREFILL-${Date.now()}`, successFlag: true };
    try {
      const headers = await this._authHeaders();
      const body = this._buildSignedBody({
        serviceName: 'EriGetPrefill',
        pan: pan.toUpperCase(),
        assessmentYear: String(assessmentYear).substring(0, 4),
        otpSourceFlag: otpSource,
      });
      const res = await axios.post(`${this.baseUrl}/itrweb/auth/v0.1/prefill/requestPrefillOTP`, body, { headers, timeout: 15000 });
      const d = res.data;
      if (!d.successFlag) throw this._mapClientError(d.errors?.[0]?.code || 'UNKNOWN', d.errors?.[0]?.desc || 'Prefill OTP request failed');
      enterpriseLogger.info('ERI prefill OTP sent', { pan: this._maskPan(pan) });
      return { transactionId: d.transactionId, successFlag: true };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapERIError(error);
    }
  }

  async getPrefill(pan, assessmentYear, otpSource, mobileOtp, emailOtp, transactionId) {
    if (this.mode === 'MOCK') return { successFlag: true, prefill: {} };
    try {
      const headers = await this._authHeaders();
      const dataObj = {
        serviceName: 'EriGetPrefill', pan: pan.toUpperCase(),
        assessmentYear: String(assessmentYear).substring(0, 4),
        otpSourceFlag: otpSource, mobileOtp, transactionId,
      };
      if (otpSource === 'E' && emailOtp) dataObj.emailOtp = emailOtp;
      const body = this._buildSignedBody(dataObj);
      const res = await axios.post(`${this.baseUrl}/itrweb/auth/v0.1/prefill/getPrefill`, body, { headers, timeout: 30000 });
      const d = res.data;
      if (!d.successFlag) throw this._mapClientError(d.errors?.[0]?.code || 'UNKNOWN', d.errors?.[0]?.desc || 'Get prefill failed');
      enterpriseLogger.info('ERI prefill data received', { pan: this._maskPan(pan) });
      return { successFlag: true, prefill: d.prefill || d.Prefill, transactionId: d.transactionId };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapERIError(error);
    }
  }

  // ══════════════════════════════════════════════════════
  // SUBMIT APIs (API_SubmitFlow_v1.1)
  // ══════════════════════════════════════════════════════

  async validateItr(pan, itrType, assessmentYear, formData, filingType = 'O') {
    if (this.mode === 'MOCK') return { successFlag: true, errors: [], transactionNo: `MOCK-VAL-${Date.now()}` };
    return this._submitOrValidate('EriValidateItr', pan, itrType, assessmentYear, formData, filingType, 'validate');
  }

  async submitReturn(pan, itrType, assessmentYear, formData, filingType = 'O') {
    enterpriseLogger.info('Initiating ERI Submission', { mode: this.mode, itrType, pan: this._maskPan(pan) });
    if (this.mode === 'MOCK') return this._mockSubmission(itrType);
    return this._submitOrValidate('EriItrSubmit', pan, itrType, assessmentYear, formData, filingType, 'submit');
  }

  async _submitOrValidate(serviceName, pan, itrType, assessmentYear, formData, filingType, action) {
    try {
      const headers = await this._authHeaders();
      const formCode = String(itrType).replace(/\D/g, '') || '1';
      const ay = String(assessmentYear).substring(0, 4);
      const body = this._buildSignedBody({
        serviceName, pan: pan.toUpperCase(),
        header: {
          formName: `ITR-${formCode}`, formCode, mimeType: 'json',
          entityNum: pan.toUpperCase(), entityType: 'p', ay,
          createdBy: this.eriUserId, filingTypeCd: filingType, filingMode: 'OF',
          incomeTaxSecCd: filingType === 'R' ? '17' : filingType === 'B' ? '12' : '11',
          submittedBy: 'ERI',
        },
        formData: typeof formData === 'string' ? formData : JSON.stringify(formData),
      });
      const endpoint = action === 'validate' ? 'validate' : 'submit';
      const res = await axios.post(`${this.baseUrl}/itrweb/auth/v0.1/returns/${endpoint}`, body, { headers, timeout: 60000 });
      const d = res.data;
      if (!d.successFlag) {
        const errors = (d.errors || []).map(e => ({ code: e.errCd, field: e.errFld, category: e.errCtg }));
        throw new AppError(ErrorCodes.SUBMISSION_REJECTED, `ITD ${action} failed`, 422, { errors });
      }
      enterpriseLogger.info(`ERI ${action} successful`, { arn: d.arnNumber, txn: d.transactionNo });
      return { successFlag: true, arnNumber: d.arnNumber || null, ackNumber: d.arnNumber || null, transactionNo: d.transactionNo, status: d.httpStatus || 'ACCEPTED', timestamp: new Date().toISOString() };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapERIError(error);
    }
  }

  // ══════════════════════════════════════════════════════
  // E-VERIFY APIs (API_Everify_Return_v1.1)
  // ══════════════════════════════════════════════════════

  async updateVerMode(pan, ackNum, ay, formCode, verMode) {
    if (this.mode === 'MOCK') return { successFlag: true };
    try {
      const headers = await this._authHeaders();
      const body = this._buildSignedBody({ serviceName: 'EriUpdateVerMode', pan: pan.toUpperCase(), verMode, ackNum, ay: String(ay).substring(0, 4), formCode: String(formCode) });
      const res = await axios.post(`${this.baseUrl}/itrweb/auth/v0.1/everify/updateVerMode`, body, { headers, timeout: 15000 });
      if (!res.data?.successFlag) throw this._mapClientError(res.data?.errors?.[0]?.code, res.data?.errors?.[0]?.desc || 'Update ver mode failed');
      return { successFlag: true };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapERIError(error);
    }
  }

  async generateEvc(pan, ackNum, ay, formCode, verMode) {
    if (this.mode === 'MOCK') return { transactionId: `MOCK-EVC-${Date.now()}`, successFlag: true };
    try {
      const headers = await this._authHeaders();
      const body = this._buildSignedBody({ serviceName: 'EriGenerateEvcService', pan: pan.toUpperCase(), verMode, ackNum, ay: String(ay).substring(0, 4), formCode: String(formCode) });
      const res = await axios.post(`${this.baseUrl}/itrweb/auth/v0.1/everify/generateEvc`, body, { headers, timeout: 15000 });
      const d = res.data;
      if (!d.successFlag) throw this._mapClientError(d.errors?.[0]?.code, d.errors?.[0]?.desc || 'Generate EVC failed');
      return { transactionId: d.transactionId, successFlag: true };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapERIError(error);
    }
  }

  async verifyEvc(pan, ackNum, ay, formCode, verMode, transactionId, otpValue, evcValue) {
    if (this.mode === 'MOCK') return { successFlag: true };
    try {
      const headers = await this._authHeaders();
      const body = this._buildSignedBody({ serviceName: 'EriVerifyEvcService', pan: pan.toUpperCase(), ay: String(ay).substring(0, 4), formCode: String(formCode), ackNum, transactionId, verMode, otpValue: otpValue || '', evcValue: evcValue || '' });
      const res = await axios.post(`${this.baseUrl}/itrweb/auth/v0.1/everify/verifyEvc`, body, { headers, timeout: 15000 });
      const d = res.data;
      if (!d.successFlag) throw this._mapClientError(d.errors?.[0]?.code, d.errors?.[0]?.desc || 'Verify EVC failed');
      enterpriseLogger.info('ERI e-verification complete', { pan: this._maskPan(pan), ackNum });
      return { successFlag: true };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapERIError(error);
    }
  }

  // ══════════════════════════════════════════════════════
  // ACKNOWLEDGEMENT API (API_AcknowledgementFlow)
  // ══════════════════════════════════════════════════════

  async getAcknowledgement(pan, arnNumber) {
    if (this.mode === 'MOCK') return { success: true, pdf: Buffer.from('Mock ITR-V PDF'), filename: `ITR-V_${arnNumber}.pdf` };
    try {
      const headers = await this._authHeaders();
      const body = this._buildSignedBody({ serviceName: 'EriGetAckowledgement', pan: pan.toUpperCase(), arnNumber });
      const res = await axios.post(`${this.baseUrl}/itrweb/auth/v0.1/returns/getAcknowledgement`, body, { headers, timeout: 30000, responseType: 'arraybuffer' });
      if (res.headers['content-type']?.includes('application/json')) {
        const jsonResp = JSON.parse(res.data.toString());
        if (!jsonResp.successFlag) throw this._mapClientError(jsonResp.messages?.[0]?.code, jsonResp.messages?.[0]?.desc || 'Get acknowledgement failed');
      }
      enterpriseLogger.info('ERI acknowledgement downloaded', { pan: this._maskPan(pan), arnNumber });
      return { success: true, pdf: Buffer.from(res.data), filename: `ITR-V_${arnNumber}.pdf` };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw mapERIError(error);
    }
  }

  // ── Legacy aliases for backward compatibility ──
  async validatePAN(pan) { if (this.mode === 'MOCK') return this.mockPanVerification(pan); throw new AppError(ErrorCodes.UPSTREAM_ERROR, 'Use SurePass for PAN validation', 501); }
  async getPrefilledData(pan, ay) { if (this.mode === 'MOCK') return this.mockPreviousItrData(pan, ay); return this.requestPrefillOTP(pan, ay, 'E'); }
  async getForm26AS() { return { success: true, data: { tds: [] }, message: '26AS is part of prefill — use requestPrefillOTP + getPrefill' }; }
  async getAIS() { return { success: true, data: { incomes: [] }, message: 'AIS is part of prefill — use requestPrefillOTP + getPrefill' }; }
  async downloadITRV(ackNum) { return this.getAcknowledgement('', ackNum); }
  async getFilingStatus(ackNum) { if (this.mode === 'MOCK') return this.mockAcknowledgementFetch(ackNum); return this.mockAcknowledgementFetch(ackNum); }

  // ── Shared: build signed request body + auth headers ──

  _buildSignedBody(dataObj) {
    const dataJson = JSON.stringify(dataObj);
    const dataBase64 = Buffer.from(dataJson).toString('base64');
    const signature = this.signPayload(dataJson);
    return { data: dataBase64, sign: signature, eriUserId: this.eriUserId };
  }

  async _authHeaders() {
    const token = await this.authenticate();
    return {
      'Content-Type': 'application/json',
      'clientId': this.clientId,
      'clientSecret': this.clientSecret,
      'authToken': token,
      'accessMode': 'API',
    };
  }

  // ══════════════════════════════════════════════════════
  // ADD CLIENT APIs (API_AddClientFlow_v1.1)
  // Base: /itrweb/auth/v0.1/client/
  // ══════════════════════════════════════════════════════

  /**
   * Step 1a: Add a REGISTERED taxpayer as client.
   * Sends OTP to taxpayer's mobile/email.
   * @param {string} pan - Taxpayer PAN
   * @param {string} dob - YYYY-MM-DD
   * @param {string} otpSource - "E" (e-Filing OTP) or "A" (Aadhaar OTP)
   * @returns {{ transactionId, successFlag, httpStatus }}
   */
  async addClient(pan, dob, otpSource = 'E') {
    if (this.mode === 'MOCK') {
      return { transactionId: `MOCK-TXN-${Date.now()}`, successFlag: true, httpStatus: 'SUBMITTED' };
    }

    try {
      const headers = await this._authHeaders();
      const body = this._buildSignedBody({
        serviceName: 'EriAddClientService',
        pan: pan.toUpperCase(),
        dateOfBirth: dob,
        otpSourceFlag: otpSource,
      });

      const res = await axios.post(`${this.baseUrl}/itrweb/auth/v0.1/client/addClient`, body, {
        headers, timeout: 15000,
      });

      const d = res.data;
      if (!d.successFlag) {
        const errMsg = d.errors?.[0]?.desc || d.messages?.[0]?.desc || 'Add client failed';
        const errCode = d.errors?.[0]?.code || 'UNKNOWN';
        throw this._mapClientError(errCode, errMsg);
      }

      enterpriseLogger.info('ERI addClient OTP sent', { pan: this._maskPan(pan), txn: d.transactionId });
      return { transactionId: d.transactionId, successFlag: true, httpStatus: d.httpStatus };
    } catch (error) {
      if (error instanceof AppError) throw error;
      enterpriseLogger.error('ERI addClient failed', { pan: this._maskPan(pan), error: error.message });
      throw mapERIError(error);
    }
  }

  /**
   * Step 1b: Validate OTP to confirm adding a REGISTERED taxpayer.
   * @param {string} pan
   * @param {string} transactionId - from addClient response
   * @param {string} otpSource - "E" or "A" (must match addClient call)
   * @param {string} otp - 6-digit OTP
   * @param {string} validUpto - YYYY-MM-DD (min 1 month, max 1 year from now)
   */
  async validateClientOtp(pan, transactionId, otpSource, otp, validUpto) {
    if (this.mode === 'MOCK') {
      return { successFlag: true, httpStatus: 'ACCEPTED' };
    }

    try {
      const headers = await this._authHeaders();
      headers['Authorization'] = headers['authToken'];
      const body = this._buildSignedBody({
        serviceName: 'EriValidateClientService',
        pan: pan.toUpperCase(),
        transactionId,
        otpSourceFlag: otpSource,
        Otp: otp,
        validUpto,
      });

      const res = await axios.post(`${this.baseUrl}/itrweb/auth/v0.1/client/validateClientOtp`, body, {
        headers, timeout: 15000,
      });

      const d = res.data;
      if (!d.successFlag) {
        const errMsg = d.errors?.[0]?.desc || 'OTP validation failed';
        const errCode = d.errors?.[0]?.code || 'UNKNOWN';
        throw this._mapClientError(errCode, errMsg);
      }

      enterpriseLogger.info('ERI client added successfully', { pan: this._maskPan(pan) });
      return { successFlag: true, httpStatus: d.httpStatus };
    } catch (error) {
      if (error instanceof AppError) throw error;
      enterpriseLogger.error('ERI validateClientOtp failed', { pan: this._maskPan(pan), error: error.message });
      throw mapERIError(error);
    }
  }

  /**
   * Step 2a: Register + add an UNREGISTERED taxpayer as client.
   * Sends OTP to the provided mobile + email.
   * @param {object} details - Full taxpayer registration details
   */
  async registerClient(details) {
    if (this.mode === 'MOCK') {
      return {
        smsTransactionId: `MOCK-SMS-${Date.now()}`,
        emailTransactionId: `MOCK-EMAIL-${Date.now()}`,
        successFlag: true,
        httpStatus: 'SUBMITTED',
      };
    }

    try {
      const headers = await this._authHeaders();
      headers['Authorization'] = headers['authToken'];
      const body = this._buildSignedBody({
        serviceName: 'EriRegisterClient',
        pan: (details.pan || '').toUpperCase(),
        residentialStatusCd: details.residentialStatus || 'RES',
        firstName: details.firstName || '',
        lastName: details.lastName || '',
        midName: details.middleName || '',
        dateOfBirth: details.dob || '',
        userGender: details.gender || 'M',
        priMobileNum: details.mobile || '',
        isdCd: details.isdCode || '91',
        priMobBelongsTo: details.mobileBelongsTo || '1',
        priEmailRelationId: details.emailBelongsTo || '1',
        priEmailId: details.email || '',
        addrLine1Txt: details.flatDoorBlock || '',
        addrLine2Txt: details.premisesBuilding || '',
        addrLine3Txt: details.areaLocality || '',
        addrLine4Txt: details.districtCity || '',
        addrLine5Txt: details.postOffice || '',
        pinCd: details.pincode || '',
        zipCd: details.zipCode || '',
        stdCd: details.stdCode || '',
        countryCd: details.countryCode || '91',
        landlineNo: details.landline || '',
        stateCd: details.stateCode || '',
        foreignStateDesc: details.foreignState || '',
      });

      const res = await axios.post(`${this.baseUrl}/itrweb/auth/v0.1/client/registerClient`, body, {
        headers, timeout: 15000,
      });

      const d = res.data;
      if (!d.successFlag) {
        const errMsg = d.errors?.[0]?.desc || 'Register client failed';
        const errCode = d.errors?.[0]?.code || 'UNKNOWN';
        throw this._mapClientError(errCode, errMsg);
      }

      enterpriseLogger.info('ERI registerClient OTP sent', { pan: this._maskPan(details.pan) });
      return {
        smsTransactionId: d.smsTransactionId,
        emailTransactionId: d.emailTransactionId,
        successFlag: true,
        httpStatus: d.httpStatus,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      enterpriseLogger.error('ERI registerClient failed', { error: error.message });
      throw mapERIError(error);
    }
  }

  /**
   * Step 2b: Validate OTP to confirm registering + adding an UNREGISTERED taxpayer.
   * @param {string} pan
   * @param {string} smsTransactionId
   * @param {string} emailTransactionId
   * @param {string} mobileOtp
   * @param {string} emailOtp
   * @param {string} validUpto - YYYY-MM-DD
   */
  async validateRegOtp(pan, smsTransactionId, emailTransactionId, mobileOtp, emailOtp, validUpto) {
    if (this.mode === 'MOCK') {
      return { successFlag: true, httpStatus: 'ACCEPTED' };
    }

    try {
      const headers = await this._authHeaders();
      headers['Authorization'] = headers['authToken'];
      const body = this._buildSignedBody({
        serviceName: 'EriValidateRegOtp',
        pan: pan.toUpperCase(),
        smsTransactionId,
        emailTransactionId,
        mobileOtp,
        emailOtp,
        validUpto,
      });

      const res = await axios.post(`${this.baseUrl}/itrweb/auth/v0.1/client/validateRegOtp`, body, {
        headers, timeout: 15000,
      });

      const d = res.data;
      if (!d.successFlag) {
        const errMsg = d.errors?.[0]?.desc || 'Registration OTP validation failed';
        const errCode = d.errors?.[0]?.code || 'UNKNOWN';
        throw this._mapClientError(errCode, errMsg);
      }

      enterpriseLogger.info('ERI client registered + added', { pan: this._maskPan(pan) });
      return { successFlag: true, httpStatus: d.httpStatus };
    } catch (error) {
      if (error instanceof AppError) throw error;
      enterpriseLogger.error('ERI validateRegOtp failed', { pan: this._maskPan(pan), error: error.message });
      throw mapERIError(error);
    }
  }

  /**
   * Map ITD Add Client error codes to AppError
   */
  _mapClientError(code, desc) {
    const map = {
      EF30032: { appCode: ErrorCodes.ERI_CLIENT_ALREADY_LINKED, status: 409 },
      EF00116: { appCode: ErrorCodes.ERI_CLIENT_NOT_REGISTERED, status: 404 },
      EF00011: { appCode: ErrorCodes.INVALID_PAN, status: 400 },
      EF00047: { appCode: ErrorCodes.INVALID_PAN, status: 400 },
      EF00098: { appCode: ErrorCodes.ERI_PAN_INACTIVE, status: 400 },
      EF00099: { appCode: ErrorCodes.ERI_PAN_AADHAAR_NOT_LINKED, status: 400 },
      EF00128: { appCode: ErrorCodes.ERI_OTP_EXPIRED, status: 400 },
      EF40088: { appCode: ErrorCodes.ERI_OTP_INVALID, status: 400 },
      EF00072: { appCode: ErrorCodes.ERI_OTP_INVALID, status: 400 },
      EF00073: { appCode: ErrorCodes.ERI_OTP_INVALID, status: 400 },
      EF00152: { appCode: ErrorCodes.ERI_OTP_LIMIT_EXCEEDED, status: 429 },
      EF00153: { appCode: ErrorCodes.ERI_OTP_LIMIT_EXCEEDED, status: 429 },
      EF30045: { appCode: ErrorCodes.ERI_TRANSACTION_INVALID, status: 400 },
      EF30043: { appCode: ErrorCodes.ERI_TRANSACTION_INVALID, status: 400 },
      EF500023: { appCode: ErrorCodes.UPSTREAM_SESSION_EXPIRED, status: 401 },
      EF00066: { appCode: ErrorCodes.VALIDATION_FAILED, status: 400 },
      EF00065: { appCode: ErrorCodes.VALIDATION_FAILED, status: 400 },
      EF00067: { appCode: ErrorCodes.VALIDATION_FAILED, status: 400 },
      EF40000: { appCode: ErrorCodes.INVALID_JSON, status: 400 },
      EF20123: { appCode: ErrorCodes.INVALID_JSON, status: 400 },
    };
    const mapped = map[code];
    if (mapped) {
      return new AppError(mapped.appCode, desc, mapped.status, { eriCode: code });
    }
    return new AppError(ErrorCodes.ERI_CLIENT_ADD_FAILED, desc, 500, { eriCode: code });
  }

  // ── Mock methods for development/testing ──

  async mockPanVerification(pan) {
    enterpriseLogger.info('Mock PAN verification', { pan });
    return {
      success: true,
      data: {
        pan: pan.toUpperCase(),
        name: 'MOCK USER SURNAME',
        firstName: 'MOCK',
        lastName: 'USER',
        dateOfBirth: '1990-01-01',
        category: 'Individual',
      },
    };
  }

  async mockPreviousItrData(pan, assessmentYear) {
    enterpriseLogger.info('Mock Previous ITR Data', { pan, assessmentYear });
    return {
      success: true,
      data: {
        pan: pan.toUpperCase(),
        fullName: 'MOCK USER',
        email: 'mock@example.com',
        phone: '9876543210',
        dateOfBirth: '1990-01-01',
        address: 'MOCK ADDRESS, BANGALORE',
        income: { salary: 750000, interestIncome: 12000, dividendIncome: 4500, otherIncome: 0 },
        deductions: { section80C: 150000, section80D: 25000 },
        taxesPaid: { tds: 45000, advanceTax: 10000 },
        bankAccountNumber: '998877665544',
        ifscCode: 'ICIC0001234',
        bankName: 'ICICI BANK',
      },
    };
  }

  async mockAcknowledgementFetch(ackNumber) {
    enterpriseLogger.info('Mock Acknowledgement Fetch', { ackNumber });
    return {
      success: true,
      status: 'COMPLETED',
      acknowledgementNumber: ackNumber,
      data: { status: 'Success', filingDate: new Date().toISOString() },
    };
  }

  async _mockSubmission(itrType) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() < 0.1) {
          reject(new AppError(ErrorCodes.UPSTREAM_ERROR, 'Simulated ERI Network Failure', 503));
          return;
        }
        resolve({
          ackNumber: `ACK-${Date.now()}-${itrType}`,
          status: 'SUBMITTED',
          token: `MOCK-TOKEN-${Math.random().toString(36).substring(7)}`,
          timestamp: new Date().toISOString(),
        });
      }, 1500);
    });
  }
}

module.exports = new ERIGatewayService();
