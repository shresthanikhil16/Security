# 🔧 CORS & Authentication Issues - Complete Fix

## Problems Resolved

### 1. **CORS Policy Error**
**Error**: `Request header field x-request-time is not allowed by Access-Control-Allow-Headers`
**Root Cause**: Missing custom headers in CORS allowedHeaders configuration

### 2. **Authentication Error**
**Error**: `403 (Forbidden)` on DELETE requests
**Root Cause**: Missing JWT token or invalid authentication

## ✅ CORS Configuration Fix

### Enhanced CORS Headers
Updated `index.js` with comprehensive header support:

```javascript
allowedHeaders: [
  "Content-Type", 
  "Authorization", 
  "X-CSRF-Token", 
  "CSRF-Token", 
  "Cache-Control",
  "x-request-time",        // ✅ Added - Custom timing header
  "X-Request-Time",        // ✅ Added - Alternate case
  "Accept",               // ✅ Added - Standard header
  "Origin",               // ✅ Added - CORS origin
  "User-Agent",           // ✅ Added - Browser info
  "DNT",                  // ✅ Added - Do Not Track
  "Keep-Alive",           // ✅ Added - Connection management
  "X-Requested-With",     // ✅ Added - AJAX indicator
  "If-Modified-Since",    // ✅ Added - Caching
  "Range"                 // ✅ Added - Partial content
],
methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"], // ✅ Added PATCH
exposedHeaders: ["Content-Type", "Content-Length", "X-CSRF-Token", "Cache-Control"]
```

### Supported Origins
- ✅ `https://localhost:5173` (Production Vite)
- ✅ `http://localhost:5173` (Development Vite)
- ✅ `https://localhost:5174` (Alternative port)
- ✅ `http://localhost:5174` (Alternative port)

## 🔐 Authentication Guidelines

### Frontend Requirements for Delete Operations

#### 1. **JWT Token Storage**
```javascript
// Store token after login
localStorage.setItem('token', response.data.token);
// OR
sessionStorage.setItem('token', response.data.token);
```

#### 2. **Proper Headers for Delete Requests**
```javascript
const deleteUser = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`https://localhost:3000/api/user/delete/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken, // If using CSRF protection
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Delete failed:', errorData.message);
      return;
    }
    
    const data = await response.json();
    console.log('Success:', data.message);
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

#### 3. **Axios Configuration**
```javascript
// Configure axios with default headers
const api = axios.create({
  baseURL: 'https://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Use for delete
api.delete(`/user/delete/${userId}`);
```

## 🛡️ Server Security Features

### Authorization Rules
1. **Self-Deletion**: Users can delete their own accounts
2. **Admin Deletion**: Admins can delete any user (except other admins)
3. **Access Control**: Regular users cannot delete other users

### Security Logging
```javascript
console.log("🗑️ Delete user request:");
console.log("  - Target User ID:", userId);
console.log("  - Requesting User ID:", req.user?._id);
console.log("  - Requesting User Role:", req.user?.role);
console.log("  - Authorization:", authorizationResult);
```

## 📋 Troubleshooting Guide

### Common Errors & Solutions

#### **Error**: CORS blocked request
**Solution**: ✅ Fixed - Enhanced allowedHeaders configuration

#### **Error**: 401 Unauthorized
**Cause**: Missing or invalid JWT token
**Solution**: Ensure Bearer token is included in Authorization header

#### **Error**: 403 Forbidden
**Cause**: Valid token but insufficient permissions
**Solutions**:
- User trying to delete another user (not allowed)
- Admin trying to delete another admin (not allowed)
- Check user roles and permissions

#### **Error**: 404 Not Found
**Cause**: Invalid user ID
**Solution**: Verify the user ID exists in database

### Testing Authentication

#### Test Valid Self-Deletion
```bash
curl -X DELETE https://localhost:3000/api/user/delete/USER_ID \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json"
```

#### Expected Response (Success)
```json
{
  "success": true,
  "message": "User account deleted successfully"
}
```

#### Expected Response (Forbidden)
```json
{
  "success": false,
  "message": "Access forbidden. You can only delete your own account or must be an administrator."
}
```

## 🚀 Frontend Implementation Example

### React Component with Proper Error Handling
```javascript
const handleDeleteUser = async (userId) => {
  try {
    setLoading(true);
    const token = localStorage.getItem('token');
    
    if (!token) {
      setError('Please log in to perform this action');
      return;
    }
    
    const response = await fetch(`https://localhost:3000/api/user/delete/${userId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      setSuccess('User deleted successfully');
      // Refresh user list or redirect
      fetchUsers();
    } else {
      setError(data.message || 'Failed to delete user');
    }
  } catch (error) {
    setError('Network error: ' + error.message);
  } finally {
    setLoading(false);
  }
};
```

## ✅ Status Check

### Server Configuration
- ✅ **CORS Headers**: Comprehensive header support added
- ✅ **Authentication**: JWT-based protection enabled
- ✅ **Authorization**: Role-based access control implemented
- ✅ **Security Logging**: Detailed audit trail active
- ✅ **Input Sanitization**: XSS and NoSQL injection protection

### Frontend Requirements
- ✅ **JWT Token**: Must be included in Authorization header
- ✅ **Headers**: All custom headers now supported by CORS
- ✅ **Error Handling**: Clear error messages for troubleshooting

Your CORS and authentication issues should now be resolved!
