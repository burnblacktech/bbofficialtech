# Remaining Work Items — Implementation Instructions

> Execute these in order. Each item is self-contained.
> Read UI_DESIGN_GUIDE.md and FILING_EDITOR_REDESIGN.md before starting.

---

## 1. Redis Setup & Verification

### Steps
1. Check if `REDIS_URL` is set in Vercel env vars
2. If not: create Upstash Redis (free tier) at https://upstash.com
3. Copy the `REDIS_URL` (format: `rediss://default:<password>@<host>.upstash.io:6379`)
4. Add to Vercel: Settings → Environment Variables → `REDIS_URL`
5. Redeploy
6. Verify: `curl https://bbofficialtech.vercel.app/api/health` → `redis.connected: true`

### What Redis enables
- Rate limiting persists across cold starts
- OTP codes survive across serverless instances
- Session store for OAuth state
- Bull job queue for background tasks (ERI submission)

---

## 2. ITR-2/3/4 JSON Builders — Thorough Testing

### Problem
ITR-1 builder is thoroughly tested. ITR-2/3/4 have the wrapper but schedules may have field issues.

### Steps
1. Read each builder file:
   - `backend/src/services/itr/ITR2JsonBuilder.js`
   - `backend/src/services/itr/ITR3JsonBuilder.js`
   - `backend/src/services/itr/ITR4JsonBuilder.js`

2. For each, verify:
   - All schedule names match ITD schema for that ITR type
   - Field names inside schedules match ITD expectations
   - Computation values are correctly mapped to output fields
   - `assessmentYear` is passed to compute function

3. Run test cases (similar to ITR-1 tests in `tests/computation-results/`):
   - ITR-2: Generate JSON for salary + capital gains scenario
   - ITR-3: Generate JSON for business income scenario
   - ITR-4: Generate JSON for presumptive income scenario
   - Save outputs to `tests/json-output/itr2/`, `itr3/`, `itr4/`

4. Cross-reference with ITD utility JSON samples (available at https://www.incometax.gov.in/iec/foportal/help/all-topics/itr-offline-utilities)

### Acceptance Criteria
- Each builder produces JSON that passes ITD's offline utility validation
- No missing required fields
- No field name mismatches

---

## 3. Mobile Responsiveness

### Problem
CSS is written for desktop (1280px+). Tablet and mobile layouts need manual testing and fixes.

### Steps
1. Test at these breakpoints:
   - 1024px (tablet landscape)
   - 768px (tablet portrait)
   - 375px (mobile)

2. Filing Editor (`filing-editor.css`):
   - ≤1024px: Left nav → horizontal pill bar at top, sidebar → slide-over drawer
   - ≤768px: Single column, bottom bar stays fixed
   - Verify: no horizontal overflow, all buttons tappable (min 44px)

3. Dashboard (`dashboard-v2.css`):
   - ≤1024px: Right sidebar → stacks below main
   - ≤768px: Single column, cards stack
   - Verify: FY selector accessible, charts readable

4. Auth pages (Login, Signup, Landing):
   - Already responsive (checked earlier)
   - Verify: forms don't overflow, buttons full-width on mobile

5. Admin pages:
   - AdminLayout already has mobile hamburger menu
   - Verify: tables scroll horizontally, not page

### Acceptance Criteria
- No horizontal scroll on any page at any breakpoint
- All touch targets ≥ 44px
- Text readable (min 12px on mobile)
- Bottom computation bar visible on mobile

---

## 4. AY 2025-26 Old Regime Standard Deduction Fix

### Problem
Code uses ₹75,000 standard deduction for all AYs. For AY 2025-26 OLD regime, it should be ₹50,000.

### Steps
1. Open `backend/src/services/itr/ITR1ComputationService.js`
2. Find `computeSalary` method — look for standard deduction constant
3. Make it AY-conditional:
   ```js
   const stdDeduction = (assessmentYear && assessmentYear <= '2025-26' && regime === 'old') ? 50000 : 75000;
   ```
4. Pass `assessmentYear` and `regime` to `computeSalary` (currently it only receives salary data)
5. Test: AY 2025-26 old regime salary ₹8L → std deduction ₹50K → net ₹7.5L
6. Test: AY 2026-27 any regime salary ₹8L → std deduction ₹75K → net ₹7.25L

### Acceptance Criteria
- AY 2025-26 old regime: ₹50,000 standard deduction
- AY 2025-26 new regime: ₹75,000 standard deduction
- AY 2026-27 both regimes: ₹75,000 standard deduction

---

## 5. Business Loss Carry-Forward

### Problem
Neither ITR-3 nor ITR-4 services handle loss carry-forward (Schedule CFL).

### Steps
1. Add to `ITR3ComputationService`:
   - Read `payload.losses.broughtForward` (array of past year losses)
   - Apply set-off rules:
     - Business loss → offsets business income only (not salary)
     - Speculation loss → offsets speculation income only
     - LTCG loss → offsets LTCG only
     - STCG loss → offsets any CG
   - Carry forward remaining losses (max 8 years)
   - Add to computation result: `{ lossesSetOff, lossesCarriedForward }`

2. Add to `ITR3JsonBuilder`:
   - Generate `ScheduleCFL` (Carry Forward of Losses)
   - Fields: `LossType`, `AYOfLoss`, `AmountBroughtForward`, `AmountSetOff`, `AmountCarriedForward`

3. Frontend:
   - Add "Brought Forward Losses" section in Business editor
   - Fields: AY of loss, type, amount
   - Show set-off summary after computation

4. ITR-4: Does NOT support loss carry-forward (by design — presumptive taxation assumes profit). Show warning if user has losses.

### Acceptance Criteria
- ITR-3: Business loss from AY 2024-25 can offset AY 2025-26 business income
- ITR-3: Remaining loss carries forward to next year
- ITR-4: Shows "Loss carry-forward not available under presumptive taxation" warning
- JSON includes ScheduleCFL with correct amounts

---

## 6. General Rules for All Items

- Follow `docs/UI_DESIGN_GUIDE.md` for any UI changes
- Follow `docs/FILING_EDITOR_REDESIGN.md` for editor layout
- Run `npx react-scripts build` before committing (must pass)
- Push to both `origin` and `vercel-deploy` remotes
- Test computation changes with node scripts (save to `tests/`)
- No spinners — use skeleton loading
- No full-width inputs — use unit-grid or bordered subsections
- No page scroll — viewport-contained
