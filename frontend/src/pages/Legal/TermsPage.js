/**
 * Terms of Service — BurnBlack ITR Filing Platform
 */

import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Page, Card } from '../../components/ds';
import P from '../../styles/palette';

export default function TermsPage() {
  const navigate = useNavigate();

  return (
    <Page title="Terms of Service" subtitle="Last updated: April 2026" maxWidth={720}>
      <button onClick={() => navigate(-1)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: P.brand, background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 16px', minHeight: 'auto' }}>
        <ArrowLeft size={13} /> Back
      </button>

      <Card>
        <Section t="1. About BurnBlack">
          BurnBlack is an online income tax return (ITR) filing platform operated by HJR Consultancy India Private Limited. We provide tools for Indian taxpayers to prepare, validate, and file their income tax returns electronically.
        </Section>

        <Section t="2. Eligibility">
          You must be 18 years or older and a valid PAN holder to use our filing services. By creating an account, you confirm that the information you provide is accurate and that you are authorized to file the return for the PAN you register.
        </Section>

        <Section t="3. Services">
          BurnBlack provides: ITR preparation for ITR-1 through ITR-4, document import and parsing (Form 16, 26AS, AIS), real-time tax computation with old vs new regime comparison, ITR JSON generation for manual upload to the ITD portal, and (when available) direct ERI submission to the Income Tax Department. We are a registered E-Return Intermediary (ERI ID: ERIP013662).
        </Section>

        <Section t="4. User Responsibilities">
          You are responsible for the accuracy of all data entered in your filing. BurnBlack provides computation tools and validation, but the final responsibility for the correctness of your income tax return lies with you as the taxpayer. You must e-verify your return within 30 days of filing as required by the Income Tax Department.
        </Section>

        <Section t="5. Pricing and Payments">
          Filing is free for individuals with income up to ₹5 lakh (ITR-1/ITR-4). Paid plans start at ₹149 + GST. Payments are processed securely via Razorpay. All prices are in Indian Rupees and include applicable GST. Refunds are available within 7 days of payment if you have not downloaded the ITR JSON.
        </Section>

        <Section t="6. Data Security">
          Your data is encrypted in transit (TLS 1.2+) and at rest (AES-256). We store data on servers located in India. We do not sell, share, or rent your personal or financial data to third parties. PAN verification is performed via authorized KYC APIs. Your Aadhaar number, if provided, is used solely for e-verification purposes.
        </Section>

        <Section t="7. Intellectual Property">
          All content, design, code, and branding on BurnBlack are the property of HJR Consultancy India Private Limited. You may not copy, modify, or distribute any part of the platform without written permission.
        </Section>

        <Section t="8. Limitation of Liability">
          BurnBlack provides tax computation tools based on published Income Tax Act rules and slabs. We are not a substitute for professional tax advice. We are not liable for any penalties, interest, or demands arising from errors in your filed return. Our maximum liability is limited to the amount you paid for the service.
        </Section>

        <Section t="9. Account Termination">
          We may suspend or terminate your account if you violate these terms, provide false information, or use the platform for fraudulent purposes. You may delete your account at any time from the Settings page. Upon deletion, your personal data will be anonymized within 30 days, and filing records will be retained for the legally required period (7 years).
        </Section>

        <Section t="10. Changes to Terms">
          We may update these terms from time to time. Material changes will be communicated via email to registered users. Continued use of the platform after changes constitutes acceptance of the updated terms.
        </Section>

        <Section t="11. Governing Law">
          These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Bengaluru, Karnataka.
        </Section>

        <Section t="12. Contact">
          For questions about these terms, contact us at support@burnblack.in or write to: HJR Consultancy India Private Limited, Bengaluru, Karnataka, India.
        </Section>
      </Card>
    </Page>
  );
}

function Section({ t, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: P.textPrimary, margin: '0 0 6px' }}>{t}</h3>
      <p style={{ fontSize: 13, color: P.textSecondary, lineHeight: 1.7, margin: 0 }}>{children}</p>
    </div>
  );
}
