# Repository File Inventory - Part 1: Root Level Files and Configuration

**Generated:** December 2024  
**Purpose:** Complete inventory of root-level files and configuration files

---

## Root Level Files

### `package.json`
**Description**: Root package.json with monorepo scripts for starting frontend/backend, building, testing, linting, and deployment.  
**Functions**: `start`, `start:all`, `start:backend`, `start:frontend`, `build`, `test`, `lint`, `db:migrate`, `db:seed`, `docker:build`, `deploy:staging`, `deploy:production`  
**Status**: ✅ Keep

### `package-lock.json`
**Description**: NPM lock file for root dependencies (bull, connect-redis, framer-motion, ioredis, styled-components).  
**Status**: ✅ Keep

### `README.md`
**Description**: Main project documentation with platform overview, features, quick start guide, technology stack, and project structure.  
**Status**: ✅ Keep

### `start.js`
**Description**: Unified startup script that spawns both frontend and backend servers concurrently. Handles process termination and logging.  
**Functions**: Spawns `npm run dev` (backend) and `npm start` (frontend), handles SIGINT/SIGTERM  
**Status**: ✅ Keep

### `ecosystem.config.js`
**Description**: PM2 ecosystem configuration for production deployment with cluster mode, logging, health checks, and deployment settings.  
**Status**: ✅ Keep (Production deployment)

### `vercel.json`
**Description**: Vercel deployment configuration with builds for backend API and frontend static site, rewrites, headers, and environment variables.  
**Status**: ✅ Keep (If using Vercel)

### `.gitignore`
**Description**: Git ignore patterns for node_modules, build outputs, environment files, logs, IDE files, OS files, Vercel, testing coverage, and temporary files.  
**Status**: ✅ Keep

### `FEATURE-READINESS-REPORT.md`
**Description**: Feature readiness assessment report showing ~85% platform readiness with breakdown by core ITR filing, submission, tax computation, income features, advanced features, and UI/UX compliance.  
**Status**: ⚠️ Review (May be outdated, check if still relevant)

### `DEMO_CREDENTIALS.md`
**Description**: Documentation for demo user credentials and setup instructions for testing the platform.  
**Status**: ✅ Keep (Development/Testing)

### `bb-logo.svg`
**Description**: BurnBlack logo SVG file used in frontend public assets.  
**Status**: ✅ Keep

---

## Backend Configuration Files

### `backend/package.json`
**Description**: Backend package.json with dependencies (Express, Sequelize, PostgreSQL, JWT, Passport, OpenAI, AWS SDK, etc.) and scripts for dev, test, db operations, and deployment.  
**Status**: ✅ Keep

### `backend/package-lock.json`
**Description**: NPM lock file for backend dependencies.  
**Status**: ✅ Keep

### `backend/README.md`
**Description**: Backend-specific documentation with features, architecture, technology stack, project structure, and quick start guide.  
**Status**: ✅ Keep

### `backend/jsconfig.json`
**Description**: JavaScript configuration for backend IDE support and path resolution.  
**Status**: ✅ Keep

### `backend/.eslintrc.json`
**Description**: ESLint configuration for backend code quality and style enforcement.  
**Status**: ✅ Keep

### `backend/.prettierrc.json`
**Description**: Prettier configuration for backend code formatting.  
**Status**: ✅ Keep

---

## Frontend Configuration Files

### `frontend/package.json`
**Description**: Frontend package.json with React 18, Tailwind CSS, React Router, React Query, Axios, React Hook Form, and other UI libraries.  
**Status**: ✅ Keep

### `frontend/package-lock.json`
**Description**: NPM lock file for frontend dependencies.  
**Status**: ✅ Keep

### `frontend/jsconfig.json`
**Description**: JavaScript configuration for frontend IDE support, path aliases, and module resolution.  
**Status**: ✅ Keep

### `frontend/.huskyrc.json`
**Description**: Husky configuration for Git hooks (pre-commit, pre-push).  
**Status**: ✅ Keep

### `frontend/tailwind.config.js`
**Description**: Tailwind CSS configuration with design system tokens (colors: primary/gold, ember, slate, error, success, info, warning; typography: heading, body, display; spacing, border-radius, shadows).  
**Status**: ✅ Keep

### `frontend/postcss.config.js`
**Description**: PostCSS configuration with Tailwind CSS and Autoprefixer plugins.  
**Status**: ✅ Keep

---

## Public Assets

### `frontend/public/index.html`
**Description**: Main HTML entry point with meta tags, PWA manifest link, and root div for React app.  
**Status**: ✅ Keep

### `frontend/public/manifest.json`
**Description**: PWA manifest for progressive web app configuration (name, icons, theme, display mode).  
**Status**: ✅ Keep

### `frontend/public/bb-logo.svg`
**Description**: BurnBlack logo SVG in public directory.  
**Status**: ✅ Keep

---

## Notes

- **Configuration files** (package.json, tailwind.config.js, etc.) are essential and should be kept.
- **Documentation files** (README.md, FEATURE-READINESS-REPORT.md) should be reviewed periodically for accuracy.
- **Build/deployment configs** (vercel.json, ecosystem.config.js) are needed for deployment but may vary by environment.

---

**Next:** See [Part 2: Backend Source Files](REPOSITORY_INVENTORY_PART2_BACKEND.md)

