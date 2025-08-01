# CSRF Protection Implementation

## Overview
CSRF (Cross-Site Request Forgery) protection has been implemented using the `csrf` package to prevent malicious requests from unauthorized sources.

## How it works
1. **Token Generation**: Server generates a secret and token pair
2. **Secret Storage**: Secret is stored in httpOnly cookie
3. **Token Distribution**: Token is sent to client
4. **Validation**: Server validates token against secret for each non-GET request

## API Endpoints

### Get CSRF Token
```http
GET /api/auth/csrf-token
```

**Response:**
```json
{
  "success": true,
  "csrfToken": "your-csrf-token-here"
}
```

## Frontend Integration

### 1. Get CSRF Token
```javascript
const getCsrfToken = async () => {
  try {
    const response = await fetch('/api/auth/csrf-token', {
      method: 'GET',
      credentials: 'include' // Important for cookies
    });
    const data = await response.json();
    return data.csrfToken;
  } catch (error) {
    console.error('Error getting CSRF token:', error);
  }
};
```

### 2. Include Token in Requests
You can include the CSRF token in any of these ways:

#### Option 1: Request Header (Recommended)
```javascript
const makeProtectedRequest = async (url, data) => {
  const csrfToken = await getCsrfToken();
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken, // Include token in header
    },
    credentials: 'include', // Important for cookies
    body: JSON.stringify(data)
  });
  
  return response.json();
};
```

#### Option 2: Request Body
```javascript
const makeProtectedRequest = async (url, data) => {
  const csrfToken = await getCsrfToken();
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({
      ...data,
      _csrf: csrfToken // Include token in body
    })
  });
  
  return response.json();
};
```

#### Option 3: Query Parameter
```javascript
const makeProtectedRequest = async (url, data) => {
  const csrfToken = await getCsrfToken();
  
  const response = await fetch(`${url}?_csrf=${csrfToken}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  
  return response.json();
};
```

## React Hook Example
```javascript
import { useState, useEffect } from 'react';

export const useCsrfToken = () => {
  const [csrfToken, setCsrfToken] = useState(null);

  const fetchCsrfToken = async () => {
    try {
      const response = await fetch('/api/auth/csrf-token', {
        credentials: 'include'
      });
      const data = await response.json();
      setCsrfToken(data.csrfToken);
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
    }
  };

  useEffect(() => {
    fetchCsrfToken();
  }, []);

  return { csrfToken, refreshToken: fetchCsrfToken };
};
```

## Configuration

### Middleware Settings
- **Skip Routes**: GET requests and `/api/auth/csrf-token` are excluded from CSRF validation
- **Token Sources**: Accepts tokens from:
  - `X-CSRF-Token` header
  - `CSRF-Token` header  
  - `_csrf` body field
  - `_csrf` query parameter

### Cookie Settings
- **httpOnly**: `true` (prevents XSS access)
- **secure**: `true` in production (HTTPS only)
- **sameSite**: `'strict'` (prevents CSRF)
- **maxAge**: 24 hours

## Error Responses

### Missing Secret
```json
{
  "success": false,
  "message": "CSRF secret not found. Please get a new CSRF token."
}
```

### Missing Token
```json
{
  "success": false,
  "message": "CSRF token missing. Please include CSRF token in request."
}
```

### Invalid Token
```json
{
  "success": false,
  "message": "Invalid CSRF token."
}
```

## Security Notes
1. Always use `credentials: 'include'` in fetch requests to include cookies
2. CSRF tokens should be refreshed periodically
3. The secret cookie is httpOnly and cannot be accessed via JavaScript
4. In production, ensure HTTPS is used for secure cookie transmission
