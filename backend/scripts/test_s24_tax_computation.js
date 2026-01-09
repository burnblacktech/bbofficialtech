/**
 * S24.D: Edge-Case Verification Harness
 * 
 * Comprehensive test suite for tax computation engine.
 * Tests boundary values, cliffs, losses, mixed income, surcharge, and rounding.
 * 
 * If a case isn't tested, it's considered unsupported, not "working".
 */

const TaxRegimeAssembly = require('../src/services/tax/TaxRegimeAssembly');

// Colors for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[36m',
    bright: '\x1b[1m',
};

function log(message, color = colors.reset) {
    console.log(`${color}${message}${colors.reset}`);
}

function section(title) {
    console.log('\n' + '='.repeat(70));
    log(title, colors.bright + colors.blue);
    console.log('='.repeat(70));
}

function testCase(name, facts, regime, expectedTax, tolerance = 100) {
    console.log(`\n${colors.blue}Test: ${name}${colors.reset}`);

    try {
        const result = regime === 'old'
            ? TaxRegimeAssembly.computeOldRegime(facts)
            : TaxRegimeAssembly.computeNewRegime(facts);

        const actualTax = result.finalTaxLiability;
        const diff = Math.abs(actualTax - expectedTax);
        const passed = diff <= tolerance;

        console.log(`  Total Income: ₹${result.totalIncome}`);
        console.log(`  Tax Computed: ₹${actualTax}`);
        console.log(`  Expected: ₹${expectedTax}`);
        console.log(`  Difference: ₹${diff}`);

        if (passed) {
            log('  ✓ PASS', colors.green);
        } else {
            log('  ✗ FAIL', colors.red);
        }

        return { passed, result };
    } catch (error) {
        log(`  ✗ ERROR: ${error.message}`, colors.red);
        return { passed: false, error };
    }
}

function runTests() {
    section('S24.D Tax Computation Edge-Case Verification');

    let totalTests = 0;
    let passedTests = 0;

    // Test 1: Boundary - ₹2.5L (no tax)
    section('Test 1: Boundary - ₹2.5L (No Tax)');
    const test1 = testCase(
        'Salary ₹2.5L (Old Regime)',
        {
            income: {
                salary: {
                    employers: [{ name: 'Company A', grossSalary: 250000, standardDeduction: 50000 }]
                }
            }
        },
        'old',
        0  // No tax below ₹2.5L
    );
    totalTests++;
    if (test1.passed) passedTests++;

    // Test 2: Boundary - ₹5L (Old Regime)
    section('Test 2: Boundary - ₹5L (Old Regime)');
    const test2 = testCase(
        'Salary ₹5L (Old Regime)',
        {
            income: {
                salary: {
                    employers: [{ name: 'Company A', grossSalary: 550000, standardDeduction: 50000 }]
                }
            }
        },
        'old',
        12500  // (500000 - 250000) * 5% = 12500
    );
    totalTests++;
    if (test2.passed) passedTests++;

    // Test 3: 87A Rebate Cliff - ₹5L (Old Regime)
    section('Test 3: 87A Rebate Cliff - ₹5L (Old Regime)');
    const test3 = testCase(
        '87A Rebate at ₹5L (Old Regime)',
        {
            income: {
                salary: {
                    employers: [{ name: 'Company A', grossSalary: 550000, standardDeduction: 50000 }]
                }
            }
        },
        'old',
        0  // Rebate of ₹12500 makes tax zero
    );
    totalTests++;
    if (test3.passed) passedTests++;

    // Test 4: 87A Rebate Cliff - ₹7L (New Regime)
    section('Test 4: 87A Rebate Cliff - ₹7L (New Regime)');
    const test4 = testCase(
        '87A Rebate at ₹7L (New Regime)',
        {
            income: {
                salary: {
                    employers: [{ name: 'Company A', grossSalary: 750000, standardDeduction: 50000 }]
                }
            }
        },
        'new',
        0  // Rebate of ₹25000 makes tax zero
    );
    totalTests++;
    if (test4.passed) passedTests++;

    // Test 5: Zero Income
    section('Test 5: Zero Income (Nil Tax Return)');
    const test5 = testCase(
        'Zero Income',
        {
            income: {}
        },
        'old',
        0
    );
    totalTests++;
    if (test5.passed) passedTests++;

    // Test 6: House Property Loss
    section('Test 6: House Property Loss');
    const test6 = testCase(
        'Salary + HP Loss',
        {
            income: {
                salary: {
                    employers: [{ name: 'Company A', grossSalary: 800000, standardDeduction: 50000 }]
                },
                houseProperty: {
                    properties: [
                        { type: 'self-occupied', interestOnLoan: 200000 }  // Max ₹2L loss
                    ]
                }
            }
        },
        'old',
        28600  // (750000 - 200000 - 250000) * 5% + (300000 * 20%) - rebate
    );
    totalTests++;
    if (test6.passed) passedTests++;

    // Test 7: Mixed Income (Salary + Capital Gains)
    section('Test 7: Mixed Income (Salary + Capital Gains)');
    const test7 = testCase(
        'Salary + Short-term CG',
        {
            income: {
                salary: {
                    employers: [{ name: 'Company A', grossSalary: 600000, standardDeduction: 50000 }]
                },
                capitalGains: {
                    transactions: [
                        {
                            assetType: 'equity',
                            gainType: 'short-term',
                            saleValue: 200000,
                            purchaseValue: 150000,
                            expenses: 0
                        }
                    ]
                }
            }
        },
        'old',
        32500  // Slab tax on ₹600000 (550000 after std ded + 50000 STCG)
    );
    totalTests++;
    if (test7.passed) passedTests++;

    // Test 8: High Income (Surcharge Applicable)
    section('Test 8: High Income (Surcharge 10%)');
    const test8 = testCase(
        'Salary ₹60L (Surcharge 10%)',
        {
            income: {
                salary: {
                    employers: [{ name: 'Company A', grossSalary: 6050000, standardDeduction: 50000 }]
                }
            }
        },
        'old',
        1716000  // Approx (with surcharge + cess)
    );
    totalTests++;
    if (test8.passed) passedTests++;

    // Test 9: Chapter VI-A Deductions (Old Regime)
    section('Test 9: Chapter VI-A Deductions (Old Regime)');
    const test9 = testCase(
        'Salary ₹10L with 80C ₹1.5L',
        {
            income: {
                salary: {
                    employers: [{ name: 'Company A', grossSalary: 1050000, standardDeduction: 50000 }]
                }
            },
            deductions: {
                section80C: { totalInvestments: 150000 }
            }
        },
        'old',
        112320  // Tax on (1000000 - 150000) = 850000
    );
    totalTests++;
    if (test9.passed) passedTests++;

    // Test 10: New Regime (No Deductions)
    section('Test 10: New Regime (No Deductions Allowed)');
    const test10 = testCase(
        'Salary ₹10L with 80C (New Regime)',
        {
            income: {
                salary: {
                    employers: [{ name: 'Company A', grossSalary: 1050000, standardDeduction: 50000 }]
                }
            },
            deductions: {
                section80C: { totalInvestments: 150000 }  // Should be ignored
            }
        },
        'new',
        135200  // Tax on full ₹1000000 (no deductions in new regime)
    );
    totalTests++;
    if (test10.passed) passedTests++;

    // Summary
    section('Test Summary');
    log(`Total Tests: ${totalTests}`, colors.blue);
    log(`Passed: ${passedTests}`, colors.green);
    log(`Failed: ${totalTests - passedTests}`, passedTests === totalTests ? colors.green : colors.red);

    if (passedTests === totalTests) {
        log('\n✅ All edge-case tests passed! Tax computation engine verified.', colors.bright + colors.green);
    } else {
        log(`\n⚠ ${totalTests - passedTests} test(s) failed. Review computation logic.`, colors.yellow);
    }
}

// Run tests
try {
    runTests();
} catch (error) {
    log(`\n✗ Fatal error: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
}
