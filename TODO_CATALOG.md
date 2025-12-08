# TODO Comments Catalog

**Generated:** 2025-01-27  
**Status:** All TODOs identified and categorized by priority

---

## Critical Priority TODOs

### Backend - ITRController.js
**File:** `backend/src/controllers/ITRController.js`  
**Lines:** 3214, 3399, 3498, 3590  
**Description:** AIS service integration for fetching income data
- Line 3214: Integrate with actual AIS service to fetch rental income
- Line 3399: Integrate with actual AIS service to fetch capital gains
- Line 3498: Integrate with actual AIS service to fetch business income
- Line 3590: Integrate with actual AIS service to fetch professional income
**Impact:** Missing integration with AIS (Annual Information Statement) service
**Dependencies:** AIS service API access/license

### Frontend - ITRComputation.js
**File:** `frontend/src/pages/ITR/ITRComputation.js`  
**Lines:** 2381, 2395, 2407, 2418, 2428, 2446, 2457  
**Description:** Document/note/message API calls
- Line 2381: Upload document via API
- Line 2395: Send document request to client
- Line 2407: Save note via API
- Line 2418: Update note via API
- Line 2428: Delete note via API
- Line 2446: Send message via API
- Line 2457: Request document via API
**Impact:** CA collaboration features not functional
**Dependencies:** Backend endpoints for document/note/message management

### Backend - notifications.js
**File:** `backend/src/routes/notifications.js`  
**Lines:** 278, 357, 384, 411, 437, 463, 489  
**Description:** Notification model implementation
- Line 278: Implement Notification model and fetch from database
- Line 357: Implement Notification model and count from database
- Line 384: Implement Notification model and update in database
- Line 411: Implement Notification model and update in database
- Line 437: Implement Notification model and update all in database
- Line 463: Implement Notification model and delete from database
- Line 489: Implement Notification model and delete all from database
**Impact:** Notification system not fully functional
**Dependencies:** Notification model already exists, needs route integration

### Backend - ca-marketplace.js
**File:** `backend/src/routes/ca-marketplace.js`  
**Lines:** 191, 234, 293, 294, 307, 349, 350, 351, 365  
**Description:** Reviews, availability, booking implementation
- Line 191: Implement reviews model and fetch reviews
- Line 234: Implement availability system
- Line 293: Implement inquiry model and save inquiry
- Line 294: Send email notification to CA firm
- Line 307: Return actual inquiry ID
- Line 349: Implement booking model and save booking
- Line 350: Check availability
- Line 351: Send email notifications
- Line 365: Return actual booking ID
**Impact:** CA marketplace features incomplete
**Dependencies:** CAFirmReview, CABooking models exist, need route integration

### Frontend - ContactSupport.js
**File:** `frontend/src/pages/Help/ContactSupport.js`  
**Line:** 48  
**Description:** Live chat API implementation
**Impact:** Live chat feature not functional
**Dependencies:** WebSocket or chat service backend

---

## High Priority TODOs

### Backend - AdminController.js
**File:** `backend/src/controllers/AdminController.js`  
**Lines:** 5446, 5512  
**Status:** ✅ **FIXED** - Now loads/saves from PlatformSettings model
**Description:** Settings database integration
- Line 5446: Load from database settings table
- Line 5512: Save to database settings table

### Backend - AdminFinancialController.js
**File:** `backend/src/controllers/AdminFinancialController.js`  
**Line:** 566  
**Description:** Trigger actual payment retry via payment gateway
**Impact:** Payment retry functionality incomplete
**Dependencies:** Payment gateway integration

### Frontend - MobileOTPSignup.js
**File:** `frontend/src/pages/Auth/MobileOTPSignup.js`  
**Lines:** 56, 86, 108, 143  
**Description:** Mobile OTP signup API calls
- Line 56: Implement API call to send OTP
- Line 86: Implement API call to verify OTP
- Line 108: Implement API call to resend OTP
- Line 143: Implement API call to complete mobile OTP signup
**Impact:** Mobile OTP signup not functional
**Dependencies:** OTP service backend

### Frontend - ReportBug.js
**File:** `frontend/src/pages/Help/ReportBug.js`  
**Line:** 55  
**Description:** Implement API call to submit bug report
**Impact:** Bug reporting not functional
**Dependencies:** Bug reporting backend endpoint

### Frontend - FeatureRequest.js
**File:** `frontend/src/pages/Help/FeatureRequest.js`  
**Line:** 45  
**Description:** Implement API call to submit feature request
**Impact:** Feature request submission not functional
**Dependencies:** Feature request backend endpoint

---

## Medium Priority TODOs

### Frontend - ProfileSettings.js
**File:** `frontend/src/pages/User/ProfileSettings.js`  
**Line:** 2373  
**Description:** Implement download acknowledgment functionality
**Impact:** Acknowledgment download feature missing
**Dependencies:** Acknowledgment generation service

### Frontend - FAQs.js
**File:** `frontend/src/pages/Help/FAQs.js`  
**Line:** 103  
**Description:** Send feedback to backend
**Impact:** FAQ feedback not saved
**Dependencies:** Feedback backend endpoint

---

## Low Priority TODOs

### Frontend - TaxComputationBar.js
**File:** `frontend/src/components/ITR/TaxComputationBar.js`  
**Line:** 476  
**Description:** Navigate to file ITR
**Impact:** Navigation link missing
**Dependencies:** Route configuration

---

## Summary

**Total TODOs:** 32
- **Critical:** 5 files, 20 TODOs
- **High:** 5 files, 8 TODOs (2 fixed)
- **Medium:** 2 files, 2 TODOs
- **Low:** 1 file, 1 TODO

**Fixed:** 2 (AdminController settings)

**Recommendations:**
1. Prioritize AIS service integration (Critical)
2. Complete notification model integration (Critical)
3. Implement CA marketplace features (Critical)
4. Add mobile OTP signup (High)
5. Implement live chat (Critical)

---

**Last Updated:** 2025-01-27

