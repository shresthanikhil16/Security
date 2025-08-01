# Rent Amount Undefined Issue - Troubleshooting Guide

## Problem
The esewa controller is receiving `undefined` for the `amount` parameter when creating payment orders.

## Debugging Steps Added

### 1. Enhanced Logging in Esewa Controller
- Added comprehensive logging to see what's being received
- Added validation for amount parameter
- Added input sanitization while preserving numeric fields

### 2. Enhanced Logging in Room Controller
- Added debugging for room creation and updates
- Tracking rentPrice through sanitization process

## Potential Causes & Solutions

### 1. Frontend-Backend Field Name Mismatch
**Problem**: Frontend might be sending different field names
**Check**: Frontend should send `amount` in request body
**Example**: 
```javascript
// Frontend should send:
{
  "amount": 5000,  // NOT "rentPrice" or "price"
  // other fields...
}
```

### 2. Content-Type Issues
**Problem**: Request might not have correct Content-Type header
**Solution**: Ensure frontend sends `Content-Type: application/json`

### 3. Request Body Structure
**Problem**: Amount might be nested in an object
**Check**: Make sure the request body structure matches:
```javascript
POST /api/esewa/create/:roomId
{
  "amount": 5000
}
```

### 4. XSS Protection Interference
**Solution**: Our sanitization now preserves numeric fields properly
**Added**: `sanitizePaymentInput()` function that only sanitizes string fields

## Testing the Fix

### Test the Esewa Endpoint Directly
Use a tool like Postman or curl:

```bash
curl -X POST https://localhost:3000/api/esewa/create/6888a3545898cae2434826a7 \
  -H "Content-Type: application/json" \
  -d '{"amount": 5000}' \
  -k
```

### Check Server Logs
With the enhanced debugging, you should now see:
- "Request body received: {...}"
- "Sanitized body: {...}"
- "The room id and rent amount is [roomId] [amount]"

If amount is still undefined, the issue is in the frontend request.

## Frontend Checklist

1. **Verify Field Name**: Make sure frontend sends `amount`, not `rentPrice`
2. **Check Request Headers**: Ensure `Content-Type: application/json`
3. **Verify Request Body**: Log the request body before sending
4. **Check Network Tab**: Inspect the actual HTTP request in browser dev tools

## Room Data Flow

1. **Room Creation/Update**: Uses `rentPrice` field
2. **Payment Processing**: Uses `amount` field
3. **Frontend Responsibility**: Convert `rentPrice` to `amount` when creating payment

## Expected Behavior After Fix

1. Room operations should preserve `rentPrice` correctly
2. Payment operations should receive `amount` correctly
3. All string fields are sanitized for XSS protection
4. Numeric fields are preserved without modification

## Next Steps

1. Test the payment endpoint with the debugging output
2. Check frontend code to ensure correct field names
3. Verify the data flow from room selection to payment creation
4. Update frontend if field name mismatch is found
