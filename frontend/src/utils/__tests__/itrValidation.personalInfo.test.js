import {
  validatePersonalInfo,
  validateTDS2Entry,
  validateDonation80G,
} from '../itrValidation';

// ── Helper: valid personal info object ──
const validPersonalInfo = () => ({
  firstName: 'Rahul',
  lastName: 'Sharma',
  pan: 'ABCDE1234F',
  dob: '1990-05-15',
  aadhaar: '123456789012',
  email: 'rahul@example.com',
  phone: '9876543210',
  residentialStatus: 'RES',
  employerCategory: 'OTH',
  filingStatus: 'O',
  address: {
    flatDoorBuilding: '12A',
    city: 'Mumbai',
    stateCode: '27',
    pincode: '400001',
  },
});

describe('validatePersonalInfo', () => {
  it('returns valid for complete valid data', () => {
    const result = validatePersonalInfo(validPersonalInfo());
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('returns error when data is null', () => {
    const result = validatePersonalInfo(null);
    expect(result.valid).toBe(false);
    expect(result.errors._form).toBeDefined();
  });

  // ── Name fields ──
  it('requires firstName', () => {
    const data = validPersonalInfo();
    data.firstName = '';
    expect(validatePersonalInfo(data).errors.firstName).toBeDefined();
  });

  it('rejects firstName with numbers', () => {
    const data = validPersonalInfo();
    data.firstName = 'Rahul123';
    expect(validatePersonalInfo(data).errors.firstName).toBeDefined();
  });

  it('rejects firstName over 50 chars', () => {
    const data = validPersonalInfo();
    data.firstName = 'A'.repeat(51);
    expect(validatePersonalInfo(data).errors.firstName).toBeDefined();
  });

  it('accepts firstName with dots and spaces', () => {
    const data = validPersonalInfo();
    data.firstName = 'R. K. Sharma';
    expect(validatePersonalInfo(data).errors.firstName).toBeUndefined();
  });

  it('requires lastName', () => {
    const data = validPersonalInfo();
    data.lastName = '';
    expect(validatePersonalInfo(data).errors.lastName).toBeDefined();
  });

  // ── PAN ──
  it('requires PAN', () => {
    const data = validPersonalInfo();
    data.pan = '';
    expect(validatePersonalInfo(data).errors.pan).toBeDefined();
  });

  it('rejects invalid PAN format', () => {
    const data = validPersonalInfo();
    data.pan = 'INVALID';
    expect(validatePersonalInfo(data).errors.pan).toBeDefined();
  });

  it('accepts valid PAN', () => {
    const data = validPersonalInfo();
    data.pan = 'ZZZZZ9999Z';
    expect(validatePersonalInfo(data).errors.pan).toBeUndefined();
  });

  // ── DOB ──
  it('requires DOB', () => {
    const data = validPersonalInfo();
    data.dob = '';
    expect(validatePersonalInfo(data).errors.dob).toBeDefined();
  });

  it('rejects future DOB', () => {
    const data = validPersonalInfo();
    data.dob = '2099-01-01';
    expect(validatePersonalInfo(data).errors.dob).toBeDefined();
  });

  it('rejects age over 150', () => {
    const data = validPersonalInfo();
    data.dob = '1800-01-01';
    expect(validatePersonalInfo(data).errors.dob).toBeDefined();
  });

  it('rejects invalid date string', () => {
    const data = validPersonalInfo();
    data.dob = 'not-a-date';
    expect(validatePersonalInfo(data).errors.dob).toBeDefined();
  });

  // ── Aadhaar ──
  it('requires Aadhaar', () => {
    const data = validPersonalInfo();
    data.aadhaar = '';
    expect(validatePersonalInfo(data).errors.aadhaar).toBeDefined();
  });

  it('rejects non-12-digit Aadhaar', () => {
    const data = validPersonalInfo();
    data.aadhaar = '12345';
    expect(validatePersonalInfo(data).errors.aadhaar).toBeDefined();
  });

  // ── Email ──
  it('requires email', () => {
    const data = validPersonalInfo();
    data.email = '';
    expect(validatePersonalInfo(data).errors.email).toBeDefined();
  });

  it('rejects invalid email', () => {
    const data = validPersonalInfo();
    data.email = 'notanemail';
    expect(validatePersonalInfo(data).errors.email).toBeDefined();
  });

  // ── Phone ──
  it('requires phone', () => {
    const data = validPersonalInfo();
    data.phone = '';
    expect(validatePersonalInfo(data).errors.phone).toBeDefined();
  });

  it('rejects phone not starting with 6-9', () => {
    const data = validPersonalInfo();
    data.phone = '1234567890';
    expect(validatePersonalInfo(data).errors.phone).toBeDefined();
  });

  it('rejects phone with wrong length', () => {
    const data = validPersonalInfo();
    data.phone = '98765';
    expect(validatePersonalInfo(data).errors.phone).toBeDefined();
  });

  // ── Enums ──
  it('requires residentialStatus', () => {
    const data = validPersonalInfo();
    data.residentialStatus = '';
    expect(validatePersonalInfo(data).errors.residentialStatus).toBeDefined();
  });

  it('rejects invalid residentialStatus', () => {
    const data = validPersonalInfo();
    data.residentialStatus = 'INVALID';
    expect(validatePersonalInfo(data).errors.residentialStatus).toBeDefined();
  });

  it('requires employerCategory', () => {
    const data = validPersonalInfo();
    data.employerCategory = '';
    expect(validatePersonalInfo(data).errors.employerCategory).toBeDefined();
  });

  it('rejects invalid employerCategory', () => {
    const data = validPersonalInfo();
    data.employerCategory = 'XYZ';
    expect(validatePersonalInfo(data).errors.employerCategory).toBeDefined();
  });

  it('requires filingStatus', () => {
    const data = validPersonalInfo();
    data.filingStatus = '';
    expect(validatePersonalInfo(data).errors.filingStatus).toBeDefined();
  });

  it('rejects invalid filingStatus', () => {
    const data = validPersonalInfo();
    data.filingStatus = 'X';
    expect(validatePersonalInfo(data).errors.filingStatus).toBeDefined();
  });

  // ── Conditional fields ──
  it('requires originalAckNumber when filingStatus is R', () => {
    const data = validPersonalInfo();
    data.filingStatus = 'R';
    const result = validatePersonalInfo(data);
    expect(result.errors.originalAckNumber).toBeDefined();
  });

  it('does not require originalAckNumber when filingStatus is O', () => {
    const data = validPersonalInfo();
    data.filingStatus = 'O';
    const result = validatePersonalInfo(data);
    expect(result.errors.originalAckNumber).toBeUndefined();
  });

  it('accepts revised return with originalAckNumber', () => {
    const data = validPersonalInfo();
    data.filingStatus = 'R';
    data.originalAckNumber = '123456789012345';
    const result = validatePersonalInfo(data);
    expect(result.errors.originalAckNumber).toBeUndefined();
  });

  it('requires updatedReturnReason when filingStatus is U', () => {
    const data = validPersonalInfo();
    data.filingStatus = 'U';
    const result = validatePersonalInfo(data);
    expect(result.errors.updatedReturnReason).toBeDefined();
  });

  it('does not require updatedReturnReason when filingStatus is B', () => {
    const data = validPersonalInfo();
    data.filingStatus = 'B';
    const result = validatePersonalInfo(data);
    expect(result.errors.updatedReturnReason).toBeUndefined();
  });

  // ── Address ──
  it('requires address.flatDoorBuilding', () => {
    const data = validPersonalInfo();
    data.address.flatDoorBuilding = '';
    expect(validatePersonalInfo(data).errors['address.flatDoorBuilding']).toBeDefined();
  });

  it('requires address.city', () => {
    const data = validPersonalInfo();
    data.address.city = '';
    expect(validatePersonalInfo(data).errors['address.city']).toBeDefined();
  });

  it('requires address.stateCode', () => {
    const data = validPersonalInfo();
    data.address.stateCode = '';
    expect(validatePersonalInfo(data).errors['address.stateCode']).toBeDefined();
  });

  it('requires address.pincode', () => {
    const data = validPersonalInfo();
    data.address.pincode = '';
    expect(validatePersonalInfo(data).errors['address.pincode']).toBeDefined();
  });

  it('rejects pincode starting with 0', () => {
    const data = validPersonalInfo();
    data.address.pincode = '012345';
    expect(validatePersonalInfo(data).errors['address.pincode']).toBeDefined();
  });

  it('rejects pincode with wrong length', () => {
    const data = validPersonalInfo();
    data.address.pincode = '12345';
    expect(validatePersonalInfo(data).errors['address.pincode']).toBeDefined();
  });

  it('handles missing address object gracefully', () => {
    const data = validPersonalInfo();
    delete data.address;
    const result = validatePersonalInfo(data);
    expect(result.valid).toBe(false);
    expect(result.errors['address.flatDoorBuilding']).toBeDefined();
  });
});

describe('validateTDS2Entry', () => {
  const validEntry = () => ({
    deductorTan: 'ABCD12345E',
    deductorName: 'State Bank of India',
    sectionCode: '194A',
    amountPaid: 50000,
    tdsDeducted: 5000,
    tdsClaimed: 5000,
  });

  it('returns valid for complete valid entry', () => {
    const result = validateTDS2Entry(validEntry());
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('returns error when entry is null', () => {
    const result = validateTDS2Entry(null);
    expect(result.valid).toBe(false);
    expect(result.errors._form).toBeDefined();
  });

  it('requires deductorTan', () => {
    const entry = validEntry();
    entry.deductorTan = '';
    expect(validateTDS2Entry(entry).errors.deductorTan).toBeDefined();
  });

  it('rejects invalid TAN format', () => {
    const entry = validEntry();
    entry.deductorTan = 'INVALID';
    expect(validateTDS2Entry(entry).errors.deductorTan).toBeDefined();
  });

  it('requires deductorName', () => {
    const entry = validEntry();
    entry.deductorName = '';
    expect(validateTDS2Entry(entry).errors.deductorName).toBeDefined();
  });

  it('requires sectionCode', () => {
    const entry = validEntry();
    entry.sectionCode = '';
    expect(validateTDS2Entry(entry).errors.sectionCode).toBeDefined();
  });

  it('rejects negative amountPaid', () => {
    const entry = validEntry();
    entry.amountPaid = -100;
    expect(validateTDS2Entry(entry).errors.amountPaid).toBeDefined();
  });

  it('rejects negative tdsDeducted', () => {
    const entry = validEntry();
    entry.tdsDeducted = -1;
    expect(validateTDS2Entry(entry).errors.tdsDeducted).toBeDefined();
  });

  it('rejects negative tdsClaimed', () => {
    const entry = validEntry();
    entry.tdsClaimed = -1;
    expect(validateTDS2Entry(entry).errors.tdsClaimed).toBeDefined();
  });

  it('accepts zero amounts', () => {
    const entry = validEntry();
    entry.amountPaid = 0;
    entry.tdsDeducted = 0;
    entry.tdsClaimed = 0;
    const result = validateTDS2Entry(entry);
    expect(result.errors.amountPaid).toBeUndefined();
    expect(result.errors.tdsDeducted).toBeUndefined();
    expect(result.errors.tdsClaimed).toBeUndefined();
  });
});

describe('validateDonation80G', () => {
  const validDonation = () => ({
    doneeName: 'PM National Relief Fund',
    doneePan: 'AAAPN0001A',
    amount: 10000,
    category: '100_no_limit',
  });

  it('returns valid for complete valid entry', () => {
    const result = validateDonation80G(validDonation());
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  it('returns error when entry is null', () => {
    const result = validateDonation80G(null);
    expect(result.valid).toBe(false);
    expect(result.errors._form).toBeDefined();
  });

  it('requires doneeName', () => {
    const entry = validDonation();
    entry.doneeName = '';
    expect(validateDonation80G(entry).errors.doneeName).toBeDefined();
  });

  it('requires amount > 0', () => {
    const entry = validDonation();
    entry.amount = 0;
    expect(validateDonation80G(entry).errors.amount).toBeDefined();
  });

  it('rejects negative amount', () => {
    const entry = validDonation();
    entry.amount = -500;
    expect(validateDonation80G(entry).errors.amount).toBeDefined();
  });

  it('requires doneePan when amount > 2000', () => {
    const entry = validDonation();
    entry.amount = 5000;
    entry.doneePan = '';
    expect(validateDonation80G(entry).errors.doneePan).toBeDefined();
  });

  it('does not require doneePan when amount <= 2000', () => {
    const entry = validDonation();
    entry.amount = 2000;
    entry.doneePan = '';
    expect(validateDonation80G(entry).errors.doneePan).toBeUndefined();
  });

  it('rejects invalid doneePan format', () => {
    const entry = validDonation();
    entry.doneePan = 'INVALID';
    expect(validateDonation80G(entry).errors.doneePan).toBeDefined();
  });

  it('requires category', () => {
    const entry = validDonation();
    entry.category = '';
    expect(validateDonation80G(entry).errors.category).toBeDefined();
  });

  it('rejects invalid category', () => {
    const entry = validDonation();
    entry.category = 'invalid_category';
    expect(validateDonation80G(entry).errors.category).toBeDefined();
  });

  it('accepts all four valid categories', () => {
    const categories = ['100_no_limit', '100_with_limit', '50_no_limit', '50_with_limit'];
    categories.forEach((cat) => {
      const entry = validDonation();
      entry.category = cat;
      expect(validateDonation80G(entry).errors.category).toBeUndefined();
    });
  });
});
