# Service Ticket Numbering (TicketNumber NOT NULL Fix)

## Problem this solves

Service tickets require `ticketNumber` (`NOT NULL`). If ticket number generation runs **after** Sequelize validation, ticket creation fails with:

- `notNull Violation: ServiceTicket.ticketNumber cannot be null`

This can happen even when ticket creation is “non-critical” (best-effort) and should not impact primary user flows.

## Standard

- `ServiceTicket.ticketNumber` MUST be generated **before validation**.
- Number generation SHOULD be concurrency-safe.

## Implementation

- Ticket number generation is performed in a Sequelize `beforeValidate` hook (so validation never sees `null`).
- Preferred numbering source is a DB sequence: `public.service_ticket_number_seq`.
- Fallback is a last-row increment (best-effort), with a retry on unique constraint.

## Database migration

Run:

- `node backend/src/scripts/migrations/create-service-ticket-number-sequence.js`

This ensures the sequence exists:

- `public.service_ticket_number_seq`


