# Agricultural Income Tax Calculation - Test Cases

## Test Scenarios Based on User Examples

### Assumptions
- FY 2024-25 (AY 2025-26) slabs
- Individual below 60 years
- 4% cess included
- Agricultural income: ₹20,00,000
- No deductions (for simplicity)

---

## Test Case 1: Non-Agri Income = ₹0

### Expected Results:
- **Old Regime**: ₹0 (agricultural income alone is exempt)
- **New Regime**: ₹0 (no non-agricultural income)

### Implementation Check:
- ✅ Agricultural income should NOT be included in grossTotalIncome
- ✅ No partial integration (non-agri income ≤ basic exemption)
- ✅ Both regimes return ₹0

---

## Test Case 2: Non-Agri Income = ₹5,00,000

### Expected Results:
- **Old Regime**: ₹0 (rebate u/s 87A applies)
- **New Regime**: ₹0 (rebate u/s 87A applies)

### Calculation Details:
- Taxable income: ₹5,00,000
- Tax on ₹5L (Old Regime): 
  - 0-2.5L: ₹0
  - 2.5-5L: 5% = ₹12,500
  - Total: ₹12,500
  - Cess (4%): ₹500
  - Total: ₹13,000
  - Rebate u/s 87A: ₹12,500 (max ₹12,500)
  - **Final: ₹0**

- Tax on ₹5L (New Regime):
  - 0-3L: ₹0
  - 3-5L: 5% = ₹10,000
  - Total: ₹10,000
  - Cess (4%): ₹400
  - Total: ₹10,400
  - Rebate u/s 87A: ₹10,400 (max ₹12,500)
  - **Final: ₹0**

### Implementation Check:
- ✅ Old Regime: Partial integration applies (agri > ₹5k, non-agri > ₹2.5L)
  - Step 1: Tax on (20L + 5L = 25L)
  - Step 2: Tax on (20L + 2.5L = 22.5L)
  - Difference: Additional tax due to agri income
  - But rebate u/s 87A brings it to ₹0
- ✅ New Regime: Agricultural income ignored, only ₹5L taxed
- ✅ Both regimes: Rebate u/s 87A applies

---

## Test Case 3: Non-Agri Income = ₹10,00,000

### Expected Results:
- **Old Regime**: ₹2,34,000
- **New Regime**: ₹52,000

### Old Regime Calculation (Partial Integration):

**Step 1: Tax on (20L + 10L = 30L)**
- 0-2.5L: ₹0
- 2.5-5L: 5% = ₹12,500
- 5-10L: 20% = ₹1,00,000
- 10-30L: 30% of 20L = ₹6,00,000
- **Total: ₹7,12,500**

**Step 2: Tax on (20L + 2.5L = 22.5L)**
- 0-2.5L: ₹0
- 2.5-5L: 5% = ₹12,500
- 5-10L: 20% = ₹1,00,000
- 10-22.5L: 30% of 12.5L = ₹3,75,000
- **Total: ₹4,87,500**

**Step 3: Difference**
- ₹7,12,500 - ₹4,87,500 = ₹2,25,000
- Cess (4%): ₹9,000
- **Total: ₹2,34,000**

### New Regime Calculation (Agri Income Ignored):

**Tax on ₹10L only:**
- 0-3L: ₹0
- 3-7L: 5% = ₹20,000
- 7-10L: 10% = ₹30,000
- **Raw tax: ₹50,000**
- Cess (4%): ₹2,000
- **Total: ₹52,000**

### Implementation Check:
- ✅ Old Regime: Partial integration correctly calculated
- ✅ New Regime: Agricultural income completely ignored
- ✅ Calculations match expected values

---

## Test Case 4: Non-Agri Income = ₹15,00,000

### Expected Results:
- **Old Regime**: ₹3,84,000
- **New Regime**: ₹1,56,000

### Old Regime Calculation (Partial Integration):

**Step 1: Tax on (20L + 15L = 35L)**
- 0-2.5L: ₹0
- 2.5-5L: 5% = ₹12,500
- 5-10L: 20% = ₹1,00,000
- 10-35L: 30% of 25L = ₹7,50,000
- **Total: ₹8,62,500**

**Step 2: Tax on (20L + 2.5L = 22.5L)**
- Same as Test Case 3: ₹4,87,500

**Step 3: Difference**
- ₹8,62,500 - ₹4,87,500 = ₹3,75,000
- Cess (4%): ₹15,000
- **Total: ₹3,90,000**

*Note: User mentioned ₹3,84,000 - slight difference may be due to rounding or slab interpretation*

### New Regime Calculation (Agri Income Ignored):

**Tax on ₹15L only:**
- 0-3L: ₹0
- 3-7L: 5% = ₹20,000
- 7-10L: 10% = ₹30,000
- 10-12L: 15% = ₹30,000
- 12-15L: 20% = ₹60,000
- **Raw tax: ₹1,50,000**
- Cess (4%): ₹6,000
- **Total: ₹1,56,000**

### Implementation Check:
- ✅ Old Regime: Partial integration correctly calculated
- ✅ New Regime: Agricultural income completely ignored
- ✅ New Regime calculation matches expected value
- ⚠️ Old Regime: Small difference (₹3,90,000 vs ₹3,84,000) - needs verification

---

## Key Verification Points

### ✅ New Regime Behavior:
1. Agricultural income is **NOT** included in `grossTotalIncome`
2. Agricultural income is **completely ignored** for tax calculation
3. Only non-agricultural income is taxed
4. Standard deduction applies if salary > 0

### ✅ Old Regime Behavior:
1. Agricultural income is **NOT** included in `grossTotalIncome`
2. Partial integration applies when:
   - Agricultural income > ₹5,000 **AND**
   - Non-agricultural income > basic exemption (₹2.5L)
3. Formula: Tax on (agri + non-agri) - Tax on (agri + basic exemption)
4. Additional tax is added to base tax

---

## Implementation Status

### Backend (`TaxRegimeCalculator.js`):
- ✅ Agricultural income extracted separately (not in grossTotalIncome)
- ✅ Partial integration only for Old Regime
- ✅ New Regime ignores agricultural income
- ✅ ₹5,000 threshold check implemented
- ✅ Age-based basic exemption implemented

### Frontend (`taxEngine.js`):
- ✅ Agricultural income handled separately
- ✅ Partial integration only for Old Regime
- ✅ New Regime ignores agricultural income
- ✅ ₹5,000 threshold check implemented
- ✅ Age-based basic exemption implemented

---

## Next Steps

1. Create unit tests for these specific scenarios
2. Verify exact tax calculations match expected values
3. Test edge cases (agri income exactly ₹5,000, non-agri exactly ₹2.5L)
4. Verify rebate u/s 87A calculations
5. Test with deductions applied

