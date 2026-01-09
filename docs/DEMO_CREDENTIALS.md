# Demo Credentials for BurnBlack ITR Platform

## Quick Setup

To create demo users, run one of the following commands:

### Option 1: Run Migration with Seed Data (Recommended)
```bash
cd backend
npm run db:migrate
```
This will create tables and seed demo users.

### Option 2: Run Seed Script Only
```bash
cd backend
npm run db:seed
```

### Option 3: Reset and Create Admin Only
```bash
cd backend
npm run admin:reset
```

---

## Demo User Credentials

### From `migrate.js` (All passwords: `admin123`)

| Email | Password | Role | Full Name | Status |
|-------|----------|------|-----------|--------|
| `admin@burnblack.com` | `admin123` | `super_admin` | Admin User | Active, Email Verified |
| `user@burnblack.com` | `admin123` | `user` | Test User | Active, Email Verified |
| `ca@burnblack.com` | `admin123` | `ca_firm_admin` | CA Professional | Active, Email Verified |
| `platform@burnblack.com` | `admin123` | `platform_admin` | Platform Admin | Active, Email Verified |
| `chartered@burnblack.com` | `admin123` | `ca` | Chartered Accountant | Active, Email Verified |

### From `seed.js` (Different passwords)

| Email | Password | Role | Full Name | Phone | Status |
|-------|----------|------|-----------|-------|--------|
| `admin@burnblack.com` | `admin123` | `super_admin` | System Administrator | 9999999999 | Active, Email & Phone Verified |
| `user@burnblack.com` | `user123` | `user` | Test User | 8888888888 | Active, Email Verified |
| `ca@burnblack.com` | `ca123` | `ca` | Chartered Accountant | 7777777777 | Active, Email & Phone Verified |

### From `resetAdminPassword.js` (Admin Only - Current)

| Email | Password | Role | Full Name |
|-------|----------|------|-----------|
| `admin@burnblack.com` | `Admin@2024` | `SUPER_ADMIN` | Super Admin |

---

## Current Database Users

Based on the current database, the following users exist:

- `admin@burnblack.com` - SUPER_ADMIN (Super Admin)
- `test@burnblack.com` - END_USER (Test User)
- `user@burnblack.com` - END_USER (Test User)
- `demo@burnblack.com` - END_USER (Demo User)
- `newuser@burnblack.com` - END_USER (New User)
- `ruvientpl@gmail.com` - END_USER (Vivek - Ruvient OPC PL)
- `rungta.vivek@gmail.com` - END_USER (Vivek Rungta)

**Note:** Passwords for existing users are not shown for security reasons. If you need to reset passwords, use the seed scripts above.

---

## Testing Different Roles

### Super Admin
- **Email:** `admin@burnblack.com`
- **Password:** `Admin@2024` (Updated: Dec 2024)
- **Access:** Full platform access, all features

### Regular User
- **Email:** `user@burnblack.com`
- **Password:** Try `admin123` or `user123`
- **Access:** Standard user features, ITR filing

### CA Firm Admin
- **Email:** `ca@burnblack.com`
- **Password:** Try `admin123` or `ca123`
- **Access:** CA firm management features

### Platform Admin
- **Email:** `platform@burnblack.com`
- **Password:** `admin123`
- **Access:** Platform administration features

---

## Important Notes

1. **Password Security:** These are demo credentials. Change all passwords in production!
2. **Email Verification:** Most demo users have `emailVerified: true` for easy testing
3. **Multiple Scripts:** Different seed scripts use different passwords. Check which script was used.
4. **Reset Database:** Use `npm run db:reset` to clear all data before re-seeding

---

## API Endpoints for Testing

- **Login:** `POST /api/auth/login`
- **Register:** `POST /api/auth/register`
- **Health Check:** `GET /api/health`

---

## Troubleshooting

If login fails:
1. Check if users exist: Run the seed scripts above
2. Verify database connection in `.env` file
3. Check backend logs for authentication errors
4. Try resetting admin: `npm run admin:reset`

