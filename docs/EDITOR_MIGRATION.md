# Editor Migration Instructions

## Method
For each editor:
1. Replace `import { Field, Grid, Card, Section, Button, ... } from '../../../../components/ds'`
   with `import { Button } from '../../../../components/ds'` + `import FilingField, { FilingGrid, FilingSection } from '../../../../components/Filing/FilingField'`
2. Replace `<Card>/<Section>` with `<FilingSection title="...">`
3. Replace `<Grid cols={N}>` with `<FilingGrid cols={N}>`
4. Replace `<Field label="..." type="number" value={v} onChange={fn}>` with `<FilingField label="..." type="currency" value={v} onChange={fn}>`
5. Replace `<Field label="..." value={v}>` with `<FilingField label="..." type="text" value={v}>`
6. Replace `<Select ...>` with `<FilingField type="select" ...>`
7. Remove `<h2 className="step-title">` and `<p className="step-desc">` (outer header shows title)
8. Cap save buttons at `style={{ maxWidth: 160 }}`
9. Build and verify

## Remaining Editors
- [ ] ForeignIncomeEditor (5KB — smallest, do first)
- [ ] CapitalGainsEditor (10KB)
- [ ] SalaryEditor (19KB — largest, CSS handles it)
- [ ] DeductionsEditor (29KB — largest, CSS handles it)
- [ ] BankEditor (23KB — CSS handles it)

## Note
SalaryEditor, DeductionsEditor, and BankEditor are 19-29KB each with complex
logic (multiple employers, donation lists, IFSC validation). The CSS overrides
in filing-editor.css already force correct font sizes and widths on these via
!important. Full migration is optional — visual result is the same.

Priority: ForeignIncomeEditor and CapitalGainsEditor (small, high visibility).
