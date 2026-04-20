/**
 * Privacy Policy — BurnBlack ITR Filing Platform
 */

import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Page, Card } from '../../components/ds';
import P from '../../styles/palette';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <Page title="Privacy Policy" subtitle="Last updated: April 2026" maxWidth={720}>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: P.brand, background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 16px', minHeight: 'auto' }}>
        <ArrowLeft size={13} /> Back
      </button>

      <Card>
        <Section t="1. Who We Are">
          BurnBlack is operated by HJR Consultancy India Private Limited (CIN: pending), a company registered in India. We are a registered E-Return Intermediary (ERI ID: ERIP013662) authorized by the Income Tax Department to file returns on behalf of taxpayers.
        </Section>

        <Section t="2. Information We Collect">
          <strong>Account information:</strong> Name, email, phone number, PAN, date of birth, gender, Aadhaar number (optional).
          <br /><br />
          <strong>Financial information:</strong> Income details (salary, house property, capital gains, business income), deductions, TDS credits, bank account details — all entered by you during the filing process.
          <br /><br />
          <strong>Documents:</strong> Form 16, Form 26AS, AIS, and other tax documents you upload for parsing and auto-fill.
          <br /><br />
          <strong>Usage data:</strong> Login timestamps, device information, IP addresses, and session data for security and analytics.
        </Section>

        <Section t="3. How We Use Your Information">
          We use your information to: prepare and validate your income tax return, compute your tax liability, generate ITR JSON for filing, submit returns via ERI (when authorized), send filing status notifications and reminders, provide customer support, and improve our platform. We do not use your data for advertising or marketing to third parties.
        </Section>

        <Section t="4. PAN and Aadhaar Verification">
          PAN verification is performed via SurePass, an authorized KYC API provider. We send your PAN to SurePass to verify your identity and retrieve your name and date of birth. Aadhaar, if provided, is used solely for e-verification of your filed return via the Income Tax Department portal. We do not store your Aadhaar number in plain text — only a masked version for reference.
        </Section>

        <Section t="5. Data Storage and Security">
          Your data is stored on servers located in India (Neon PostgreSQL, hosted in Asia-Pacific region). All data is encrypted in transit using TLS 1.2+ and at rest using AES-256 encryption. Passwords are hashed using bcrypt with 12 rounds. We use JWT tokens for authentication with 1-hour expiry and secure HTTP-only cookies for refresh tokens.
        </Section>

        <Section t="6. Data Sharing">
          We do not sell, rent, or share your personal or financial data with any third party, except:
          <br /><br />
          • <strong>Income Tax Department:</strong> When you authorize us to submit your return via ERI, we transmit your ITR data to ITD.
          <br />
          • <strong>SurePass:</strong> Your PAN is sent for identity verification.
          <br />
          • <strong>Razorpay:</strong> Payment information is processed by Razorpay (PCI-DSS compliant). We do not store your card details.
          <br />
          • <strong>Law enforcement:</strong> If required by law, court order, or government authority.
        </Section>

        <Section t="7. Data Retention">
          Your filing data is retained for 7 years from the assessment year, as required by Indian tax law. Account profile data is retained as long as your account is active. Upon account deletion, personal data (name, email, phone, PAN) is anonymized within 30 days. Filing records are retained in anonymized form for the legally required period.
        </Section>

        <Section t="8. Your Rights">
          You have the right to: access all data we hold about you (via the Data Export feature in Settings), correct inaccurate data (via your Profile page), delete your account and personal data (via Settings → Delete Account), and withdraw consent for data processing (by deleting your account). Data export is available as a JSON download from your account settings.
        </Section>

        <Section t="9. Cookies">
          We use essential cookies for authentication (JWT refresh token) and session management. We do not use third-party tracking cookies, advertising cookies, or analytics cookies. No data is shared with Google Analytics, Facebook, or any advertising network.
        </Section>

        <Section t="10. Children">
          BurnBlack is not intended for use by individuals under 18 years of age. We do not knowingly collect data from minors. If you believe a minor has created an account, contact us to have it removed.
        </Section>

        <Section t="11. Changes to This Policy">
          We may update this privacy policy from time to time. Material changes will be communicated via email to registered users at least 7 days before they take effect. The "Last updated" date at the top of this page indicates when the policy was last revised.
        </Section>

        <Section t="12. Contact Us">
          For privacy-related questions or requests, contact our Data Protection Officer at privacy@burnblack.in or write to: HJR Consultancy India Private Limited, Bengaluru, Karnataka, India.
        </Section>
      </Card>
    </Page>
  );
}

function Section({ t, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: P.textPrimary, margin: '0 0 6px' }}>{t}</h3>
      <div style={{ fontSize: 13, color: P.textSecondary, lineHeight: 1.7 }}>{children}</div>
    </div>
  );
}
