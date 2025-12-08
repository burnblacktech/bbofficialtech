# BurnBlack - Code Architecture & Structure Guide

A comprehensive guide for optimal code organization across all dimensions.

---

## ARCHITECTURAL PHILOSOPHY

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CORE PRINCIPLES                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. SEPARATION OF CONCERNS                                                  │
│     UI │ Business Logic │ Data │ Infrastructure                             │
│     Each layer independent, replaceable, testable                           │
│                                                                             │
│  2. FEATURE-FIRST ORGANIZATION                                              │
│     Group by feature/domain, not by technical type                          │
│     Easy to find, easy to delete, easy to scale teams                       │
│                                                                             │
│  3. DEPENDENCY INVERSION                                                    │
│     High-level modules don't depend on low-level modules                    │
│     Both depend on abstractions (interfaces)                                │
│                                                                             │
│  4. SINGLE RESPONSIBILITY                                                   │
│     Each module/function does ONE thing well                                │
│     If you can't name it simply, it's doing too much                        │
│                                                                             │
│  5. DRY BUT NOT PREMATURE                                                   │
│     Abstract only after 3+ repetitions                                      │
│     Duplication is better than wrong abstraction                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## COMPLETE PROJECT STRUCTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MONOREPO STRUCTURE (Turborepo)                                             │
├─────────────────────────────────────────────────────────────────────────────┤

burnblack/
├── apps/
│   ├── web/                          # Next.js main application
│   ├── admin/                        # Admin dashboard (future)
│   └── mobile/                       # React Native (future)
│
├── packages/
│   ├── ui/                           # Shared UI component library
│   ├── config/                       # Shared configs (eslint, tsconfig, tailwind)
│   ├── types/                        # Shared TypeScript types
│   ├── utils/                        # Shared utility functions
│   ├── tax-engine/                   # Tax calculation engine
│   └── validators/                   # Shared validation schemas
│
├── services/
│   ├── api/                          # Node.js/Express API server
│   ├── workers/                      # Background job processors
│   └── document-processor/           # OCR & document extraction service
│
├── infrastructure/
│   ├── docker/                       # Docker configurations
│   ├── kubernetes/                   # K8s manifests (production)
│   └── terraform/                    # Infrastructure as code
│
├── docs/                             # Documentation
├── scripts/                          # Build & deployment scripts
├── turbo.json                        # Turborepo config
├── package.json                      # Root package.json
└── pnpm-workspace.yaml              # PNPM workspace config

└─────────────────────────────────────────────────────────────────────────────┘
```

---

## FRONTEND APPLICATION STRUCTURE (apps/web)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NEXT.JS APP STRUCTURE                                                      │
├─────────────────────────────────────────────────────────────────────────────┤

apps/web/
├── public/
│   ├── fonts/
│   ├── images/
│   ├── icons/
│   └── locales/                      # i18n translation files
│       ├── en/
│       ├── hi/
│       └── ...
│
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group (no layout)
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   ├── signup/
│   │   │   │   └── page.tsx
│   │   │   ├── forgot-password/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx            # Auth layout (minimal)
│   │   │
│   │   ├── (dashboard)/              # Dashboard route group
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── filings/
│   │   │   │   ├── page.tsx          # Filing history
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx      # Filing details
│   │   │   ├── profile/
│   │   │   │   └── page.tsx
│   │   │   ├── settings/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx            # Dashboard layout with sidebar
│   │   │
│   │   ├── (filing)/                 # ITR Filing route group
│   │   │   ├── itr/
│   │   │   │   └── [type]/
│   │   │   │       └── [year]/
│   │   │   │           ├── page.tsx  # Main filing page (Breathing Grid)
│   │   │   │           ├── review/
│   │   │   │           │   └── page.tsx
│   │   │   │           └── submit/
│   │   │   │               └── page.tsx
│   │   │   ├── start/
│   │   │   │   └── page.tsx          # ITR type selection
│   │   │   └── layout.tsx            # Filing layout with tax bar
│   │   │
│   │   ├── api/                      # API routes (if needed)
│   │   │   └── ...
│   │   │
│   │   ├── layout.tsx                # Root layout
│   │   ├── loading.tsx               # Global loading
│   │   ├── error.tsx                 # Global error
│   │   ├── not-found.tsx             # 404 page
│   │   └── globals.css               # Global styles
│   │
│   ├── components/                   # Application components
│   │   │
│   │   ├── ui/                       # Base UI components (from design system)
│   │   │   ├── button/
│   │   │   │   ├── button.tsx
│   │   │   │   ├── button.test.tsx
│   │   │   │   ├── button.stories.tsx
│   │   │   │   └── index.ts
│   │   │   ├── input/
│   │   │   ├── select/
│   │   │   ├── checkbox/
│   │   │   ├── radio/
│   │   │   ├── toggle/
│   │   │   ├── card/
│   │   │   ├── dialog/
│   │   │   ├── toast/
│   │   │   ├── tooltip/
│   │   │   ├── dropdown-menu/
│   │   │   ├── tabs/
│   │   │   ├── skeleton/
│   │   │   ├── progress/
│   │   │   ├── badge/
│   │   │   ├── alert/
│   │   │   └── index.ts              # Barrel export
│   │   │
│   │   ├── layout/                   # Layout components
│   │   │   ├── header/
│   │   │   │   ├── header.tsx
│   │   │   │   ├── header-desktop.tsx
│   │   │   │   ├── header-mobile.tsx
│   │   │   │   └── index.ts
│   │   │   ├── sidebar/
│   │   │   ├── footer/
│   │   │   ├── breathing-grid/
│   │   │   │   ├── breathing-grid.tsx
│   │   │   │   ├── breathing-grid-context.tsx
│   │   │   │   ├── use-breathing-grid.ts
│   │   │   │   └── index.ts
│   │   │   ├── tax-computation-bar/
│   │   │   │   ├── tax-computation-bar.tsx
│   │   │   │   ├── tax-bar-desktop.tsx
│   │   │   │   ├── tax-bar-mobile.tsx
│   │   │   │   └── index.ts
│   │   │   └── bottom-sheet/
│   │   │
│   │   ├── forms/                    # Form components
│   │   │   ├── form-field/
│   │   │   ├── currency-input/
│   │   │   ├── date-picker/
│   │   │   ├── file-upload/
│   │   │   ├── pan-input/
│   │   │   ├── aadhaar-input/
│   │   │   └── bank-account-input/
│   │   │
│   │   ├── data-display/             # Data display components
│   │   │   ├── breakdown-list/
│   │   │   ├── comparison-table/
│   │   │   ├── data-row/
│   │   │   ├── stat-card/
│   │   │   ├── currency-display/
│   │   │   └── source-chip/
│   │   │
│   │   ├── feedback/                 # Feedback components
│   │   │   ├── status-badge/
│   │   │   ├── empty-state/
│   │   │   ├── error-boundary/
│   │   │   └── loading-state/
│   │   │
│   │   └── shared/                   # Cross-cutting components
│   │       ├── seo/
│   │       ├── analytics/
│   │       └── error-tracking/
│   │
│   ├── features/                     # Feature modules (MAIN BUSINESS LOGIC)
│   │   │
│   │   ├── auth/                     # Authentication feature
│   │   │   ├── components/
│   │   │   │   ├── login-form.tsx
│   │   │   │   ├── signup-form.tsx
│   │   │   │   ├── forgot-password-form.tsx
│   │   │   │   └── otp-input.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-auth.ts
│   │   │   │   ├── use-login.ts
│   │   │   │   └── use-signup.ts
│   │   │   ├── services/
│   │   │   │   └── auth.service.ts
│   │   │   ├── store/
│   │   │   │   └── auth.store.ts
│   │   │   ├── types/
│   │   │   │   └── auth.types.ts
│   │   │   ├── utils/
│   │   │   │   └── auth.utils.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── itr/                      # ITR Filing feature
│   │   │   ├── components/
│   │   │   │   ├── section-card/
│   │   │   │   │   ├── section-card.tsx
│   │   │   │   │   ├── section-card-glance.tsx
│   │   │   │   │   ├── section-card-summary.tsx
│   │   │   │   │   ├── section-card-detailed.tsx
│   │   │   │   │   └── index.ts
│   │   │   │   ├── regime-toggle/
│   │   │   │   ├── itr-type-selector/
│   │   │   │   └── filing-progress/
│   │   │   ├── hooks/
│   │   │   │   ├── use-itr.ts
│   │   │   │   ├── use-tax-computation.ts
│   │   │   │   ├── use-regime-comparison.ts
│   │   │   │   └── use-auto-save.ts
│   │   │   ├── services/
│   │   │   │   └── itr.service.ts
│   │   │   ├── store/
│   │   │   │   └── itr.store.ts
│   │   │   ├── types/
│   │   │   │   └── itr.types.ts
│   │   │   ├── utils/
│   │   │   │   └── itr.utils.ts
│   │   │   ├── constants/
│   │   │   │   └── itr.constants.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── personal-info/            # Personal Information section
│   │   │   ├── components/
│   │   │   │   ├── personal-info-form.tsx
│   │   │   │   ├── employer-form.tsx
│   │   │   │   └── address-form.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-personal-info.ts
│   │   │   ├── schema/
│   │   │   │   └── personal-info.schema.ts
│   │   │   ├── types/
│   │   │   │   └── personal-info.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── income/                   # Income feature
│   │   │   ├── salary/
│   │   │   │   ├── components/
│   │   │   │   │   ├── salary-form.tsx
│   │   │   │   │   ├── salary-breakdown.tsx
│   │   │   │   │   └── hra-calculator.tsx
│   │   │   │   ├── hooks/
│   │   │   │   │   └── use-salary.ts
│   │   │   │   ├── schema/
│   │   │   │   │   └── salary.schema.ts
│   │   │   │   └── index.ts
│   │   │   ├── house-property/
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── schema/
│   │   │   │   └── index.ts
│   │   │   ├── capital-gains/
│   │   │   │   ├── components/
│   │   │   │   │   ├── capital-gains-form.tsx
│   │   │   │   │   ├── equity-gains.tsx
│   │   │   │   │   ├── property-gains.tsx
│   │   │   │   │   └── loss-carryforward.tsx
│   │   │   │   ├── hooks/
│   │   │   │   ├── schema/
│   │   │   │   └── index.ts
│   │   │   ├── other-sources/
│   │   │   │   ├── components/
│   │   │   │   ├── hooks/
│   │   │   │   ├── schema/
│   │   │   │   └── index.ts
│   │   │   └── index.ts              # Income barrel export
│   │   │
│   │   ├── deductions/               # Deductions feature
│   │   │   ├── components/
│   │   │   │   ├── deductions-form.tsx
│   │   │   │   ├── section-80c/
│   │   │   │   │   ├── section-80c-form.tsx
│   │   │   │   │   └── investment-row.tsx
│   │   │   │   ├── section-80d/
│   │   │   │   ├── section-80g/
│   │   │   │   └── other-deductions/
│   │   │   ├── hooks/
│   │   │   │   ├── use-deductions.ts
│   │   │   │   └── use-deduction-limits.ts
│   │   │   ├── schema/
│   │   │   │   └── deductions.schema.ts
│   │   │   ├── constants/
│   │   │   │   └── deduction-limits.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── taxes-paid/               # Taxes Paid feature
│   │   │   ├── components/
│   │   │   │   ├── tds-form.tsx
│   │   │   │   ├── advance-tax-form.tsx
│   │   │   │   └── tcs-form.tsx
│   │   │   ├── hooks/
│   │   │   ├── schema/
│   │   │   └── index.ts
│   │   │
│   │   ├── bank-details/             # Bank Details feature
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── schema/
│   │   │   └── index.ts
│   │   │
│   │   ├── discrepancy/              # Discrepancy handling feature
│   │   │   ├── components/
│   │   │   │   ├── discrepancy-banner.tsx
│   │   │   │   ├── discrepancy-resolver.tsx
│   │   │   │   └── discrepancy-list.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-discrepancies.ts
│   │   │   ├── types/
│   │   │   │   └── discrepancy.types.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── document/                 # Document upload feature
│   │   │   ├── components/
│   │   │   │   ├── document-uploader.tsx
│   │   │   │   ├── form16-uploader.tsx
│   │   │   │   ├── broker-statement-uploader.tsx
│   │   │   │   └── document-list.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── use-document-upload.ts
│   │   │   │   └── use-document-extraction.ts
│   │   │   ├── services/
│   │   │   │   └── document.service.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── computation/              # Tax computation feature
│   │   │   ├── components/
│   │   │   │   ├── computation-sheet.tsx
│   │   │   │   ├── regime-comparison.tsx
│   │   │   │   └── tax-optimizer.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-computation.ts
│   │   │   ├── engine/
│   │   │   │   ├── tax-calculator.ts
│   │   │   │   ├── slab-calculator.ts
│   │   │   │   └── regime-comparator.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── submission/               # Submission feature
│   │   │   ├── components/
│   │   │   │   ├── review-summary.tsx
│   │   │   │   ├── validation-errors.tsx
│   │   │   │   ├── e-verify-options.tsx
│   │   │   │   └── submission-success.tsx
│   │   │   ├── hooks/
│   │   │   │   └── use-submission.ts
│   │   │   └── index.ts
│   │   │
│   │   └── refund/                   # Refund tracking feature
│   │       ├── components/
│   │       ├── hooks/
│   │       └── index.ts
│   │
│   ├── hooks/                        # Global hooks
│   │   ├── use-debounce.ts
│   │   ├── use-local-storage.ts
│   │   ├── use-media-query.ts
│   │   ├── use-intersection-observer.ts
│   │   ├── use-keyboard-shortcut.ts
│   │   ├── use-toast.ts
│   │   └── index.ts
│   │
│   ├── lib/                          # Core libraries
│   │   ├── api/
│   │   │   ├── client.ts             # API client (axios/fetch wrapper)
│   │   │   ├── interceptors.ts
│   │   │   └── endpoints.ts
│   │   ├── utils/
│   │   │   ├── cn.ts                 # className utility
│   │   │   ├── format.ts             # Formatting utilities
│   │   │   ├── validation.ts         # Validation utilities
│   │   │   └── date.ts               # Date utilities
│   │   ├── motion/
│   │   │   ├── variants.ts           # Framer Motion variants
│   │   │   └── transitions.ts
│   │   └── constants/
│   │       ├── routes.ts
│   │       ├── config.ts
│   │       └── tax-rates.ts
│   │
│   ├── store/                        # Global state management
│   │   ├── index.ts
│   │   ├── root.store.ts
│   │   ├── ui.store.ts               # UI state (modals, toasts, etc.)
│   │   └── middleware/
│   │       ├── persist.ts
│   │       └── logger.ts
│   │
│   ├── services/                     # API services
│   │   ├── api.service.ts            # Base API service
│   │   ├── auth.service.ts
│   │   ├── itr.service.ts
│   │   ├── document.service.ts
│   │   └── user.service.ts
│   │
│   ├── types/                        # Global types
│   │   ├── index.ts
│   │   ├── api.types.ts
│   │   ├── common.types.ts
│   │   └── env.d.ts
│   │
│   ├── schemas/                      # Validation schemas (Zod)
│   │   ├── common.schema.ts
│   │   └── index.ts
│   │
│   ├── providers/                    # React context providers
│   │   ├── app-providers.tsx         # Combined providers wrapper
│   │   ├── auth-provider.tsx
│   │   ├── theme-provider.tsx
│   │   ├── toast-provider.tsx
│   │   └── query-provider.tsx
│   │
│   └── config/                       # App configuration
│       ├── site.ts                   # Site metadata
│       ├── navigation.ts             # Navigation config
│       └── seo.ts                    # SEO config
│
├── .env.local
├── .env.development
├── .env.production
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── README.md

└─────────────────────────────────────────────────────────────────────────────┘
```

---

### Design Tokens & Theming
- Solar Gold / Ember Amber palette values (see [`docs/UI.md`](docs/UI.md)) live in `packages/ui/theme/tokens.ts` and are mirrored into each app via `apps/<app>/src/styles/tokens.ts`.
- Tailwind must extend `colors.primary`, `colors.ember`, `colors.slate`, etc. with those same tokens; do **not** inline hex values in UI components.
- When adjusting the palette, update the token file, Tailwind config, and run `pnpm lint --filter=web` before touching feature code so shared components stay consistent.

## BACKEND API STRUCTURE (services/api)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NODE.JS API STRUCTURE                                                      │
├─────────────────────────────────────────────────────────────────────────────┤

services/api/
├── src/
│   ├── main.ts                       # Application entry point
│   │
│   ├── app/
│   │   ├── app.module.ts             # Root module
│   │   └── app.controller.ts         # Health check
│   │
│   ├── modules/                      # Feature modules
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   ├── local.strategy.ts
│   │   │   │   └── google.strategy.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt-auth.guard.ts
│   │   │   │   └── roles.guard.ts
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── signup.dto.ts
│   │   │   │   └── token.dto.ts
│   │   │   └── entities/
│   │   │       └── session.entity.ts
│   │   │
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   └── entities/
│   │   │       └── user.entity.ts
│   │   │
│   │   ├── itr/
│   │   │   ├── itr.module.ts
│   │   │   ├── itr.controller.ts
│   │   │   ├── itr.service.ts
│   │   │   ├── itr.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-itr.dto.ts
│   │   │   │   ├── update-itr.dto.ts
│   │   │   │   └── submit-itr.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── itr.entity.ts
│   │   │   │   ├── itr-personal.entity.ts
│   │   │   │   ├── itr-income.entity.ts
│   │   │   │   └── itr-deduction.entity.ts
│   │   │   └── services/
│   │   │       ├── computation.service.ts
│   │   │       ├── validation.service.ts
│   │   │       └── submission.service.ts
│   │   │
│   │   ├── documents/
│   │   │   ├── documents.module.ts
│   │   │   ├── documents.controller.ts
│   │   │   ├── documents.service.ts
│   │   │   ├── dto/
│   │   │   └── entities/
│   │   │       └── document.entity.ts
│   │   │
│   │   ├── integration/              # External integrations
│   │   │   ├── integration.module.ts
│   │   │   ├── services/
│   │   │   │   ├── income-tax-portal.service.ts
│   │   │   │   ├── ais.service.ts
│   │   │   │   ├── pan-verification.service.ts
│   │   │   │   └── bank-verification.service.ts
│   │   │   └── dto/
│   │   │
│   │   └── notifications/
│   │       ├── notifications.module.ts
│   │       ├── notifications.service.ts
│   │       ├── providers/
│   │       │   ├── email.provider.ts
│   │       │   ├── sms.provider.ts
│   │       │   └── push.provider.ts
│   │       └── templates/
│   │
│   ├── common/                       # Shared code
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   └── api-response.decorator.ts
│   │   ├── filters/
│   │   │   ├── http-exception.filter.ts
│   │   │   └── validation.filter.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── timeout.interceptor.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   ├── guards/
│   │   │   └── throttle.guard.ts
│   │   └── middleware/
│   │       ├── logger.middleware.ts
│   │       └── correlation-id.middleware.ts
│   │
│   ├── config/                       # Configuration
│   │   ├── configuration.ts
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   ├── redis.config.ts
│   │   └── validation.ts
│   │
│   ├── database/                     # Database
│   │   ├── database.module.ts
│   │   ├── migrations/
│   │   └── seeds/
│   │
│   ├── jobs/                         # Background jobs
│   │   ├── jobs.module.ts
│   │   ├── processors/
│   │   │   ├── document-processing.processor.ts
│   │   │   ├── email.processor.ts
│   │   │   └── itr-submission.processor.ts
│   │   └── queues/
│   │
│   └── shared/                       # Shared utilities
│       ├── utils/
│       │   ├── hash.util.ts
│       │   ├── date.util.ts
│       │   └── pagination.util.ts
│       ├── constants/
│       │   └── error-codes.ts
│       └── types/
│           └── pagination.type.ts
│
├── test/
│   ├── e2e/
│   └── unit/
│
├── .env
├── nest-cli.json
├── package.json
└── tsconfig.json

└─────────────────────────────────────────────────────────────────────────────┘
```

---

## STATE MANAGEMENT ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  STATE MANAGEMENT (Zustand + React Query)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PHILOSOPHY                                                                 │
│  ──────────                                                                 │
│  • Server state: React Query (caching, sync, mutations)                    │
│  • Client state: Zustand (UI state, form state, local preferences)         │
│  • Form state: React Hook Form (form-specific state)                       │
│  • URL state: Next.js router (shareable state)                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Zustand Store Pattern

```typescript
// store/itr.store.ts

import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Types
interface ITRState {
  // Data
  currentITR: ITRData | null;
  expandedSection: SectionId | null;
  selectedRegime: 'old' | 'new';
  
  // Computed (derived from data)
  discrepancyCount: number;
  completionPercentage: number;
  
  // UI State
  isAutoSaving: boolean;
  lastSavedAt: Date | null;
  
  // Actions
  setCurrentITR: (itr: ITRData) => void;
  updateSection: <K extends keyof ITRData>(section: K, data: Partial<ITRData[K]>) => void;
  expandSection: (sectionId: SectionId | null) => void;
  setRegime: (regime: 'old' | 'new') => void;
  resetITR: () => void;
}

// Initial state
const initialState = {
  currentITR: null,
  expandedSection: null,
  selectedRegime: 'old' as const,
  discrepancyCount: 0,
  completionPercentage: 0,
  isAutoSaving: false,
  lastSavedAt: null,
};

// Store
export const useITRStore = create<ITRState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          ...initialState,

          setCurrentITR: (itr) =>
            set((state) => {
              state.currentITR = itr;
              state.completionPercentage = calculateCompletion(itr);
              state.discrepancyCount = countDiscrepancies(itr);
            }),

          updateSection: (section, data) =>
            set((state) => {
              if (state.currentITR) {
                state.currentITR[section] = {
                  ...state.currentITR[section],
                  ...data,
                };
                state.completionPercentage = calculateCompletion(state.currentITR);
              }
            }),

          expandSection: (sectionId) =>
            set((state) => {
              state.expandedSection = sectionId;
            }),

          setRegime: (regime) =>
            set((state) => {
              state.selectedRegime = regime;
            }),

          resetITR: () => set(initialState),
        }))
      ),
      {
        name: 'itr-storage',
        partialize: (state) => ({
          currentITR: state.currentITR,
          selectedRegime: state.selectedRegime,
        }),
      }
    ),
    { name: 'ITR Store' }
  )
);

// Selectors (memoized)
export const selectCurrentITR = (state: ITRState) => state.currentITR;
export const selectPersonalInfo = (state: ITRState) => state.currentITR?.personalInfo;
export const selectIncome = (state: ITRState) => state.currentITR?.income;
export const selectDeductions = (state: ITRState) => state.currentITR?.deductions;
export const selectIsComplete = (state: ITRState) => state.completionPercentage === 100;

// Hooks for specific slices
export const usePersonalInfo = () => useITRStore(selectPersonalInfo);
export const useIncome = () => useITRStore(selectIncome);
export const useExpandedSection = () => useITRStore((s) => s.expandedSection);
```

### React Query Pattern

```typescript
// features/itr/hooks/use-itr.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { itrService } from '@/services/itr.service';

// Query Keys (centralized)
export const itrKeys = {
  all: ['itr'] as const,
  lists: () => [...itrKeys.all, 'list'] as const,
  list: (filters: ITRFilters) => [...itrKeys.lists(), filters] as const,
  details: () => [...itrKeys.all, 'detail'] as const,
  detail: (id: string) => [...itrKeys.details(), id] as const,
  computation: (id: string) => [...itrKeys.detail(id), 'computation'] as const,
};

// Fetch ITR
export function useITR(id: string) {
  return useQuery({
    queryKey: itrKeys.detail(id),
    queryFn: () => itrService.getById(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// Fetch Tax Computation (derived data)
export function useTaxComputation(id: string) {
  return useQuery({
    queryKey: itrKeys.computation(id),
    queryFn: () => itrService.getComputation(id),
    staleTime: 0, // Always fresh (depends on ITR data)
    enabled: !!id,
  });
}

// Update ITR Section
export function useUpdateITRSection(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ section, data }: { section: string; data: unknown }) =>
      itrService.updateSection(id, section, data),
    
    // Optimistic update
    onMutate: async ({ section, data }) => {
      await queryClient.cancelQueries({ queryKey: itrKeys.detail(id) });
      
      const previousITR = queryClient.getQueryData(itrKeys.detail(id));
      
      queryClient.setQueryData(itrKeys.detail(id), (old: ITRData) => ({
        ...old,
        [section]: { ...old[section], ...data },
      }));
      
      return { previousITR };
    },
    
    onError: (err, variables, context) => {
      queryClient.setQueryData(itrKeys.detail(id), context?.previousITR);
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: itrKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: itrKeys.computation(id) });
    },
  });
}

// Auto-save hook
export function useAutoSave(id: string, data: ITRData, enabled = true) {
  const mutation = useUpdateITRSection(id);
  const [debouncedData] = useDebounce(data, 2000);

  useEffect(() => {
    if (enabled && debouncedData) {
      mutation.mutate({ section: 'all', data: debouncedData });
    }
  }, [debouncedData, enabled]);

  return mutation;
}
```

---

## COMPONENT PATTERNS

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  COMPONENT PATTERNS                                                         │
├─────────────────────────────────────────────────────────────────────────────┤
```

### 1. Container/Presenter Pattern

```typescript
// Container (Smart Component) - handles data & logic
// features/income/salary/salary-section.tsx

'use client';

import { useSalary } from './hooks/use-salary';
import { useITRStore } from '@/store/itr.store';
import { SalaryForm } from './components/salary-form';
import { SalaryBreakdown } from './components/salary-breakdown';
import { SectionCard } from '@/features/itr/components/section-card';

export function SalarySection() {
  const { data, isLoading, error } = useSalary();
  const expandSection = useITRStore((s) => s.expandSection);
  const isExpanded = useITRStore((s) => s.expandedSection === 'salary');

  if (error) return <SectionCard.Error onRetry={refetch} />;

  return (
    <SectionCard
      id="salary"
      title="Salary Income"
      icon={Wallet}
      primaryValue={data?.totalSalary ?? 0}
      secondaryText={`${data?.employers?.length ?? 0} employer(s)`}
      status={getStatus(data)}
      isExpanded={isExpanded}
      onExpand={() => expandSection('salary')}
      onCollapse={() => expandSection(null)}
    >
      {isLoading ? (
        <SectionCard.Skeleton />
      ) : (
        <>
          <SalaryBreakdown data={data} />
          <SalaryForm defaultValues={data} />
        </>
      )}
    </SectionCard>
  );
}

// Presenter (Dumb Component) - pure UI
// features/income/salary/components/salary-breakdown.tsx

interface SalaryBreakdownProps {
  data: SalaryData;
  onItemClick?: (id: string) => void;
}

export function SalaryBreakdown({ data, onItemClick }: SalaryBreakdownProps) {
  return (
    <BreakdownList
      items={[
        { label: 'Basic + DA', amount: data.basic },
        { label: 'HRA', amount: data.hra },
        { label: 'Special Allowance', amount: data.specialAllowance },
        { label: 'Other Allowances', amount: data.otherAllowances },
      ]}
      onItemClick={onItemClick}
    />
  );
}
```

### 2. Compound Component Pattern

```typescript
// components/ui/card/card.tsx

import { createContext, useContext, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Context
const CardContext = createContext<{ variant?: string }>({});
const useCardContext = () => useContext(CardContext);

// Root
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outlined';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', className, children, ...props }, ref) => {
    return (
      <CardContext.Provider value={{ variant }}>
        <div
          ref={ref}
          className={cn(
            'rounded-2xl bg-white',
            {
              'shadow-card': variant === 'default',
              'shadow-elevated': variant === 'elevated',
              'border border-gray-200': variant === 'outlined',
            },
            className
          )}
          {...props}
        >
          {children}
        </div>
      </CardContext.Provider>
    );
  }
);

// Header
const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-between p-6 pb-4', className)}
      {...props}
    />
  )
);

// Title
const CardTitle = forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-heading-lg text-gray-800', className)}
      {...props}
    />
  )
);

// Content
const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);

// Footer
const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-4 border-t border-gray-100', className)}
      {...props}
    />
  )
);

// Export compound component
export { Card, CardHeader, CardTitle, CardContent, CardFooter };

// Usage
<Card variant="elevated">
  <CardHeader>
    <CardTitle>Income Details</CardTitle>
    <Button variant="ghost" size="sm">Edit</Button>
  </CardHeader>
  <CardContent>
    <SalaryBreakdown />
  </CardContent>
  <CardFooter>
    <Button>Save Changes</Button>
  </CardFooter>
</Card>
```

### 3. Render Props Pattern

```typescript
// components/data-display/data-list.tsx

interface DataListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  renderLoading?: () => React.ReactNode;
  keyExtractor: (item: T) => string;
  isLoading?: boolean;
  className?: string;
}

export function DataList<T>({
  items,
  renderItem,
  renderEmpty,
  renderLoading,
  keyExtractor,
  isLoading,
  className,
}: DataListProps<T>) {
  if (isLoading && renderLoading) {
    return renderLoading();
  }

  if (items.length === 0 && renderEmpty) {
    return renderEmpty();
  }

  return (
    <div className={cn('divide-y divide-gray-100', className)}>
      {items.map((item, index) => (
        <div key={keyExtractor(item)}>{renderItem(item, index)}</div>
      ))}
    </div>
  );
}

// Usage
<DataList
  items={incomeItems}
  keyExtractor={(item) => item.id}
  renderItem={(item) => <IncomeRow {...item} />}
  renderEmpty={() => <EmptyState message="No income added" />}
  renderLoading={() => <Skeleton count={3} />}
  isLoading={isLoading}
/>
```

### 4. HOC Pattern (for cross-cutting concerns)

```typescript
// components/shared/with-error-boundary.tsx

import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <WrappedComponent {...props} />
      </ErrorBoundary>
    );
  };
}

// Usage
const SafeSalarySection = withErrorBoundary(SalarySection, <SectionError />);
```

---

## API SERVICE PATTERN

```typescript
// lib/api/client.ts

import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  private static instance: ApiClient;

  private constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        
        // Add correlation ID
        config.headers['X-Correlation-ID'] = generateCorrelationId();
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError) => {
        const originalRequest = error.config;

        // Handle 401 - Token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            const newToken = await this.refreshToken();
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Redirect to login
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        // Transform error
        return Promise.reject(this.transformError(error));
      }
    );
  }

  private transformError(error: AxiosError): ApiError {
    return {
      code: error.response?.data?.code || 'UNKNOWN_ERROR',
      message: error.response?.data?.message || 'Something went wrong',
      status: error.response?.status,
      details: error.response?.data?.details,
    };
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config);
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post(url, data, config);
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put(url, data, config);
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.client.patch(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config);
  }
}

export const apiClient = ApiClient.getInstance();


// services/itr.service.ts

import { apiClient } from '@/lib/api/client';
import { ITRData, ITRComputation, CreateITRDto, UpdateSectionDto } from '@/types';

class ITRService {
  private basePath = '/api/v1/itr';

  async getAll(params?: { year?: string; status?: string }): Promise<ITRData[]> {
    return apiClient.get(this.basePath, { params });
  }

  async getById(id: string): Promise<ITRData> {
    return apiClient.get(`${this.basePath}/${id}`);
  }

  async create(data: CreateITRDto): Promise<ITRData> {
    return apiClient.post(this.basePath, data);
  }

  async updateSection(id: string, section: string, data: UpdateSectionDto): Promise<ITRData> {
    return apiClient.patch(`${this.basePath}/${id}/sections/${section}`, data);
  }

  async getComputation(id: string): Promise<ITRComputation> {
    return apiClient.get(`${this.basePath}/${id}/computation`);
  }

  async submit(id: string): Promise<{ acknowledgmentNumber: string }> {
    return apiClient.post(`${this.basePath}/${id}/submit`);
  }

  async downloadITRV(id: string): Promise<Blob> {
    return apiClient.get(`${this.basePath}/${id}/itr-v`, {
      responseType: 'blob',
    });
  }
}

export const itrService = new ITRService();
```

---

## FORM HANDLING PATTERN

```typescript
// features/income/salary/components/salary-form.tsx

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { salarySchema, SalaryFormData } from '../schema/salary.schema';
import { useUpdateSalary } from '../hooks/use-salary';

interface SalaryFormProps {
  defaultValues?: Partial<SalaryFormData>;
  onSuccess?: () => void;
}

export function SalaryForm({ defaultValues, onSuccess }: SalaryFormProps) {
  const updateSalary = useUpdateSalary();

  const form = useForm<SalaryFormData>({
    resolver: zodResolver(salarySchema),
    defaultValues: {
      employerName: '',
      employerTan: '',
      basic: 0,
      hra: 0,
      specialAllowance: 0,
      ...defaultValues,
    },
    mode: 'onBlur',
  });

  const onSubmit = async (data: SalaryFormData) => {
    try {
      await updateSalary.mutateAsync(data);
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <FormField
        control={form.control}
        name="employerName"
        render={({ field, fieldState }) => (
          <Input
            label="Employer Name"
            error={fieldState.error?.message}
            source={defaultValues?.source}
            {...field}
          />
        )}
      />

      <FormField
        control={form.control}
        name="basic"
        render={({ field, fieldState }) => (
          <CurrencyInput
            label="Basic + DA"
            error={fieldState.error?.message}
            {...field}
          />
        )}
      />

      {/* More fields */}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={() => form.reset()}>
          Reset
        </Button>
        <Button 
          type="submit" 
          loading={updateSalary.isPending}
          disabled={!form.formState.isDirty}
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
}


// Schema
// features/income/salary/schema/salary.schema.ts

import { z } from 'zod';

export const salarySchema = z.object({
  employerName: z
    .string()
    .min(1, 'Employer name is required')
    .max(100, 'Employer name too long'),
  
  employerTan: z
    .string()
    .regex(/^[A-Z]{4}[0-9]{5}[A-Z]$/, 'Invalid TAN format'),
  
  basic: z
    .number()
    .min(0, 'Basic salary cannot be negative')
    .max(100000000, 'Please verify this amount'),
  
  hra: z
    .number()
    .min(0, 'HRA cannot be negative'),
  
  specialAllowance: z
    .number()
    .min(0, 'Special allowance cannot be negative'),
  
  otherAllowances: z
    .number()
    .min(0)
    .optional()
    .default(0),
});

export type SalaryFormData = z.infer<typeof salarySchema>;
```

---

## TESTING STRATEGY

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  TESTING STRUCTURE                                                          │
├─────────────────────────────────────────────────────────────────────────────┤

tests/
├── unit/                             # Unit tests
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── services/
│
├── integration/                      # Integration tests
│   ├── api/
│   └── features/
│
├── e2e/                             # End-to-end tests (Playwright)
│   ├── auth.spec.ts
│   ├── filing.spec.ts
│   └── submission.spec.ts
│
├── fixtures/                        # Test fixtures
│   ├── itr.fixture.ts
│   └── user.fixture.ts
│
├── mocks/                           # MSW mocks
│   ├── handlers/
│   └── server.ts
│
└── setup/                           # Test setup
    ├── setup.ts
    └── test-utils.tsx

└─────────────────────────────────────────────────────────────────────────────┘
```

### Test Examples

```typescript
// tests/unit/components/section-card.test.tsx

import { render, screen, fireEvent } from '@testing-library/react';
import { SectionCard } from '@/features/itr/components/section-card';

describe('SectionCard', () => {
  const defaultProps = {
    id: 'income',
    title: 'Income',
    icon: WalletIcon,
    primaryValue: 1000000,
    status: 'complete' as const,
    isExpanded: false,
    onExpand: jest.fn(),
    onCollapse: jest.fn(),
  };

  it('renders in summary state by default', () => {
    render(<SectionCard {...defaultProps} />);
    
    expect(screen.getByText('Income')).toBeInTheDocument();
    expect(screen.getByText('₹10,00,000')).toBeInTheDocument();
  });

  it('calls onExpand when clicked', () => {
    render(<SectionCard {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('region'));
    
    expect(defaultProps.onExpand).toHaveBeenCalled();
  });

  it('renders children when expanded', () => {
    render(
      <SectionCard {...defaultProps} isExpanded>
        <div data-testid="children">Content</div>
      </SectionCard>
    );
    
    expect(screen.getByTestId('children')).toBeInTheDocument();
  });
});


// tests/e2e/filing.spec.ts

import { test, expect } from '@playwright/test';

test.describe('ITR Filing Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should complete salary section', async ({ page }) => {
    await page.goto('/itr/itr-1/2024-25');
    
    // Click on income section
    await page.click('[data-section="income"]');
    
    // Fill salary form
    await page.fill('[name="basic"]', '600000');
    await page.fill('[name="hra"]', '72000');
    
    // Save
    await page.click('button:has-text("Save")');
    
    // Verify tax bar updated
    await expect(page.locator('[data-testid="gross-income"]')).toContainText('₹6,72,000');
  });
});
```

---

## CI/CD PIPELINE

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm lint

  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm typecheck

  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test:ci
      - uses: codecov/codecov-action@v3

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/

  build:
    runs-on: ubuntu-latest
    needs: [lint, typecheck, test]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm build
      - uses: actions/upload-artifact@v3
        with:
          name: build
          path: apps/web/.next
```

---

## PERFORMANCE OPTIMIZATION

```typescript
// Performance patterns

// 1. Code Splitting
// app/(filing)/itr/[type]/[year]/page.tsx
import dynamic from 'next/dynamic';

const TaxOptimizer = dynamic(
  () => import('@/features/computation/components/tax-optimizer'),
  { 
    loading: () => <Skeleton className="h-64" />,
    ssr: false 
  }
);

// 2. Image Optimization
import Image from 'next/image';

<Image
  src="/images/hero.png"
  alt="Hero"
  width={800}
  height={600}
  priority // for above-fold images
  placeholder="blur"
  blurDataURL="..."
/>

// 3. Memoization
import { memo, useMemo, useCallback } from 'react';

const ExpensiveComponent = memo(function ExpensiveComponent({ data }) {
  const processedData = useMemo(() => 
    expensiveCalculation(data), 
    [data]
  );
  
  const handleClick = useCallback(() => {
    doSomething(data.id);
  }, [data.id]);
  
  return <div onClick={handleClick}>{processedData}</div>;
});

// 4. Virtual Lists (for large data)
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="h-[400px] overflow-auto">
      <div
        style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <ItemRow item={items[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}

// 5. Debounced API calls
function useAutoSave(data, delay = 2000) {
  const [debouncedValue] = useDebounce(data, delay);
  const previousValue = useRef(data);
  
  useEffect(() => {
    if (
      debouncedValue && 
      JSON.stringify(debouncedValue) !== JSON.stringify(previousValue.current)
    ) {
      saveToServer(debouncedValue);
      previousValue.current = debouncedValue;
    }
  }, [debouncedValue]);
}

// 6. Prefetching
// In layout or parent component
import { useQueryClient } from '@tanstack/react-query';

function DashboardLayout({ children }) {
  const queryClient = useQueryClient();
  
  // Prefetch ITR data when user hovers over filing link
  const prefetchITR = (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['itr', id],
      queryFn: () => itrService.getById(id),
    });
  };
  
  return (
    <nav>
      <Link href="/itr/..." onMouseEnter={() => prefetchITR('123')}>
        Continue Filing
      </Link>
    </nav>
  );
}
```

---

## ENVIRONMENT CONFIGURATION

```typescript
// config/env.ts

import { z } from 'zod';

const envSchema = z.object({
  // App
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  
  // API
  NEXT_PUBLIC_API_URL: z.string().url(),
  API_SECRET_KEY: z.string().min(32),
  
  // Database
  DATABASE_URL: z.string(),
  
  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // External Services
  INCOME_TAX_PORTAL_API_URL: z.string().url(),
  INCOME_TAX_PORTAL_API_KEY: z.string(),
  
  // Storage
  AWS_S3_BUCKET: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  
  // Redis
  REDIS_URL: z.string(),
  
  // Analytics
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

export const env = envSchema.parse(process.env);

// Type-safe env access
export type Env = z.infer<typeof envSchema>;
```

---

## QUICK REFERENCE - FILE NAMING

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  NAMING CONVENTIONS SUMMARY                                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FILES                                                                      │
│  ─────                                                                      │
│  Components:     kebab-case.tsx        (section-card.tsx)                  │
│  Hooks:          use-kebab-case.ts     (use-auto-save.ts)                  │
│  Services:       kebab-case.service.ts (itr.service.ts)                    │
│  Stores:         kebab-case.store.ts   (itr.store.ts)                      │
│  Types:          kebab-case.types.ts   (itr.types.ts)                      │
│  Schemas:        kebab-case.schema.ts  (salary.schema.ts)                  │
│  Utils:          kebab-case.ts         (format.ts)                         │
│  Constants:      kebab-case.ts         (tax-rates.ts)                      │
│  Tests:          kebab-case.test.ts    (section-card.test.tsx)             │
│                                                                             │
│  EXPORTS                                                                    │
│  ───────                                                                    │
│  Components:     PascalCase            (SectionCard)                       │
│  Hooks:          camelCase             (useAutoSave)                       │
│  Functions:      camelCase             (formatCurrency)                    │
│  Constants:      SCREAMING_SNAKE       (TAX_SLABS)                         │
│  Types:          PascalCase            (ITRData)                           │
│                                                                             │
│  FOLDERS                                                                    │
│  ───────                                                                    │
│  All:            kebab-case            (capital-gains, tax-computation)    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## SUMMARY CHECKLIST

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CODE ARCHITECTURE CHECKLIST                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STRUCTURE                                                                  │
│  ☐ Feature-first organization                                              │
│  ☐ Clear separation of concerns                                            │
│  ☐ Consistent file naming                                                  │
│  ☐ Barrel exports (index.ts)                                               │
│  ☐ Co-located tests                                                        │
│                                                                             │
│  STATE MANAGEMENT                                                           │
│  ☐ React Query for server state                                            │
│  ☐ Zustand for client state                                                │
│  ☐ React Hook Form for forms                                               │
│  ☐ URL for shareable state                                                 │
│                                                                             │
│  COMPONENTS                                                                 │
│  ☐ Container/Presenter pattern                                             │
│  ☐ Compound components for complex UI                                      │
│  ☐ Proper prop typing                                                      │
│  ☐ Error boundaries                                                        │
│                                                                             │
│  API LAYER                                                                  │
│  ☐ Centralized API client                                                  │
│  ☐ Service classes per domain                                              │
│  ☐ Proper error handling                                                   │
│  ☐ Type-safe responses                                                     │
│                                                                             │
│  FORMS                                                                      │
│  ☐ Zod schemas for validation                                              │
│  ☐ React Hook Form integration                                             │
│  ☐ Error display                                                           │
│  ☐ Loading states                                                          │
│                                                                             │
│  PERFORMANCE                                                                │
│  ☐ Code splitting                                                          │
│  ☐ Memoization where needed                                                │
│  ☐ Virtual lists for large data                                            │
│  ☐ Image optimization                                                      │
│  ☐ Prefetching                                                             │
│                                                                             │
│  TESTING                                                                    │
│  ☐ Unit tests for utilities                                                │
│  ☐ Component tests                                                         │
│  ☐ Integration tests                                                       │
│  ☐ E2E tests for critical flows                                            │
│                                                                             │
│  CI/CD                                                                      │
│  ☐ Linting                                                                 │
│  ☐ Type checking                                                           │
│  ☐ Automated tests                                                         │
│  ☐ Build verification                                                      │
│  ☐ Preview deployments                                                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

This architecture is designed for:

1. **Performance** - Code splitting, memoization, virtual lists
2. **Maintainability** - Feature-first structure, clear patterns
3. **Readability** - Consistent naming, co-located code
4. **Reusability** - Shared components, hooks, utilities
5. **Testability** - Pure functions, dependency injection
6. **Scalability** - Monorepo structure, modular features
7. **Automation** - CI/CD, linting, formatting

Want me to dive deeper into any specific aspect?