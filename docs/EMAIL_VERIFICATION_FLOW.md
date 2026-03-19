# Email Verification Flow Documentation

## Overview

This document explains the complete customer registration and email verification flow for the Kenbon Restaurant web application.

## Flow Summary

1. **Customer Registration** → Backend creates account → Sends verification email
2. **Email Verification** → Customer clicks link → Backend verifies token → Account activated
3. **Login** → Customer can now log in with verified email

## Step-by-Step Process

### 1. Customer Registration

**Frontend (`/register`)**
- Customer fills registration form (email, username, password)
- Form validation ensures password minimum 6 characters
- Submit sends POST request to `/auth/register`

**Backend (`POST /auth/register`)**
- Validates email/username uniqueness
- Hashes password with bcrypt
- Assigns CUSTOMER role (first user gets ADMIN role)
- Sets `isEmailVerified: false`
- Creates verification token (24-hour expiry)
- Sends verification email
- Returns success message for customers, tokens for staff

### 2. Email Sending

**Email Service Features**
- Uses nodemailer with SMTP configuration
- Development: Gmail with app password
- Production: Custom SMTP (SendGrid, AWS SES, etc.)
- Fallback to console log if not configured
- Professional HTML email templates

**Email Content**
- Kenbon Restaurant branding
- Clear verification instructions
- Clickable verification button
- Fallback URL for manual copy-paste
- 24-hour expiration notice

### 3. Email Verification

**Frontend (`/verify-email?token=xxx`)**
- Automatically processes token from URL
- Shows loading, success, error, or expired states
- Provides resend option for failed/expired tokens

**Backend (`GET /auth/verify-email?token=xxx`)**
- Validates token exists and hasn't expired
- Sets `isEmailVerified: true`
- Clears verification token fields
- Returns success message

### 4. Customer Login

**Frontend (`/login`)**
- Customer enters credentials
- Shows verification reminder if login fails due to unverified email
- Provides link to resend verification email

**Backend (`POST /auth/login`)**
- Validates credentials
- Checks email verification for customers only
- Staff accounts bypass verification requirement
- Returns JWT tokens on success

### 5. Resend Verification

**Frontend (`/verify-email-required`)**
- Displays after registration for customer accounts
- Allows email input for resend requests
- Shows success/error feedback

**Backend (`POST /auth/resend-verification`)**
- Validates email exists and belongs to customer
- Checks email isn't already verified
- Generates new token and sends email
- Rate limiting recommended (not implemented)

## Configuration

### Environment Variables

```bash
# Email Configuration
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Development (Gmail)
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-app-password

# Production SMTP
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

### Gmail Setup (Development)

1. Enable 2-factor authentication
2. Generate App Password:
   - Google Account → Security → App Passwords
   - Select "Mail" and device name
   - Use generated password in `GMAIL_APP_PASSWORD`

## Database Schema

**User Entity Updates**
```typescript
@Column({ default: false })
isEmailVerified: boolean;

@Column({ nullable: true })
emailVerificationToken: string;

@Column({ nullable: true })
emailVerificationExpires: Date;
```

## Security Features

### Token Security
- 32-byte cryptographically secure random tokens
- 24-hour expiration prevents abuse
- Tokens cleared after successful verification

### Role-Based Verification
- **Customers**: Must verify email before login
- **Staff**: Created by admin, no verification required
- **Admin**: First user, no verification required

### Error Handling
- Invalid token messages don't reveal user existence
- Rate limiting recommended for resend endpoint
- Development fallback prevents blocking during testing

## API Endpoints

### Public Endpoints
```
POST /auth/register
POST /auth/login
GET  /auth/verify-email?token=xxx
POST /auth/resend-verification
```

### Response Formats

**Registration Success (Customer)**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "username",
    "roles": ["CUSTOMER"],
    "isEmailVerified": false
  }
}
```

**Registration Success (Staff)**
```json
{
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "user": {
    "id": "uuid",
    "email": "staff@example.com",
    "username": "username",
    "roles": ["STAFF"],
    "isEmailVerified": true
  }
}
```

**Email Verification**
```json
{
  "message": "Email verified successfully. You can now log in."
}
```

## Frontend Routes

```
/register              - Registration form
/verify-email           - Email verification handler
/verify-email-required  - Post-registration instructions
/login                  - Login form with verification hints
```

## Testing

### Development Testing
1. Configure Gmail credentials or use console fallback
2. Register new customer account
3. Check console for verification URL if email not configured
4. Test verification link functionality
5. Verify login works after verification

### Production Testing
1. Configure production SMTP settings
2. Test email delivery to various providers
3. Verify email rendering on mobile devices
4. Test expired token scenarios
5. Verify rate limiting on resend endpoint

## Troubleshooting

### Common Issues

**Email not sending**
- Check SMTP credentials in environment variables
- Verify Gmail app password is correctly generated
- Check firewall/blocking issues

**Token not working**
- Verify token hasn't expired (24-hour limit)
- Check token URL encoding in email
- Ensure database token field is properly saved

**Login still failing after verification**
- Verify `isEmailVerified` field is set to `true`
- Check customer role assignment
- Verify JWT token generation

### Debug Mode
Set `NODE_ENV=development` to enable:
- Console fallback for email sending
- Detailed error logging
- Non-blocking email errors

## Future Enhancements

### Recommended Improvements
1. **Rate Limiting**: Prevent abuse of resend endpoint
2. **Email Templates**: Separate template system for easier customization
3. **Verification Stats**: Track email delivery rates
4. **Multiple Providers**: Support for SendGrid, Mailgun, etc.
5. **Email Queue**: Background job processing for reliability
6. **A/B Testing**: Test different email templates
7. **Analytics**: Track verification conversion rates

### Security Enhancements
1. **CSRF Protection**: Add CSRF tokens to forms
2. **IP Tracking**: Log verification attempts by IP
3. **Suspicious Activity**: Flag unusual verification patterns
4. **Email Blacklist**: Prevent disposable email usage

## Support

For issues with the email verification flow:
1. Check environment configuration
2. Review backend logs for error details
3. Verify database user records
4. Test with different email providers
5. Check spam/junk folders
