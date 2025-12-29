/**
 * deductionSignals.js
 * Generates signals related to Deductions (Chapter VI-A)
 */

module.exports = {
    evaluate: (formData, taxComputation) => {
        const signals = [];

        const salaryIncome = taxComputation?.income?.salary || 0;
        const deductions = taxComputation?.deductions || {};

        // 1. Missing 80C (if Salary > 5L)
        const deduction80C = deductions['80C'] || 0;

        if (salaryIncome > 500000 && deduction80C === 0) {
            signals.push({
                id: "MISSING_80C",
                category: "deduction",
                severity: "info",
                confidence: 0.9,
                reasonCode: "RULE_SALARY_GT_5L_NO_80C",
                facts: {
                    salaryIncome,
                    deduction80C: 0
                },
                recommendation: {
                    action: "ADD_DEDUCTION",
                    target: "SECTION_80C"
                }
            });
        }

        // 2. 80D Mismatch (Senior Citizen)
        const dob = formData?.personalInfo?.general?.dateOfBirth;
        let age = 0;
        if (dob) {
            const birthDate = new Date(dob);
            const today = new Date();
            age = today.getFullYear() - birthDate.getFullYear();
            if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) {
                age--;
            }
        }

        const deduction80D = deductions['80D'] || 0;

        if (age >= 60 && deduction80D === 0) {
            signals.push({
                id: "MISSING_80D_SENIOR",
                category: "deduction",
                severity: "info",
                confidence: 0.7,
                reasonCode: "RULE_SENIOR_NO_80D",
                facts: {
                    age,
                    deduction80D: 0
                },
                recommendation: {
                    action: "ADD_DEDUCTION",
                    target: "SECTION_80D"
                }
            });
        }

        return signals;
    }
};
