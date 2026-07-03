# Phase 2 Implementation - Changes Summary

## Files Modified

### 1. `src/middleware/auth.js` - MODIFIED

**Changes:**
- Added `authorizeRoles` alias for the `authorize` middleware function for clarity
- Updated exports to include `authorizeRoles`

**Why:**
- Implements role-based authorization middleware as required
- `authorize(...allowedRoles)` restricts routes to specific roles
- Returns 403 Forbidden if user role is not in allowedRoles list

**Code Added:**
```javascript
const authorizeRoles = authorize;

module.exports = {
  authenticate,
  authorize,
  authorizeRoles,  // NEW
  errorHandler,
};
```

---

### 2. `src/controllers/authController.js` - MODIFIED

**Changes:**
- Added `getProfile()` function
- Added `updateProfile()` function
- Updated module exports

**Why:**
- Implements GET /api/auth/profile endpoint (requires authentication)
- Implements PUT /api/auth/profile endpoint (requires authentication)
- Profile routes use JWT authentication to get userId from token

**New Functions:**

#### `getProfile(req, res, next)`
- Retrieves authenticated user's profile
- Uses userId from JWT token (req.userId set by authenticate middleware)
- Returns user data without password
- Status: 200 on success, 404 if user not found

#### `updateProfile(req, res, next)`
- Updates name and/or email
- Validates input (at least one field required)
- Checks email uniqueness (excluding current user)
- Uses new: true to return updated document
- Returns updated user data without password
- Statuses: 200 success, 400 bad request, 404 not found, 409 conflict

---

### 3. `src/routes/authRoutes.js` - MODIFIED

**Changes:**
- Added imports for `getProfile` and `updateProfile` controllers
- Added `authenticate` middleware import
- Added GET /api/auth/profile route (protected)
- Added PUT /api/auth/profile route (protected)

**Why:**
- Protects profile endpoints with authenticate middleware
- All profile routes require valid JWT token
- JWT token provides userId and role in request object

**New Routes:**
```javascript
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
```

---

## No New Files Created

All functionality was added to existing files.

---

## Complete Updated Endpoints

### Authentication (Existing)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login user, get JWT token |

### Profile (New - Phase 2)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/auth/profile` | Yes | Get user profile |
| PUT | `/api/auth/profile` | Yes | Update user profile |

---

## Authorization Middleware Example Usage

For future phases, the `authorizeRoles` middleware can be used like:

```javascript
// Only students can access
router.get('/apply', authenticate, authorizeRoles('student'), applyToJob);

// Only hiring managers can access
router.post('/jobs', authenticate, authorizeRoles('hiring_manager'), createJob);

// Both roles can access
router.get('/jobs', authenticate, getJobs);
```

---

## How It Works

1. **Registration & Login (Phase 1)**
   - User registers with role (student or hiring_manager)
   - Receives JWT token with `{ userId, role }` payload
   - Token stored on client (frontend)

2. **Profile Access (Phase 2 - NEW)**
   - Client sends JWT in Authorization header: `Bearer <token>`
   - `authenticate` middleware validates token and extracts userId and role
   - Profile endpoints use userId to fetch/update user data
   - `authorizeRoles` middleware (if used) checks if user role is permitted

3. **Future Phases (Phase 3+)**
   - `authorizeRoles('hiring_manager')` protects job creation/deletion
   - `authorizeRoles('student')` protects job applications
   - `authorizeRoles('hiring_manager')` protects applicant viewing

---

## Testing Phase 2 Endpoints

### Get Profile (Requires JWT Token)

```bash
# After login, copy the token from response
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <your_token_here>"
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student",
    "createdAt": "2024-01-15T10:30:45.123Z",
    "updatedAt": "2024-01-15T10:30:45.123Z"
  }
}
```

---

### Update Profile (Requires JWT Token)

```bash
curl -X PUT http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <your_token_here>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Updated",
    "email": "newemail@example.com"
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "John Updated",
    "email": "newemail@example.com",
    "role": "student",
    "createdAt": "2024-01-15T10:30:45.123Z",
    "updatedAt": "2024-01-15T11:45:30.456Z"
  }
}
```

**Error - Missing Token (401):**
```json
{
  "success": false,
  "message": "No token provided"
}
```

**Error - Duplicate Email (409):**
```json
{
  "success": false,
  "message": "Email already in use"
}
```

---

## Summary of Changes

✅ **Modified 3 existing files:**
1. `src/middleware/auth.js` - Added authorizeRoles export
2. `src/controllers/authController.js` - Added getProfile and updateProfile functions
3. `src/routes/authRoutes.js` - Added /profile routes with authentication

✅ **No breaking changes** - Phase 1 authentication logic remains untouched

✅ **Ready for Phase 3** - Job model and endpoints can be added next

✅ **Role authorization ready** - authorizeRoles middleware available for protecting role-specific endpoints in Phase 3+

---

## Status

✅ Phase 2 Complete
✅ All requirements implemented
✅ Authorization middleware ready for future use
⏳ Awaiting confirmation to proceed
