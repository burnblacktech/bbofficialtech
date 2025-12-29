/**
 * incomeSignals.js
 * Generates signals related to Income sources
 */

module.exports = {
    evaluate: (formData, taxComputation) => {
        const signals = [];

        // 1. Salary vs Form 16 Mismatch
        const salaryIncome = taxComputation?.income?.salary || 0;
        const hasSalary = salaryIncome > 0;

        // Check if Form 16 is present in metadata sources
        // formData.metadata.sources is assumed to be an array of strings like ['FORM_16', 'JSON_UPLOAD', 'MANUAL']
        const sources = formData?.metadata?.sources || [];
        const form16Uploaded = sources.includes('FORM_16');

        if (hasSalary && !form16Uploaded) {
            signals.push({
                id: "SALARY_NO_FORM16",
                category: "income",
                severity: "info",
                confidence: 1.0,
                reasonCode: "RULE_SALARY_WITHOUT_FORM16",
                facts: {
                    salaryIncome
                },
                recommendation: {
                    action: "UPLOAD_DOCUMENT",
                    target: "FORM_16"
                }
            });
        }

        // 2. Multiple Employers Check
        // heuristic: Check unique TANs in TDS form salary (Section 192)
        const tdsEntries = formData?.taxesPaid?.tdsFromSalary || [];
        const distinctTANs = new Set(tdsEntries.map(e => e.tanOfDeductor).filter(Boolean)).size;

        if (distinctTANs > 1) {
            signals.push({
                id: "MULTIPLE_EMPLOYERS",
                category: "income",
                severity: "warning",
                confidence: 1.0,
                reasonCode: "RULE_MULTIPLE_EMPLOYER_TDS",
                facts: {
                    employerCount: distinctTANs
                },
                recommendation: {
                    action: "REVIEW_SALARY",
                    target: "INCOME_SALARY"
                }
            });
        }

        return signals;
    }
};
