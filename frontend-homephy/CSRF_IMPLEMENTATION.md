# CSRF Protection Implementation

This implementation provides Cross-Site Request Forgery (CSRF) protection for the Homefy frontend application.

## Files Added/Modified:

### New Files:
1. **`src/services/csrfService.js`** - CSRF token management service
2. **`src/hooks/useCSRFProtection.js`** - React hook for CSRF protection

### Modified Files:
1. **`src/pages/account/forgetPassword.jsx`** - Added CSRF protection
2. **`src/pages/account/forgotPasswordOTP.jsx`** - Added CSRF protection  
3. **`src/pages/account/editProfile.jsx`** - Added CSRF protection

## How It Works:

### 1. CSRF Service (`csrfService.js`)
- Fetches CSRF token from `/api/csrf-token` endpoint
- Creates secure axios instances with CSRF token in headers
- Automatically refreshes tokens when they expire
- Handles CSRF token validation errors

### 2. React Hook (`useCSRFProtection.js`)
- Provides easy integration with React components
- Returns secure axios instance and loading states
- Handles token refresh functionality

### 3. Component Integration
- Components use `useCSRFProtection()` hook
- Replace regular axios calls with `secureAxios` instance
- Buttons are disabled during CSRF initialization
- Error handling for CSRF failures

## Backend Requirements:

Your backend needs these endpoints:

```javascript
// Get CSRF token
GET /api/csrf-token
Response: { csrfToken: "token-value" }

// Protected endpoints expect CSRF token in headers
Headers: {
  "X-CSRF-Token": "token-value",
  "Authorization": "Bearer jwt-token"
}
```

## Backend Setup (Express + csurf):

```javascript
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

app.use(cookieParser());
app.use(csrf({ 
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
}));

// CSRF token endpoint
app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

## Usage Example:

```jsx
import { useCSRFProtection } from '../hooks/useCSRFProtection';

const MyComponent = () => {
  const { secureAxios, isLoading } = useCSRFProtection();
  
  const handleSubmit = async () => {
    if (isLoading || !secureAxios) {
      toast.error("Security initialization in progress.");
      return;
    }
    
    try {
      const response = await secureAxios.post('/api/protected-endpoint', data);
      // Handle response
    } catch (error) {
      // Handle error
    }
  };
  
  return (
    <button 
      onClick={handleSubmit}
      disabled={isLoading || !secureAxios}
    >
      {isLoading ? 'Initializing Security...' : 'Submit'}
    </button>
  );
};
```

## Security Features:

- ✅ CSRF token validation on all state-changing requests
- ✅ Automatic token refresh on expiration
- ✅ Secure cookie-based token storage
- ✅ Request/response interceptors for token management
- ✅ User feedback during security initialization
- ✅ Graceful error handling for CSRF failures

## Next Steps:

1. **Install csurf on backend**: `npm install csurf cookie-parser`
2. **Configure CSRF middleware** in your Express app
3. **Test the implementation** with the updated frontend
4. **Add CSRF protection** to other forms and API calls as needed
