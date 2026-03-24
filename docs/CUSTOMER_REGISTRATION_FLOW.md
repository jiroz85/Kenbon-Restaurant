# Customer Registration & Email Verification API Documentation

## Overview
Complete customer registration and email verification system for Kenbon Restaurant. Staff accounts are created by admin and don't require verification.

## API Endpoints

### 1. Customer Registration
```
POST /auth/register
Content-Type: application/json

{
  "email": "customer@example.com",
  "username": "customer123",
  "password": "password123"
}
```

**Response (Customer):**
```json
{
  "message": "Registration successful. Please check your email to verify your account.",
  "user": {
    "id": "uuid",
    "email": "customer@example.com",
    "username": "customer123",
    "roles": ["CUSTOMER"],
    "isEmailVerified": false
  }
}
```

**Response (Staff):**
```json
{
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "user": {
    "id": "uuid",
    "email": "staff@example.com",
    "username": "staff123",
    "roles": ["STAFF"],
    "isEmailVerified": true
  }
}
```

### 2. Email Verification
```
POST /auth/verify-email
Content-Type: application/json

{
  "token": "verification_token_from_email"
}
```

**Response:**
```json
{
  "message": "Email verified successfully. You can now log in."
}
```

### 3. Customer Login
```
POST /auth/login
Content-Type: application/json

{
  "usernameOrEmail": "customer@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "accessToken": "jwt_token",
  "refreshToken": "refresh_token",
  "user": {
    "id": "uuid",
    "email": "customer@example.com",
    "username": "customer123",
    "roles": ["CUSTOMER"],
    "isEmailVerified": true
  }
}
```

### 4. Resend Verification Email
```
POST /auth/resend-verification
Content-Type: application/json

{
  "email": "customer@example.com"
}
```

**Response:**
```json
{
  "message": "Verification email sent. Please check your inbox."
}
```

### 5. Token Refresh
```
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token"
}
```

## Security Features

### Role-Based Registration
- First user automatically gets ADMIN role
- Subsequent users get CUSTOMER role by default
- Staff accounts can be created with specific roles

### Email Verification
- Required only for CUSTOMER role
- Staff accounts bypass email verification
- Tokens expire in 24 hours
- Rate limiting: 5 minutes between resend requests

### Token Security
- Access tokens: 15 minutes expiration
- Refresh tokens: 7 days expiration
- Separate secrets for access and refresh tokens

## Error Handling

### Registration Errors
- `409 Conflict`: User with given email or username already exists
- `400 Bad Request`: Invalid input data

### Login Errors
- `401 Unauthorized`: Invalid credentials
- `401 Unauthorized`: Please verify your email before logging in (customers only)

### Verification Errors
- `400 Bad Request`: Invalid verification token
- `400 Bad Request`: Verification token has expired
- `400 Bad Request`: Email is already verified
- `400 Bad Request`: User with this email does not exist
- `400 Bad Request`: Only customer accounts require email verification
- `400 Bad Request`: Please wait before requesting another verification email

## Email Configuration

### Development (Gmail)
```env
GMAIL_USER=your-gmail@gmail.com
GMAIL_APP_PASSWORD=your-app-password
```

### Production (SMTP)
```env
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

### Frontend URL
```env
FRONTEND_URL=http://localhost:5173
```

## Database Schema

### Users Table
- `id`: UUID primary key
- `email`: Unique email address
- `username`: Unique username
- `passwordHash`: Bcrypt hashed password
- `isEmailVerified`: Boolean flag
- `emailVerificationToken`: Nullable string
- `emailVerificationExpires`: Nullable timestamp
- `createdAt`, `updatedAt`: Timestamps

### User Roles Relationship
- Many-to-many relationship between users and roles
- Junction table: `user_roles`

## Flow Summary

1. **Customer Registration** → Creates unverified account → Sends verification email
2. **Email Verification** → Validates token → Marks account as verified
3. **Customer Login** → Validates credentials AND verification → Issues tokens
4. **Token Refresh** → Validates refresh token → Issues new access token
5. **Resend Verification** → Rate limiting check → Generates new token → Sends email

The system ensures only verified customers can access the application while maintaining security and good user experience.
