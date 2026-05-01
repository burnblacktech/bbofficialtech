/**
 * Edge cases + PDF generation (async-aware)
 */
const { assert, assertApprox, section, fmt, n, basePersonal, baseBank, ITR1, ITR2, ITR4, PDFService, fs, path } = require('./validate-filing-flows');

function runEdgeCaseTests() {

  section('Edge 1: High income — surcharge at ₹55L');
  {
    const r = ITR2.compute({
      personalInfo: { ...basePersonal },
      income: { salary: { employers: [{ name: 'FAANG', grossSalary: 5500000, tdsDeducted: 1500000 }] } },
      deductions: {}, bankDetails: baseBank,
    });
    assert('Surcharge applied', n(r.oldRegime.surcharge) > 0);
    console.log(`  → Surcharge: ${fmt(r.oldRegime.surcharge)}, Total: ${fmt(r.oldRegime.totalTax)}`);
  }

  section('Edge 2: Exactly ₹7L taxable — rebate boundary (new)');
  {
    const r = ITR1.compute({
      personalInfo: { ...basePersonal },
      income: { salary: { employers: [{ name: 'Co', grossSalary: 775000, tdsDeducted: 0 }] } },
      deductions: {}, bankDetails: baseBank,
    });
    assertApprox('Taxable = 7L', r.newRegime.taxableIncome, 700000, 100);
    assertApprox('Tax = 0 (rebate)', r.newRegime.totalTax, 0);
    console.log(`  → Taxable: ${fmt(r.newRegime.taxableIncome)}, Tax: ${fmt(r.newRegime.totalTax)}`);
  }

  section('Edge 3: ₹7.01L taxable — just above rebate');
  {
    const r = ITR1.compute({
      personalInfo: { ...basePersonal },
      income: { salary: { employers: [{ name: 'Co', grossSalary: 776000, tdsDeducted: 0 }] } },
      deductions: {}, bankDetails: baseBank,
    });
    assert('Taxable > 7L', r.newRegime.taxableIncome > 700000);
    assert('Tax > 0', r.newRegime.totalTax > 0);
    console.log(`  → Taxable: ${fmt(r.newRegime.taxableIncome)}, Tax: ${fmt(r.newRegime.totalTax)}`);
  }

  section('Edge 4: TDS exceeds liability — refund');
  {
    const r = ITR1.compute({
      personalInfo: { ...basePersonal },
      income: { salary: { employers: [{ name: 'Co', grossSalary: 600000, tdsDeducted: 50000 }] } },
      deductions: {}, bankDetails: baseBank,
    });
    assertApprox('New tax = 0', r.newRegime.totalTax, 0);
    assert('Refund (netPayable < 0)', n(r.newRegime.netPayable) < 0);
    console.log(`  → Tax: ${fmt(r.newRegime.totalTax)}, TDS: ${fmt(r.tds.total)}, Net: ${fmt(r.newRegime.netPayable)}`);
  }

  section('Edge 5: Agricultural income ₹3L + salary ₹10L');
  {
    const r = ITR1.compute({
      personalInfo: { ...basePersonal },
      income: {
        salary: { employers: [{ name: 'Co', grossSalary: 1000000, tdsDeducted: 50000 }] },
        agriculturalIncome: 300000,
      },
      deductions: {}, bankDetails: baseBank,
    });
    assertApprox('Agri income', r.agriculturalIncome, 300000);
    console.log(`  → Agri: ${fmt(r.agriculturalIncome)}, AgriIntegration: ${r.oldRegime.agriIntegrationApplied}, Old: ${fmt(r.oldRegime.totalTax)}`);
  }

  section('Edge 6: 80D senior parents (₹50K limit)');
  {
    const r = ITR1.compute({
      personalInfo: { ...basePersonal },
      income: { salary: { employers: [{ name: 'Co', grossSalary: 1500000, tdsDeducted: 100000 }] } },
      deductions: {
        section80D: { selfPremium: 25000, parentsPremium: 50000, parentsSenior: true, selfPreventive: 5000, parentsPreventive: 5000 },
      },
      bankDetails: baseBank,
    });
    assert('Deductions include 80D', n(r.oldRegime.deductions) >= 50000);
    console.log(`  → Total deductions: ${fmt(r.oldRegime.deductions)}, Old: ${fmt(r.oldRegime.totalTax)}`);
  }
}

async function runPDFTests() {
  section('PDF Generation Tests');

  const scenarios = [
    {
      label: 'ITR-1', itrType: 'ITR-1', service: ITR1,
      payload: {
        personalInfo: { ...basePersonal }, selectedRegime: 'old',
        income: {
          salary: { employers: [{ name: 'TCS', grossSalary: 1200000, tdsDeducted: 100000 }] },
          houseProperty: { type: 'selfOccupied', interestOnHomeLoan: 150000 },
        },
        deductions: { section80C: { ppf: 100000, elss: 50000 }, section80D: { selfPremium: 25000 } },
        bankDetails: baseBank,
      },
    },
    {
      label: 'ITR-2', itrType: 'ITR-2', service: ITR2,
      payload: {
        personalInfo: { ...basePersonal }, selectedRegime: 'new',
        income: {
          salary: { employers: [{ name: 'MNC', grossSalary: 2000000, tdsDeducted: 300000 }] },
          capitalGains: { transactions: [
            { gainType: 'LTCG', assetType: 'equity', saleValue: 1000000, purchaseValue: 600000, expenses: 0 },
          ] },
        },
        deductions: { section80C: { ppf: 150000 } }, bankDetails: baseBank,
      },
    },
    {
      label: 'ITR-4', itrType: 'ITR-4', service: ITR4,
      payload: {
        personalInfo: { ...basePersonal }, selectedRegime: 'old',
        income: { presumptive: { entries: [{ section: '44ADA', businessName: 'Consulting', grossReceipts: 4000000 }] } },
        deductions: { section80C: { ppf: 150000 } }, bankDetails: baseBank,
      },
    },
  ];

  for (const { label, itrType, service, payload } of scenarios) {
    try {
      const computation = service.compute(payload);
      const filing = {
        id: `test-${label}`, assessmentYear: '2025-26', itrType,
        taxpayerPan: 'ABCDE1234F', jsonPayload: payload, selectedRegime: payload.selectedRegime,
      };
      const pdfData = PDFService.assemblePDFData(filing, computation);
      assert(`${label} PDF data assembled`, !!pdfData?.header);

      const pdfBuffer = await PDFService.generatePDF(pdfData);
      const isValid = Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 0;
      assert(`${label} PDF generated (${(pdfBuffer.length / 1024).toFixed(1)} KB)`, isValid);

      if (isValid) {
        assert(`${label} PDF starts with %PDF`, pdfBuffer.toString('ascii', 0, 4) === '%PDF');
        const outPath = path.join(__dirname, `../../test-output-${label.toLowerCase().replace('-', '')}.pdf`);
        fs.writeFileSync(outPath, pdfBuffer);
        console.log(`  📄 ${outPath}`);
      }
    } catch (err) {
      assert(`${label} PDF generation`, false, `— ${err.message}`);
    }
  }

  const fn = PDFService.getFilename('ABCDE1234F', '2025-26');
  assert('Filename format', fn.includes('ABCDE1234F') && fn.endsWith('.pdf'));
  console.log(`  → Filename: ${fn}`);
}

module.exports = { runEdgeCaseTests, runPDFTests };
