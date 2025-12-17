# Manual Tax Computation Mode

Burnblack uses **manual tax computation** on the ITR computation screen to avoid request spam, race conditions, and UI instability while the user is typing.

## UX rules

- **Tax compute only runs when the user clicks “Compute”**
  - No automatic computation while typing
  - No hidden debounce loop firing `/itr/compute-tax`
- **Changing the tax regime clears existing computed values**
  - The user must click “Compute” again after switching regimes
- **Save/Save & Exit does not automatically compute tax**
  - Saving persists the draft; computation is an explicit action

## Implementation notes

- Frontend removed the effect that auto-fired tax compute based on `formData` changes.
- A “Compute” action is available in the header to trigger `POST /api/itr/compute-tax`.
- Components that previously triggered compute indirectly (e.g. optimizer update handlers) now mark computation as stale by clearing `taxComputation/regimeComparison` instead of re-running compute automatically.


