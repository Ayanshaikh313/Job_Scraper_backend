# Phase 4 Implementation - Applications Module Summary

## Files Created (3)

### 1. `src/models/Application.js` - NEW
Mongoose schema for Application collection.

**Fields:**
- `studentId` (ObjectId, references User, required) - Student applying
- `jobId` (ObjectId, references Job, required) - Job being applied to
- `status` (String, enum, default: 'Applied', required) - Application status
  - Values: Applied, Reviewing, Rejected, Accepted
- `appliedAt` (Date, default: Date.now) - Application submission date
- `timestamps` (auto) - createdAt, updatedAt

**Indexes:**
- Unique index on (studentId, jobId) to prevent duplicate applications

---

### 2. `src/controllers/applicationController.js` - NEW
Application controller with 2 functions.

**Functions:**

#### `applyToJob(req, res, next)`
- Student applies to a job
- Only students can access (via middleware)
- Validates jobId provided
- Validates job exists in database (404 if not)
- Prevents duplicate applications (409 if already applied)
- Creates application with 'Applied' status
- Uses req.userId from JWT token as studentId
- Populates student and job details in response
- Returns 201 on success
- Returns 400, 404, 409 on errors

#### `getMyApplications(req, res, next)`
- Returns student's application history
- Only students can access (via middleware)
- Returns student's applications only (uses req.userId)
- Supports pagination (page, limit params)
- Populates job details (title, company, location, salary, employmentType)
- Populates student details (name, email)
- Sorted by appliedAt (newest first)
- Returns pagination metadata
- Returns 200 on success

---

### 3. `src/routes/applicationRoutes.js` - NEW
Express router with 2 routes and authorization.

**Routes:**
- POST /api/applications → applyToJob (authenticate + authorizeRoles('student'))
- GET /api/applications/my → getMyApplications (authenticate + authorizeRoles('student'))

**Authorization:**
- Both routes protected with `authenticate` middleware (requires JWT)
- Both routes protected with `authorizeRoles('student')` (only students)
- Hiring managers get 403 Forbidden if they try to access

---

## Files Modified (1)

### `src/server.js` - MODIFIED
Added application routes to Express app.

**Changes:**
```javascript
// Added import
const applicationRoutes = require('./routes/applicationRoutes');

// Added route mounting
app.use('/api/applications', applicationRoutes);
```

---

## API Endpoints Added (2)

### 1. Apply to Job (Students Only)
```
POST /api/applications
Headers: Authorization: Bearer <student_token>
Body: {
  "jobId": "64f1a2b3c4d5e6f7g8h9i0j1"
}

Success Response: 201
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
    "studentId": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j0",
      "name": "John Doe",
      "email": "john@example.com"
    },
    "jobId": {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
      "title": "Senior Developer",
      "company": "Tech Corp",
      "location": "New York, NY"
    },
    "status": "Applied",
    "appliedAt": "2024-01-15T10:30:45.123Z",
    "createdAt": "2024-01-15T10:30:45.123Z",
    "updatedAt": "2024-01-15T10:30:45.123Z"
  }
}
```

**Error Responses:**

```json
{
  "success": false,
  "message": "You have already applied to this job"
}
```
Status: 409 Conflict

```json
{
  "success": false,
  "message": "Job not found"
}
```
Status: 404 Not Found

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```
Status: 403 Forbidden (if Hiring Manager tries to apply)

```json
{
  "success": false,
  "message": "Please provide a job ID"
}
```
Status: 400 Bad Request

---

### 2. Get My Applications (Students Only)
```
GET /api/applications/my?page=1&limit=10
Headers: Authorization: Bearer <student_token>

Success Response: 200
{
  "success": true,
  "message": "Applications retrieved successfully",
  "data": [
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j2",
      "studentId": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j0",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "jobId": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "title": "Senior Developer",
        "company": "Tech Corp",
        "location": "New York, NY",
        "salary": "$150,000 - $200,000",
        "employmentType": "Full-time"
      },
      "status": "Applied",
      "appliedAt": "2024-01-15T10:30:45.123Z",
      "createdAt": "2024-01-15T10:30:45.123Z",
      "updatedAt": "2024-01-15T10:30:45.123Z"
    },
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
      "studentId": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j0",
        "name": "John Doe",
        "email": "john@example.com"
      },
      "jobId": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j4",
        "title": "Junior Developer",
        "company": "StartUp Inc",
        "location": "San Francisco, CA",
        "salary": "$100,000 - $130,000",
        "employmentType": "Full-time"
      },
      "status": "Reviewing",
      "appliedAt": "2024-01-14T15:20:30.456Z",
      "createdAt": "2024-01-14T15:20:30.456Z",
      "updatedAt": "2024-01-14T15:20:30.456Z"
    }
  ],
  "pagination": {
    "total": 5,
    "pages": 1,
    "page": 1,
    "limit": 10
  }
}
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)

**Error Response:**

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```
Status: 403 Forbidden (if Hiring Manager tries to access)

---

## Authorization Rules

| Endpoint | Student | Hiring Manager | Notes |
|----------|---------|-----------------|-------|
| POST /api/applications | ✓ | ✗ (403) | Apply to jobs |
| GET /api/applications/my | ✓ | ✗ (403) | View own applications |

---

## Key Features

✅ Application model with all required fields
✅ studentId references User model
✅ jobId references Job model
✅ Unique constraint prevents duplicate applications
✅ Students only can apply to jobs
✅ Hiring managers cannot apply (403 Forbidden)
✅ Validate job exists before allowing application
✅ Duplicate application prevention (unique index + business logic)
✅ Pagination support for viewing applications
✅ Status tracking (Applied, Reviewing, Rejected, Accepted)
✅ Proper HTTP status codes (201, 200, 400, 403, 404, 409)
✅ Proper error messages
✅ No breaking changes to Phase 1, 2, 3

---

## Test Examples

### Apply to Job (as Student)
```bash
curl -X POST http://localhost:5000/api/applications \
  -H "Authorization: Bearer <student_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "64f1a2b3c4d5e6f7g8h9i0j1"
  }'
```

### Get Applications (as Student)
```bash
curl -X GET "http://localhost:5000/api/applications/my?page=1&limit=10" \
  -H "Authorization: Bearer <student_token>"
```

### Try to Apply as Hiring Manager (Gets 403)
```bash
curl -X POST http://localhost:5000/api/applications \
  -H "Authorization: Bearer <hiring_manager_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "64f1a2b3c4d5e6f7g8h9i0j1"
  }'
```

Response:
```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```
Status: 403 Forbidden

---

## Duplicate Prevention

The system prevents duplicate applications in two ways:

1. **Database Level** - Unique index on (studentId, jobId)
   ```javascript
   applicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });
   ```

2. **Application Level** - Check before creating
   ```javascript
   const existingApplication = await Application.findOne({
     studentId,
     jobId,
   });
   ```

Both methods ensure a student cannot apply twice to the same job.

---

## Summary

✅ Phase 4 Complete
✅ Application CRUD implemented
✅ Students-only access enforced
✅ Duplicate applications prevented
✅ No changes to authentication or job CRUD logic
