/**
 * ComputationPDFService — Generates ITD-style tax computation PDF.
 *
 * Two-step design:
 * 1. assemblePDFData() — pure function, testable, returns structured data
 * 2. generatePDF() — renders PDF buffer using PDFKit
 */

const PDFDocument = require('pdfkit');
const enterpriseLogger = require('../../utils/logger');
const { AppError } = require('../../middleware/errorHandler');
const ErrorCodes = require('../../constants/ErrorCodes');

const n = (v) => Number(v) || 0;
const fmt = (v) => `${n(v).toLocaleString('en-IN')}`;

class ComputationPDFService {

  /**
   * Assemble all data needed for the PDF (pure function, no side effects).
   */
  static assemblePDFData(filing, computation) {
    const payload = filing.jsonPayload || {};
    const pi = payload.personalInfo || {};
    const regime = filing.selectedRegime || payload.selectedRegime || 'new';
    const best = computation?.[regime === 'old' ? 'oldRegime' : 'newRegime'] || {};
    const alt = computation?.[regime === 'old' ? 'newRegime' : 'oldRegime'] || {};
    const tds = computation?.tds || {};
    const income = computation?.income || {};
    const isComplete = !!(pi.firstName && pi.pan && pi.dob && payload.bankDetails?.bankName);

    return {
      header: {
        name: [pi.firstName, pi.middleName, pi.lastName].filter(Boolean).join(' ').toUpperCase() || 'TAXPAYER',
        pan: (filing.taxpayerPan || pi.pan || '').toUpperCase(),
        assessmentYear: filing.assessmentYear || '',
        itrType: filing.itrType || 'ITR-1',
        filingDate: filing.submittedAt ? new Date(filing.submittedAt).toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN'),
        regime: regime === 'old' ? 'Old Regime' : 'New Regime',
        ackNumber: filing.acknowledgmentNumber || '',
      },
      isComplete,
      income: {
        salary: { gross: n(income.salary?.grossSalary), exemptions: n(income.salary?.exemptAllowances) + n(income.salary?.salaryExemptions), stdDeduction: n(income.salary?.standardDeduction), profTax: n(income.salary?.professionalTax), net: n(income.salary?.netTaxable) },
        houseProperty: { type: income.houseProperty?.type || 'NONE', net: n(income.houseProperty?.netIncome) },
        otherSources: { savings: n(income.otherSources?.savingsInterest), fd: n(income.otherSources?.fdInterest), dividends: n(income.otherSources?.dividends), familyPension: n(income.otherSources?.familyPension), familyPensionExempt: n(income.otherSources?.familyPensionExempt), other: n(income.otherSources?.other) + n(income.otherSources?.interestOnITRefund) + n(income.otherSources?.winnings) + n(income.otherSources?.gifts), total: n(income.otherSources?.total) },
        agriculturalIncome: n(computation?.agriculturalIncome),
        grossTotal: n(income.grossTotal || best.grossTotalIncome),
      },
      deductions: {
        total: n(best.deductions),
        breakdown: best.deductionBreakdown || {},
      },
      tax: {
        taxableIncome: n(best.taxableIncome),
        taxOnIncome: n(best.taxOnIncome),
        rebate: n(best.rebate),
        surcharge: n(best.surcharge),
        cess: n(best.cess),
        totalTax: n(best.totalTax),
        slabs: best.slabBreakdown || [],
      },
      tds: {
        fromSalary: n(tds.fromSalary),
        fromNonSalary: n(tds.fromNonSalary),
        advanceTax: n(tds.advanceTax),
        selfAssessment: n(tds.selfAssessment),
        total: n(tds.total),
      },
      result: {
        netPayable: n(best.netPayable),
        isRefund: n(best.netPayable) <= 0,
      },
      comparison: regime === 'old' ? {
        altRegime: 'New Regime',
        altTax: n(alt.totalTax),
        savings: Math.abs(n(best.totalTax) - n(alt.totalTax)),
        betterRegime: n(best.totalTax) <= n(alt.totalTax) ? regime : (regime === 'old' ? 'new' : 'old'),
      } : null,
    };
  }

  /**
   * Generate PDF buffer from assembled data.
   */
  static async generatePDF(pdfData) {
    try {
      return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ size: 'A4', margin: 50, info: { Title: `Tax Computation — ${pdfData.header.pan}`, Author: 'BurnBlack' } });
        const chunks = [];
        doc.on('data', c => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        const W = 495; // usable width
        const gold = '#D4AF37';
        const black = '#0F0F0F';
        const gray = '#666666';
        const lightGray = '#E8E8E4';

        // ── Header ──
        doc.rect(50, 50, W, 60).fill(black);
        doc.fontSize(16).fillColor('#FFFFFF').text('BurnBlack', 65, 62, { width: W - 30 });
        doc.fontSize(9).fillColor(gold).text('Tax Computation Sheet', 65, 82);
        doc.fillColor('#FFFFFF').fontSize(9).text(pdfData.header.regime, 400, 62, { width: 130, align: 'right' });
        doc.text(pdfData.header.itrType, 400, 75, { width: 130, align: 'right' });
        doc.text(`AY ${pdfData.header.assessmentYear}`, 400, 88, { width: 130, align: 'right' });

        // Draft watermark
        if (!pdfData.isComplete) {
          doc.save();
          doc.rotate(-45, { origin: [300, 400] });
          doc.fontSize(60).fillColor('#FECACA').opacity(0.3).text('DRAFT', 100, 350);
          doc.restore().opacity(1);
        }

        let y = 125;

        // ── Taxpayer Details ──
        doc.fillColor(black).fontSize(10).font('Helvetica-Bold').text('Taxpayer Details', 50, y);
        y += 16;
        const details = [
          ['Name', pdfData.header.name],
          ['PAN', pdfData.header.pan],
          ['Assessment Year', pdfData.header.assessmentYear],
          ['Filing Date', pdfData.header.filingDate],
        ];
        if (pdfData.header.ackNumber) details.push(['Ack. No.', pdfData.header.ackNumber]);
        details.forEach(([label, value]) => {
          doc.font('Helvetica').fontSize(9).fillColor(gray).text(label, 60, y, { width: 120 });
          doc.font('Helvetica-Bold').fillColor(black).text(value, 180, y, { width: 300 });
          y += 14;
        });

        y += 8;
        doc.moveTo(50, y).lineTo(545, y).strokeColor(lightGray).stroke();
        y += 12;

        // ── Step 1: Income ──
        y = this._section(doc, '1. Income', y, W);
        y = this._row(doc, 'Salary (Gross)', fmt(pdfData.income.salary.gross), y);
        if (pdfData.income.salary.exemptions > 0) y = this._row(doc, '  Less: Exemptions', `-${fmt(pdfData.income.salary.exemptions)}`, y, gray);
        y = this._row(doc, '  Less: Standard Deduction', `-${fmt(pdfData.income.salary.stdDeduction)}`, y, gray);
        if (pdfData.income.salary.profTax > 0) y = this._row(doc, '  Less: Professional Tax', `-${fmt(pdfData.income.salary.profTax)}`, y, gray);
        y = this._row(doc, '  Net Salary', fmt(pdfData.income.salary.net), y, black, true);
        if (pdfData.income.houseProperty.type !== 'NONE') y = this._row(doc, `House Property (${pdfData.income.houseProperty.type})`, fmt(pdfData.income.houseProperty.net), y);
        if (pdfData.income.otherSources.total > 0) y = this._row(doc, 'Other Sources', fmt(pdfData.income.otherSources.total), y);
        if (pdfData.income.agriculturalIncome > 0) y = this._row(doc, 'Agricultural Income (exempt)', fmt(pdfData.income.agriculturalIncome), y, '#16A34A');
        y = this._divider(doc, y);
        y = this._row(doc, 'Gross Total Income', fmt(pdfData.income.grossTotal), y, black, true);
        y += 6;

        // ── Step 2: Deductions ──
        if (pdfData.deductions.total > 0) {
          y = this._section(doc, '2. Deductions (Chapter VI-A)', y, W);
          const bd = pdfData.deductions.breakdown;
          const dedItems = [
            ['80C', bd.section80C], ['80CCD(1B) NPS', bd.section80CCD1B], ['80CCD(2) Employer NPS', bd.section80CCD2],
            ['80D Health', bd.section80D], ['80E Education Loan', bd.section80E], ['80G Donations', bd.section80G],
            ['80TTA Savings Interest', bd.section80TTA], ['80TTB Senior Interest', bd.section80TTB],
            ['80GG Rent', bd.section80GG], ['80U Disability', bd.section80U],
          ];
          dedItems.forEach(([label, val]) => { if (n(val) > 0) y = this._row(doc, `  ${label}`, fmt(val), y, gray); });
          y = this._divider(doc, y);
          y = this._row(doc, 'Total Deductions', fmt(pdfData.deductions.total), y, '#16A34A', true);
          y += 6;
        }

        // ── Step 3: Taxable Income ──
        y = this._section(doc, '3. Taxable Income', y, W);
        y = this._row(doc, 'Gross Total Income', fmt(pdfData.income.grossTotal), y);
        if (pdfData.deductions.total > 0) y = this._row(doc, 'Less: Deductions', `-${fmt(pdfData.deductions.total)}`, y, '#16A34A');
        y = this._divider(doc, y);
        y = this._row(doc, 'Total Taxable Income', fmt(pdfData.tax.taxableIncome), y, black, true);
        y += 6;

        // Page break if needed
        if (y > 650) { doc.addPage(); y = 50; }

        // ── Step 4: Tax Calculation ──
        y = this._section(doc, '4. Tax Calculation', y, W);
        y = this._row(doc, 'Tax on Income', fmt(pdfData.tax.taxOnIncome), y);
        if (pdfData.tax.rebate > 0) y = this._row(doc, 'Less: Rebate u/s 87A', `-${fmt(pdfData.tax.rebate)}`, y, '#16A34A');
        if (pdfData.tax.surcharge > 0) y = this._row(doc, 'Add: Surcharge', fmt(pdfData.tax.surcharge), y);
        if (pdfData.tax.cess > 0) y = this._row(doc, 'Add: Health & Education Cess (4%)', fmt(pdfData.tax.cess), y);
        y = this._divider(doc, y);
        y = this._row(doc, 'Total Tax Liability', fmt(pdfData.tax.totalTax), y, black, true);
        y += 6;

        // ── Step 5: Tax Paid ──
        y = this._section(doc, '5. Taxes Paid / TDS Credits', y, W);
        if (pdfData.tds.fromSalary > 0) y = this._row(doc, 'TDS on Salary', fmt(pdfData.tds.fromSalary), y);
        if (pdfData.tds.fromNonSalary > 0) y = this._row(doc, 'TDS on Non-Salary', fmt(pdfData.tds.fromNonSalary), y);
        if (pdfData.tds.advanceTax > 0) y = this._row(doc, 'Advance Tax', fmt(pdfData.tds.advanceTax), y);
        if (pdfData.tds.selfAssessment > 0) y = this._row(doc, 'Self-Assessment Tax', fmt(pdfData.tds.selfAssessment), y);
        y = this._divider(doc, y);
        y = this._row(doc, 'Total Tax Credits', fmt(pdfData.tds.total), y, '#16A34A', true);
        y += 6;

        // ── Step 6: Result ──
        const resultColor = pdfData.result.isRefund ? '#16A34A' : '#DC2626';
        y = this._section(doc, pdfData.result.isRefund ? '6. Refund Due' : '6. Balance Tax Payable', y, W);
        y = this._row(doc, 'Total Tax Liability', fmt(pdfData.tax.totalTax), y);
        y = this._row(doc, 'Less: Tax Credits', `-${fmt(pdfData.tds.total)}`, y, '#16A34A');
        y = this._divider(doc, y);
        doc.font('Helvetica-Bold').fontSize(11).fillColor(resultColor);
        doc.text(pdfData.result.isRefund ? 'Refund Due to You' : 'Tax You Need to Pay', 60, y, { width: 300 });
        doc.text(`₹${fmt(Math.abs(pdfData.result.netPayable))}`, 360, y, { width: 175, align: 'right' });
        y += 20;

        // ── Regime Comparison (if old regime) ──
        if (pdfData.comparison) {
          y += 8;
          if (y > 680) { doc.addPage(); y = 50; }
          y = this._section(doc, 'Regime Comparison', y, W);
          y = this._row(doc, `${pdfData.header.regime} Tax`, fmt(pdfData.tax.totalTax), y);
          y = this._row(doc, `${pdfData.comparison.altRegime} Tax`, fmt(pdfData.comparison.altTax), y);
          y = this._divider(doc, y);
          const savingsLabel = pdfData.comparison.betterRegime === (pdfData.header.regime === 'Old Regime' ? 'old' : 'new') ? 'You save' : `${pdfData.comparison.altRegime} would save`;
          y = this._row(doc, savingsLabel, `₹${fmt(pdfData.comparison.savings)}`, y, gold, true);
        }

        // ── Footer ──
        const footerY = doc.page.height - 40;
        doc.fontSize(7).fillColor(gray).text('Generated by BurnBlack · burnblack.com · This is a computation summary, not an official ITD document.', 50, footerY, { width: W, align: 'center' });

        doc.end();
      });
    } catch (error) {
      enterpriseLogger.error('PDF generation failed', { error: error.message });
      throw new AppError(ErrorCodes.PDF_GENERATION_FAILED, 'Failed to generate computation PDF', 500);
    }
  }

  // ── PDF helpers ──

  static _section(doc, title, y, w) {
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#0F0F0F').text(title, 50, y, { width: w });
    y += 16;
    return y;
  }

  static _row(doc, label, value, y, color = '#666666', bold = false) {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(9).fillColor(color);
    doc.text(label, 60, y, { width: 300 });
    doc.text(value, 360, y, { width: 175, align: 'right' });
    return y + 14;
  }

  static _divider(doc, y) {
    doc.moveTo(60, y).lineTo(535, y).strokeColor('#E8E8E4').lineWidth(0.5).stroke();
    return y + 6;
  }

  /**
   * Get filename for a filing.
   */
  static getFilename(pan, assessmentYear) {
    return `BurnBlack_Computation_${(pan || 'UNKNOWN').toUpperCase()}_AY${assessmentYear || 'XXXX-XX'}.pdf`;
  }
}

module.exports = ComputationPDFService;
