# Itemized Deductions API (Chapter VI-A)

Burnblack stores **itemized deduction entries** inside the current `itr_drafts.data` JSONB document (no separate deductions tables yet). This keeps deductions consistent with the draft save model.

## Endpoints

All routes are under the ITR router (mounted at `/api/itr`):

- `GET /api/itr/deductions/:section?filingId=...`
- `POST /api/itr/deductions/:section`
- `PUT /api/itr/deductions/:section/:deductionId`
- `DELETE /api/itr/deductions/:section/:deductionId?filingId=...`

### Common parameters

- `:section`: Chapter VI-A section, e.g. `80C`, `80D`, `80G`, `80TTA`, `80TTB`, `80E`, `80EE`
- `filingId`: required to locate the latest draft for that filing (and ensure it belongs to the authenticated user)

### Request body

For `POST` and `PUT`, pass JSON:

```json
{
  "filingId": "uuid",
  "...sectionSpecificFields": "..."
}
```

### Response shape

All endpoints return the standard Burnblack API format:

```json
{
  "success": true,
  "message": "…",
  "data": {
    "deductions": [],
    "totalAmount": 0,
    "remainingLimit": 0,
    "section": "80C",
    "filingId": "uuid",
    "draftId": "uuid"
  }
}
```

## Storage format (itr_drafts.data JSONB)

Itemized entries live under `deductionsItems`, grouped by section:

```json
{
  "deductionsItems": {
    "80C": [
      { "id": "uuid", "section": "80C", "deductionType": "PPF", "amount": 10000, "proofs": [] }
    ],
    "80G": [
      { "id": "uuid", "section": "80G", "donationAmount": 5000, "proofs": [] }
    ]
  },
  "deductions": {
    "section80C": 10000,
    "section80G": 5000
  }
}
```

### Totals policy

On every `POST/PUT/DELETE`, the backend:

- updates the item list in `data.deductionsItems[section]`
- recomputes totals and writes them to `data.deductions.section<SECTION>`
- for variant sections (e.g. `80EE` entries with `sectionType: 80EEA`), it also writes per-variant totals to `data.deductions.section80EEA`

## Notes

- These endpoints always operate on the **latest** draft for the filing (by `updated_at/created_at`), and reject updates for read-only filing statuses.
- Proof uploads are represented as an array on each item (`proofs: []`). Upload/persistence of proof documents is handled separately.


