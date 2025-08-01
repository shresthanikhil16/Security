# 📧 Email Configuration for Password Reset

## 🔧 Required Environment Variables

Add these to your `.env` file:

```env
# Email Configuration
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-app-password

# Development Mode (optional)
NODE_ENV=development
```

## 📱 Gmail App Password Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and generate password
   - Use this 16-character password as `EMAIL_PASS`

## 🧪 Testing Password Reset

### Test the endpoint:
```bash
curl -X POST https://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"your-test-email@gmail.com"}'
```

### Expected Response:
```json
{
  "success": true,
  "message": "Password reset code sent to your email successfully."
}
```

## 🔧 Development Mode

If email is not configured, the system will:
- ✅ Generate OTP code
- 🖥️ Log OTP to server console
- 📱 Return OTP in response (development only)

## 🛠️ Troubleshooting

### Error: "An error occurred"
1. **Check email credentials** in `.env`
2. **Verify Gmail app password** is correct
3. **Check server console** for detailed error messages
4. **Ensure rate limiting** isn't blocking requests

### Development Testing:
```javascript
// Test without email setup
{
  "success": true,
  "message": "Email service unavailable. Check server console for development OTP.",
  "developmentOTP": "123456",
  "emailError": "Email service temporarily unavailable"
}
```

## 🔐 Security Features

- ✅ Rate limited (3 attempts per hour)
- ✅ OTP expires in 10 minutes
- ✅ Single-use tokens
- ✅ No email enumeration
- ✅ XSS protection on inputs
- ✅ Detailed security logging
