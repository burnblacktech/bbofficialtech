# Income Sources Multi-Select — Task Checklist

## Objective

Replace single-category income selection with multi-select that matches taxpayer mental model. S22 determines correct ITR type automatically.

---

## Task Breakdown

### Phase 1: Income Sources Screen
- [x] Create `IncomeSourcesSelection.js` component
  - [x] Multi-select UI (salary, capital gains, rental, business, other)
  - [x] Visual feedback for selected sources
  - [x] Reassurance copy ("You can change this later")
  - [x] Validation (at least one source required)
- [x] Wire to filing creation API
- [x] Store income intent in `jsonPayload.income.*.intent`
- [x] Navigate to Financial Story UX after creation
- [x] Update `filingRoutes.js` to use new component

### Phase 2: S22 Integration
- [ ] Verify S22 correctly determines ITR type from income intent
- [ ] Test mixed income scenarios:
  - [ ] Salary + Capital Gains → ITR-2
  - [ ] Salary only → ITR-1
  - [ ] Business + Capital Gains → ITR-3
  - [ ] Rental + Salary → ITR-2
- [ ] Verify CA requirement derivation

### Phase 3: User Journey Validation
- [ ] Test complete flow: /itr/start → overview → income-story → readiness
- [ ] Verify income intent persists through journey
- [ ] Verify Financial Story screens reflect selected sources
- [ ] Test "change later" promise (can user modify sources?)

### Phase 4: Polish
- [ ] Add analytics tracking for source combinations
- [ ] Add "Help me choose" guidance (optional)
- [ ] Verify mobile responsiveness
- [ ] Add loading states and error handling

---

## Success Criteria

- ✅ Users can select multiple income sources
- ✅ S22 determines correct ITR type automatically
- ✅ No ITR jargon shown to user
- ✅ Flow completes end-to-end
- ✅ Income intent stored correctly

---

## Deferred (Future)

- Advanced income source combinations
- "Why we need this" explanations per source
- Income source recommendations based on profile
