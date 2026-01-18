# src/controllers/misc Directory - Claude Instructions

## Overview
This directory contains miscellaneous route handlers for general functionality that doesn't fit into other domains. Typically includes email subscriptions and general utilities.

## Key Files

### subscribe-for-email-updates.ts
**Purpose:** Allow users to subscribe to email notifications

**Function:**
```typescript
async function subscribeForEmailUpdates(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract email from request body
2. Validate email format
3. Check not already subscribed
4. Create subscription record
5. Send confirmation email
6. Return success

**Request:**
```typescript
{
  email: string,
  category?: "announcements" | "updates" | "all"
}
```

**Response:**
```typescript
{
  success: "",
  message: "Check your email for confirmation"
}
```

**Error Cases:**
```typescript
400: { error: "Invalid email format" }
400: { error: "Already subscribed" }
500: { error: "Failed to send confirmation email" }
```

### unsubscribe-from-emails.ts
**Purpose:** Remove email from subscription list

**Function:**
```typescript
async function unsubscribeFromEmails(req: Request, res: Response): Promise<void>
```

**Workflow:**
1. Extract email and token from request
2. Verify token (from email link)
3. Mark subscription as inactive
4. Return success

**Request:**
```typescript
// GET /api/misc/unsubscribe?email=...&token=...
```

**Response:**
```typescript
{
  success: "",
  message: "Successfully unsubscribed"
}
```

## Database Operations

### Read
- `getSubscription(email)` - Check subscription status
- `getSubscriptionPreferences(email)` - Category preferences

### Write
- `createSubscription(email, category)` - Add subscriber
- `updateSubscription(email, category)` - Change category
- `deactivateSubscription(email)` - Unsubscribe
- `logEmailEvent(email, type)` - Track interactions

## Email Management

### Subscription Categories
- `announcements` - Product news
- `updates` - Feature updates
- `educational` - Learning content
- `all` - All categories

### Confirmation Flow
```typescript
1. User subscribes via form
2. Server creates subscription (inactive)
3. Confirmation email sent
4. User clicks link in email
5. Subscription activated
```

### Unsubscribe Link
- Unique token per subscriber
- One-click unsubscribe from email
- Prevents accidental unsubscribe
- Can't unsubscribe others

## Error Handling

```typescript
// Invalid email
400: { error: "Invalid email format" }

// Already subscribed
400: { error: "Email already subscribed" }

// Invalid token
400: { error: "Invalid or expired unsubscribe token" }

// Email service failed
500: { error: "Failed to send email" }

// Server error
500: { error: "Internal Server Error: ..." }
```

## Validation

### Email Validation
- Must be valid email format
- Lowercase normalization
- Duplicate checking
- Unsubscribed list checking

### Token Validation
- Generated at subscription
- Time-based expiration (30 days)
- Used for unsubscribe links
- Cannot be reused

## Best Practices

- **Confirm subscriptions** - Prevent spam signups
- **Easy unsubscribe** - Legal requirement (CAN-SPAM)
- **Track preferences** - Respect category choices
- **Audit trail** - Log all subscription events
- **Rate limiting** - Prevent subscription spam
- **Email validation** - Prevent invalid addresses

## Common Workflows

### Subscribe to Newsletter
```typescript
1. User sees email signup form
2. Enters email address
3. Clicks "Subscribe"
4. POST /api/misc/subscribe with email
5. Confirmation email sent
6. User clicks confirmation link
7. Subscription activated
```

### Unsubscribe
```typescript
1. User receives email
2. Clicks "Unsubscribe" at bottom
3. Browser navigates to unsubscribe page
4. GET /api/misc/unsubscribe?token=...
5. Subscription deactivated
6. Confirmation page shown
```

### Manage Preferences
```typescript
1. User opens email preferences
2. Selects categories of interest
3. Clicks "Save"
4. PUT /api/misc/email-preferences
5. Server updates categories
6. Confirmation sent
```

## Email Service Integration

### Provider (Likely SendGrid/Mailgun)
- Sends confirmation emails
- Sends unsubscribe emails
- Tracks open/click rates
- Manages bounce handling

### Bounce Handling
- Track hard bounces
- Automatically unsubscribe
- Prevent blacklist issues
- Report to operations

## Performance Considerations

- **Async email sending** - Don't block response
- **Batch emails** - Send in bulk where possible
- **Rate limiting** - Prevent abuse
- **Queue management** - Handle email spikes

## Important Notes

- **CAN-SPAM compliance** - Required for USA
- **GDPR compliance** - Required for EU
- **One-click unsubscribe** - Legal requirement
- **Confirmation required** - Double opt-in preferred
- **Category preferences** - Respect user choices
- **Archive copy** - Keep for compliance

## Integration with Other Systems

### Email Provider
- SendGrid, Mailgun, or equivalent
- API integration for sending
- Webhook integration for events

### Database Layer
- Subscription storage
- Event logging
- Preference tracking

### Authentication Layer
- Email validation/confirmation
- Token generation and verification

### Type System
- Email format validation
- Category enumeration
- Subscription status typing

### Middleware Layer
- Email format validation
- Rate limiting
- Token verification
