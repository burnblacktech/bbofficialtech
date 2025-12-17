# ITR End-User Journey Gap Report (Design + Flow)

## Goal (target experience)

Design a **steady, non-overwhelming** end-user flow that matches a real CA-led experience:

1. Signup/Login (Email/Mobile/Google)
2. First-time onboarding (minimal, progressive disclosure)
3. Return login → land on Dashboard
4. Start filing → PAN verified → ITR type selection (guided) → data collection → compute → optimize → review → submit → acknowledgment → post-filing tracking

## Current implementation (what exists today)

### ✅ Auth + redirect primitives exist
- `/home` is a protected smart redirect route that sends users to the correct home screen based on role (`frontend/src/pages/HomeRedirect.js`).
- Google OAuth callback redirects to `/auth/google/success` with tokens in querystring (`backend/src/routes/auth.js`).
- `GoogleOAuthSuccess` stores tokens and logs in (`frontend/src/pages/Auth/GoogleOAuthSuccess.js`).

### ✅ Filing “core path” exists (but not fully unified)
Current implemented filing path is documented in `docs/reference/itr-flow-analysis.md` and includes:
- `/itr/start` → `/itr/select-person`
- `/itr/pan-verification` (conditional)
- `/itr/recommend-form`
- `/itr/computation`

### ✅ Acknowledgment UI exists
Acknowledgment page exists: `frontend/src/pages/Acknowledgment.js` (uses filingId + submission details).

## Gaps vs the desired journey (design-level)

### 1) First-time onboarding is not a single, lightweight flow
**Desired**: a 3-step onboarding (Personal basics → Address → Bank) with optional skips and “complete later”.

**Current**:
- `onboardingCompleted` exists and is used to show a welcome modal (`frontend/src/pages/Dashboard/UserDashboard.js`), but there is no dedicated `/onboarding` route/wizard.
- Personal info forms exist in multiple places with different schemas:
  - `frontend/src/components/ITR/PersonalInfoForm.js`
  - `frontend/src/components/Forms/PersonalInfoForm.js`
  - (and other variants under features)

**Design impact**: user experiences duplicate/fragmented “tell us about you” flows, and may feel overwhelmed because it’s not staged.

### 2) Post-auth “where do I go next?” isn’t consistently framed as a journey
**Desired**: after login, dashboard should show exactly one primary next action:
- “Start your first filing” OR “Continue filing” OR “Track status”

**Current**:
- Dashboard has a solid structure, but onboarding is a modal, and the filing entry can be reached from multiple places.

**Design impact**: unclear “one next step” moment for a first-time filer.

### 3) Filing flow has multiple entry points / multiple “type selection” concepts
**Desired**: a single guided funnel:
Select person → PAN verify → ITR recommend → create filing → wizard → review → submit → acknowledgment.

**Current**:
- There are several ITR selection pages (direct selection, mode selection, form selection) in `frontend/src/pages/ITR/`.
- Computation and stepper experiences exist in parallel (`/itr/computation` vs `/itr/filing/:itrType`).

**Design impact**: users can get bounced between “choose ITR type” experiences, and it’s not obvious which one is “the main one”.

### 4) “CA-like” reassurance moments are not consistently placed
**Desired**: at key anxiety points, provide reassurance + explanation:
- PAN verification (why we need it)
- ITR type recommendation (why this form)
- Regime choice (old/new comparison)
- Submit + post-submit expectations (ack + ITR-V + timelines)

**Current**:
- Some steps provide guidance, but it’s not consistent end-to-end, and certain capabilities are present but not always connected.

### 5) Progressive disclosure is not systematized
**Desired**:
- Ask only what’s needed now
- Defer advanced info (foreign assets, capital gains) until ITR type indicates it
- Use defaults and prefill from profile/previous year

**Current**:
- Many forms exist; some steps can still feel heavy because data is requested in large sections.

## Immediate UX/Flow recommendations (no implementation yet)

1. **Adopt `/home` as the universal post-auth landing** for all auth methods (email + google), then:
   - If onboarding incomplete → onboarding wizard
   - Else → role dashboard

2. **Define one canonical end-user filing path**:
   - `/itr/start` → `/itr/select-person` → `/itr/pan-verification` → `/itr/recommend-form` → `/itr/computation` → `/acknowledgment/:filingId`

3. **Onboarding must be separate from filing**, with only essentials:
   - Personal basics (DOB, gender, PAN)
   - Address (minimal)
   - Bank (optional)

4. **One primary CTA per screen** (reduce choice overload).

## What we fixed now

- Google OAuth redirect now returns to the correct app origin and lands users on `/home` reliably (see `docs/AUTH_GOOGLE_OAUTH_REDIRECTS.md`).


