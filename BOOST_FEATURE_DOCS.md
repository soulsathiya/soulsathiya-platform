# Profile Boost Feature - Documentation

## Overview
The Profile Boost feature allows users to pay for premium visibility in match results. Boosted profiles appear at the top of match lists and get 3x more profile views, accelerating their journey to find a perfect match.

## Business Model
- **Additional Revenue Stream**: Beyond subscription tiers, boosts provide micro-transaction revenue
- **Pricing Strategy**: 
  - 24 hours: ₹299
  - 48 hours: ₹499 (17% savings vs 2x 24hr)
  - 1 week: ₹899 (35% savings vs daily boosts)

## Technical Implementation

### Backend Components

#### 1. Database Schema (`boosts` collection)
```javascript
{
  boost_id: "boost_abc123",
  user_id: "user_xyz789",
  duration: "24_hours" | "48_hours" | "1_week",
  price_paid: 299,
  status: "pending_payment" | "active" | "expired",
  razorpay_order_id: "order_xyz",
  razorpay_payment_id: "pay_xyz",
  started_at: ISODate("2026-01-20T10:00:00Z"),
  expires_at: ISODate("2026-01-21T10:00:00Z"),
  created_at: ISODate("2026-01-20T09:55:00Z"),
  updated_at: ISODate("2026-01-20T10:00:00Z")
}
```

#### 2. Boost Service (`/backend/services/boost_service.py`)
- `get_boost_plans()`: Returns available boost plans with pricing
- `create_boost_order()`: Creates Razorpay order and boost record
- `verify_payment_and_activate()`: Verifies payment signature and activates boost
- `get_active_boost()`: Checks if user has active boost
- `get_boost_stats()`: Returns boost usage statistics
- `expire_old_boosts()`: Background task to expire old boosts

#### 3. API Endpoints

**GET /api/boost/plans**
- Returns available boost plans with pricing and features
- Public endpoint (no auth required)

**POST /api/boost/purchase**
- Request body: `{ duration: "24_hours" | "48_hours" | "1_week" }`
- Creates Razorpay order
- Returns: order details for Razorpay checkout

**POST /api/boost/verify-payment**
- Verifies Razorpay payment signature
- Activates boost on successful verification
- Request body: `{ boost_id, razorpay_payment_id, razorpay_order_id, razorpay_signature }`

**GET /api/boost/status**
- Returns user's current boost status and stats
- Response: `{ total_boosts_used, active_boost, has_active_boost }`

**GET /api/boost/history**
- Returns user's boost purchase history

#### 4. Match Algorithm Update
The `/api/matches` endpoint now:
1. Fetches all active boosts
2. Marks matched users who have active boosts
3. Sorts results: boosted profiles first, then by compatibility score

```python
# Sort: boosted profiles first, then by compatibility score
match_results.sort(key=lambda x: (not x["is_boosted"], -x["compatibility_score"]))
```

### Frontend Components

#### 1. Boost Page (`/frontend/src/pages/BoostPage.jsx`)
Features:
- Display boost plans with pricing
- Show active boost status
- Razorpay payment integration
- Benefits showcase
- "How It Works" section

#### 2. Dashboard Integration
- Boost CTA banner on dashboard
- Shows for all users with complete profiles
- Highlights ₹299 starting price
- Direct link to boost page

#### 3. Match Display
- Boosted profiles show "Boosted" badge
- Appear at top of match results
- Visual distinction from regular profiles

## Razorpay Integration

### Setup
1. Get Razorpay credentials from https://dashboard.razorpay.com
2. Add to `/app/backend/.env`:
```
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

### Payment Flow
1. User selects boost duration
2. Backend creates Razorpay order
3. Frontend opens Razorpay checkout modal
4. User completes payment
5. Razorpay calls handler with payment details
6. Frontend verifies payment with backend
7. Backend verifies signature and activates boost

### Mock Mode
For development/testing without actual Razorpay credentials:
- Service uses placeholder credentials
- Accepts all payments in mock mode
- Useful for testing UI flow

## User Experience

### Purchase Flow
1. User navigates to Boost page from dashboard CTA
2. Views boost plans and benefits
3. Selects duration
4. Completes payment via Razorpay
5. Sees instant confirmation
6. Profile immediately appears at top of matches

### Active Boost Indicators
- Dashboard shows "Boost Active" banner
- Boost page shows active boost status
- Cannot purchase new boost while one is active
- Other users see "Boosted" badge on profile

### Expiration Handling
- Background task automatically expires old boosts
- Status changes from "active" to "expired"
- User can purchase new boost after expiration

## Revenue Optimization

### Conversion Strategies
1. **Dashboard Placement**: Prominent CTA on dashboard for all users
2. **Urgency**: Show time-limited offers
3. **Social Proof**: Show "X users boosted today"
4. **Value Proposition**: "3x more views" messaging
5. **Pricing Psychology**: 48hr plan marked as "Most Popular"

### Future Enhancements
1. **Auto-Renew**: Option to auto-purchase boost when expired
2. **Combo Offers**: Boost + Premium subscription bundles
3. **Dynamic Pricing**: Weekend surge pricing
4. **Loyalty Rewards**: Discount for repeat boost purchases
5. **Analytics Dashboard**: Show boost ROI (views, interests received)

## Analytics & Metrics

### Track These KPIs
- Boost purchase conversion rate
- Average boost duration selected
- Revenue per boosted user
- Boost repeat purchase rate
- Time to first boost purchase
- Boost impact on user engagement

### Database Queries for Analytics
```javascript
// Total boost revenue
db.boosts.aggregate([
  { $match: { status: { $in: ["active", "expired"] } } },
  { $group: { _id: null, total: { $sum: "$price_paid" } } }
])

// Most popular duration
db.boosts.aggregate([
  { $group: { _id: "$duration", count: { $sum: 1 } } },
  { $sort: { count: -1 } }
])
```

## Security Considerations

1. **Payment Verification**: Always verify Razorpay signature server-side
2. **One Active Boost**: Prevent multiple active boosts per user
3. **Price Validation**: Verify amount on server, don't trust client
4. **Expiration Check**: Background task to prevent stale active boosts
5. **Rate Limiting**: Prevent boost purchase spam

## Testing Checklist

- [ ] Purchase boost with test Razorpay credentials
- [ ] Verify payment signature validation
- [ ] Check boost activation
- [ ] Confirm profile appears at top of matches
- [ ] Test boost expiration
- [ ] Verify cannot purchase while active boost exists
- [ ] Check boost history display
- [ ] Test all three duration options
- [ ] Verify pricing display
- [ ] Test Razorpay payment failure handling

## Production Deployment

### Before Launch
1. Update Razorpay credentials to live mode
2. Set up webhook for payment notifications
3. Configure boost expiration cron job
4. Set up monitoring for boost purchases
5. Create admin dashboard for boost management
6. Set up analytics tracking
7. Test end-to-end with real payment

### Monitoring
- Track boost purchase success rate
- Monitor Razorpay webhook failures
- Alert on boost expiration job failures
- Track revenue metrics daily

## Support & FAQs

### Common User Questions
**Q: How long does it take for boost to activate?**
A: Instantly after payment confirmation.

**Q: Can I boost while already boosted?**
A: No, wait for current boost to expire.

**Q: Do I get refund if I cancel boost?**
A: No refunds, boost is consumed once activated.

**Q: What if payment fails?**
A: Try again or contact support. No charges for failed payments.

**Q: How much visibility increase?**
A: You appear at the top of all match results and get approximately 3x more profile views.

## Future Features Roadmap

1. **Scheduled Boosts**: Purchase boost to activate at specific time
2. **Boost Analytics**: Personal dashboard showing boost ROI
3. **Geo-Targeted Boost**: Boost only in specific cities
4. **Community Boost**: Extra visibility in selected communities
5. **Smart Boost**: AI recommends best time to boost
6. **Boost Credits**: Buy in bulk, use anytime
7. **Gift Boost**: Send boost as gift to other users
