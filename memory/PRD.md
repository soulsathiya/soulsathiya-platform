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
│   └── admin_service.py
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
│   └── DeepExplorationCTA.jsx
├── pages/
│   ├── LandingPage.jsx
│   ├── Dashboard.jsx
│   ├── ProfileOnboarding.jsx
│   ├── PsychometricOnboarding.jsx
│   ├── DeepQuestionnaireFlow.jsx
│   ├── DeepReportView.jsx
│   ├── BoostPage.jsx
│   └── admin/        # Admin panel pages
│       ├── AdminLogin.jsx
│       ├── AdminLayout.jsx
│       ├── AdminDashboard.jsx
│       ├── AdminUsers.jsx
│       ├── AdminProfiles.jsx
│       ├── AdminSubscriptions.jsx
│       ├── AdminDeep.jsx
│       ├── AdminReports.jsx
│       └── AdminAnalytics.jsx
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

### Admin APIs (NEW)
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `GET /api/admin/me` - Admin info
- `POST /api/admin/setup` - First admin setup
- `GET /api/admin/dashboard/metrics` - Dashboard metrics
- `GET /api/admin/users` - List users
- `GET /api/admin/users/{user_id}` - User details
- `POST /api/admin/users/{user_id}/suspend` - Suspend user
- `POST /api/admin/users/{user_id}/activate` - Activate user
- `POST /api/admin/users/{user_id}/verify` - Verify user
- `DELETE /api/admin/users/{user_id}` - Delete user
- `GET /api/admin/profiles` - List profiles
- `POST /api/admin/profiles/{id}/flag` - Flag profile
- `POST /api/admin/profiles/{id}/approve` - Approve profile
- `DELETE /api/admin/photos/{id}` - Remove photo
- `GET /api/admin/subscriptions` - List subscriptions
- `PUT /api/admin/subscriptions/{user_id}/tier` - Change tier
- `POST /api/admin/subscriptions/{user_id}/extend` - Extend subscription
- `POST /api/admin/subscriptions/{user_id}/cancel` - Cancel subscription
- `GET /api/admin/deep` - List deep pairs
- `POST /api/admin/deep/{pair_id}/revoke` - Revoke access
- `GET /api/admin/reports` - List user reports
- `PUT /api/admin/reports/{id}` - Update report status
- `POST /api/admin/users/{user_id}/warn` - Warn user
- `POST /api/admin/users/{user_id}/ban` - Ban user
- `GET /api/admin/analytics` - Platform analytics

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

## Test Credentials
- **Admin**: admin@soulsathiya.com / admin123 (super_admin)

## Upcoming Tasks (P1)
1. Integrate DeepExplorationCTA into MatchCard, ChatHeader, MatchDetail
2. Partner notification system for deep exploration invites
3. Create demo deep report for marketing

## Future Tasks (P2-P3)
1. Analytics event tracking
2. Refactor server.py using APIRouter
3. KYC integration (HyperVerge/IDfy)
4. AWS S3 photo storage integration

## Integrations
- Google Social Login (Emergent Auth)
- Razorpay Payments
- MongoDB Database
