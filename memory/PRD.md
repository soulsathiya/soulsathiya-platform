# SoulSathiya - Product Requirements Document

## Original Problem Statement
Build "SoulSathiya", an AI-driven relationship compatibility and matchmaking platform with:
- Secure user authentication (signup/login) and Google Social Login
- Comprehensive user profile system (demographics, lifestyle, values, preferences, photos)
- Multi-photo uploads (up to 6) with privacy controls
- Psychometric questionnaire framework (36-item assessment)
- Compatibility engine to compute match scores
- Match discovery system with filters
- Deep Couple Compatibility Exploration (108-question assessment)
- Subscription-based access (Free, Premium, Elite) using Razorpay
- User verification framework (KYC/Aadhaar)
- Admin dashboard for platform management

## Core Features Implemented

### Phase 1: Foundation (Completed)
- [x] React frontend with Tailwind CSS
- [x] FastAPI backend with MongoDB
- [x] User authentication (email/password)
- [x] Google Social Login (Emergent Auth)
- [x] User profile management system
- [x] Photo upload functionality (placeholder S3)

### Phase 2: Psychometric Engine (Completed)
- [x] 36-item psychometric questionnaire
- [x] 7-domain scoring system
- [x] Archetype assignment algorithm
- [x] Compatibility score calculation
- [x] Match ranking with psychometric scores

### Phase 3: Deep Exploration (Completed)
- [x] 108-question deep assessment
- [x] Pair-based compatibility analysis
- [x] Tier-based access (Elite: free, Premium: ₹999)
- [x] Detailed couple compatibility reports
- [x] 6 relationship modules

### Phase 4: Monetization (Completed)
- [x] Razorpay payment integration
- [x] Profile Boost feature (₹299-₹599)
- [x] Subscription tiers (Basic, Premium, Elite)
- [x] Deep Exploration add-on for Premium users

### Phase 5: Admin Dashboard (Completed - Feb 22, 2026)
- [x] Admin role system (super_admin, moderator, support)
- [x] Admin login route at /admin/login
- [x] Dashboard Overview with metrics
- [x] User Management (view, suspend, activate, verify, delete)
- [x] Profile & Photo Moderation (flag, approve, remove)
- [x] Subscription Management (change tier, extend, cancel)
- [x] Deep Exploration Monitoring (view pairs, revoke access)
- [x] User Reports & Moderation (warn, suspend, ban)
- [x] Analytics Charts (users/week, subscriptions by tier, deep unlocks, revenue)
- [x] Role-based access control (RBAC)

### Phase 6: Launch-Critical Enhancements (Completed - Feb 22, 2026)
- [x] Deep Exploration CTAs in MatchCard component
- [x] Deep Exploration feature section on Landing Page with "View Sample Report"
- [x] Demo Deep Compatibility Report page (/deep/demo-report)
- [x] Partner Notification System (in-app notifications)
  - Notification bell component in header
  - Notifications for: unlock invite, partner completed, report ready
  - Database storage with read status
- [x] Admin Credential Security
  - Environment variables for admin credentials
  - Password change requirement on first login
  - Secure password hashing

## Technical Architecture

### Backend (FastAPI)
```
/app/backend/
├── models/           # Pydantic models
│   ├── user.py, profile.py, photo.py
│   ├── psychometric.py, deep_exploration.py
│   └── admin.py
├── services/         # Business logic
│   ├── auth_service.py
│   ├── boost_service.py
│   ├── compatibility_engine.py
│   ├── deep_exploration_service.py
│   ├── admin_service.py
│   └── notification_service.py (NEW)
├── data/             # Static data
│   ├── psychometric_questions.py
│   └── deep_questions.py
└── server.py         # Main FastAPI app
```

### Frontend (React)
```
/app/frontend/src/
├── components/
│   ├── ui/           # Shadcn components
│   ├── DeepExplorationCTA.jsx
│   ├── NotificationBell.jsx (NEW)
│   └── MatchCard.jsx (NEW)
├── pages/
│   ├── LandingPage.jsx (updated - Deep section)
│   ├── Dashboard.jsx (updated - NotificationBell)
│   ├── ProfileOnboarding.jsx
│   ├── PsychometricOnboarding.jsx
│   ├── DeepQuestionnaireFlow.jsx
│   ├── DeepReportView.jsx
│   ├── DemoDeepReport.jsx (NEW)
│   ├── BoostPage.jsx
│   └── admin/        # Admin panel pages
└── App.js
```

## API Endpoints

### User APIs
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google-session` - Google OAuth
- `GET /api/auth/me` - Current user info
- `POST /api/auth/logout` - Logout

### Profile APIs
- `POST /api/profile` - Create profile
- `GET /api/profile/{user_id}` - Get profile
- `PUT /api/profile` - Update profile

### Psychometric APIs
- `GET /api/psychometric/questions` - Get 36 questions
- `POST /api/psychometric/submit` - Submit assessment
- `GET /api/psychometric/status` - Assessment status
- `GET /api/compatibility/{user_id}` - Get compatibility score

### Deep Exploration APIs
- `GET /api/deep/status/{partner_id}` - Pair status
- `POST /api/deep/unlock/{partner_id}` - Unlock (Elite)
- `POST /api/deep/unlock-paid/{partner_id}` - Unlock with payment (Premium)
- `GET /api/deep/questions` - Get 108 questions
- `POST /api/deep/submit` - Submit deep assessment
- `GET /api/deep/report/{pair_id}` - Get couple report
- `GET /api/deep/demo-report` - Get demo report (no auth)

### Notification APIs (NEW)
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/count` - Get unread count
- `POST /api/notifications/{id}/read` - Mark as read
- `POST /api/notifications/read-all` - Mark all as read

### Admin APIs
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/me` - Admin info
- `POST /api/admin/setup` - First admin setup
- `POST /api/admin/change-password` - Change password (NEW)
- `GET /api/admin/dashboard/metrics` - Dashboard metrics
- `GET /api/admin/users` - List users
- ... (full CRUD for users, profiles, subscriptions, deep, reports)

## Database Collections
- `users` - User accounts
- `profiles` - User profiles
- `photos` - User photos
- `psychometric_profiles` - Assessment results
- `deep_exploration_pairs` - Couple pairs
- `deep_psychometric_profiles` - Deep assessment results
- `deep_compatibility_reports` - Couple reports
- `user_sessions` - User sessions
- `admin_users` - Admin accounts
- `admin_sessions` - Admin sessions
- `user_reports` - User reports/complaints
- `boosts` - Profile boosts
- `matches` - Match data
- `notifications` - In-app notifications (NEW)

## Test Credentials
- **Admin**: admin@soulsathiya.com / admin123 (super_admin)
  - Note: New admins require password change on first login

## Environment Variables (Backend)
```
MONGO_URL - MongoDB connection string
DB_NAME - Database name
ADMIN_EMAIL - Default admin email
ADMIN_PASSWORD - Default admin password (temporary)
ADMIN_REQUIRE_PASSWORD_CHANGE - Force password change (true)
```

## Upcoming Tasks (P2-P3)
1. Integrate DeepExplorationCTA into ChatHeader page
2. Analytics event tracking
3. Refactor server.py using APIRouter
4. KYC integration (HyperVerge/IDfy)
5. AWS S3 photo storage integration

## Integrations
- Google Social Login (Emergent Auth)
- Razorpay Payments
- MongoDB Database
