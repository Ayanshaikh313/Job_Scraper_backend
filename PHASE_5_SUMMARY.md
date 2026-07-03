# Phase 5 Implementation - Applicant Tracking Summary

## Files Created

**No new files created**

---

## Files Modified (2)

### 1. `src/controllers/applicationController.js` - MODIFIED

**Added 2 new functions:**

#### `getJobApplicants(req, res, next)` - NEW
- Get all applicants for a specific job
- Only Hiring Managers can access (via middleware)
- Only job creator can view applicants (403 if not creator)
- Validates job exists (404 if not)
- Supports pagination (page, limit params)
- Populates student details (name, email)
- Populates job details (title, company)
- Sorted by appliedAt (newest first)
- Returns pagination metadata
- Returns 200 on success
- Returns 403 for unauthorized access
- Returns 404 if job not found

#### `updateApplicationStatus(req, res, next)` - NEW
- Update application status
- Only Hiring Managers can access (via middleware)
- Only job creator can update status (403 if not creator)
- Validates status provided
- Validates status is one of: Applied, Reviewing, Rejected, Accepted
- Validates application exists (404 if not)
- Validates job exists (404 if not)
- Updates application status
- Populates student and job details in response
- Returns 200 on success
- Returns 400 for invalid status
- Returns 403 for unauthorized access
- Returns 404 if application or job not found

---

### 2. `src/routes/applicationRoutes.js` - MODIFIED

**Added 2 new routes:**

```javascript
// Get applicants for a job (Hiring Managers only - creator only)
router.get('/job/:jobId', authenticate, authorizeRoles('hiring_manager'), getJobApplicants);

// Update application status (Hiring Managers only - creator only)
router.patch('/:id/status', authenticate, authorizeRoles('hiring_manager'), updateApplicationStatus);
```

**Authorization:**
- Both new routes protected with `authenticate` middleware
- Both routes protected with `authorizeRoles('hiring_manager')`
- Creator validation enforced in controller

---

## API Endpoints Added (2)

### 1. Get Applicants for a Job (Hiring Managers Only - Creator Only)
```
GET /api/applications/job/:jobId?page=1&limit=10
Headers: Authorization: Bearer <hiring_manager_token>

Success Response: 200
{
  "success": true,
  "message": "Applicants retrieved successfully",
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
        "company": "Tech Corp"
      },
      "status": "Applied",
      "appliedAt": "2024-01-15T10:30:45.123Z",
      "createdAt": "2024-01-15T10:30:45.123Z",
      "updatedAt": "2024-01-15T10:30:45.123Z"
    },
    {
      "_id": "64f1a2b3c4d5e6f7g8h9i0j3",
      "studentId": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0k0",
        "name": "Jane Smith",
        "email": "jane@example.com"
      },
      "jobId": {
        "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "title": "Senior Developer",
        "company": "Tech Corp"
      },
      "status": "Reviewing",
      "appliedAt": "2024-01-14T15:20:30.456Z",
      "createdAt": "2024-01-14T15:20:30.456Z",
      "updatedAt": "2024-01-14T16:45:12.789Z"
    }
  ],
  "pagination": {
    "total": 15,
    "pages": 2,
    "page": 1,
    "limit": 10
  }
}
```

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)

**Error Responses:**

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
  "message": "You are not authorized to view applicants for this job"
}
```
Status: 403 Forbidden (if user is not the job creator)

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```
Status: 403 Forbidden (if user is not a hiring manager)

---

### 2. Update Application Status (Hiring Managers Only - Creator Only)
```
PATCH /api/applications/:id/status
Headers: Authorization: Bearer <hiring_manager_token>
Body: {
  "status": "Reviewing"
}

Success Response: 200
{
  "success": true,
  "message": "Application status updated successfully",
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
      "company": "Tech Corp"
    },
    "status": "Reviewing",
    "appliedAt": "2024-01-15T10:30:45.123Z",
    "createdAt": "2024-01-15T10:30:45.123Z",
    "updatedAt": "2024-01-15T12:15:30.321Z"
  }
}
```

**Valid Status Values:**
- Applied
- Reviewing
- Rejected
- Accepted

**Error Responses:**

```json
{
  "success": false,
  "message": "Please provide a status"
}
```
Status: 400 Bad Request

```json
{
  "success": false,
  "message": "Status must be one of: Applied, Reviewing, Rejected, Accepted"
}
```
Status: 400 Bad Request (invalid status)

```json
{
  "success": false,
  "message": "Application not found"
}
```
Status: 404 Not Found

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
  "message": "You are not authorized to update this application status"
}
```
Status: 403 Forbidden (if user is not the job creator)

```json
{
  "success": false,
  "message": "Insufficient permissions"
}
```
Status: 403 Forbidden (if user is not a hiring manager)

---

## Authorization Rules

| Endpoint | Method | Hiring Manager | Creator Only | Notes |
|----------|--------|-----------------|--------------|-------|
| /api/applications/job/:jobId | GET | ✓ | ✓ (403 if not creator) | View applicants |
| /api/applications/:id/status | PATCH | ✓ | ✓ (403 if not creator) | Update status |

---

## Key Features

✅ Hiring managers can view all applicants for their jobs
✅ Creator validation ensures only job creator can view applicants
✅ Creator validation ensures only job creator can update status
✅ Validates job exists before returning applicants
✅ Validates application exists before updating
✅ Validates application status values
✅ Pagination support for applicant list
✅ Proper HTTP status codes (200, 400, 403, 404)
✅ Proper error messages
✅ No modifications to Phase 1, 2, 3, 4 logic
✅ No modifications to Application model

---

## Test Examples

### Get Applicants for a Job (as Hiring Manager/Job Creator)
```bash
curl -X GET "http://localhost:5000/api/applications/job/64f1a2b3c4d5e6f7g8h9i0j1?page=1&limit=10" \
  -H "Authorization: Bearer <hiring_manager_token>"
```

### Update Application Status (as Hiring Manager/Job Creator)
```bash
curl -X PATCH http://localhost:5000/api/applications/64f1a2b3c4d5e6f7g8h9i0j2/status \
  -H "Authorization: Bearer <hiring_manager_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "Reviewing"
  }'
```

### Try to View Applicants as Different Hiring Manager (Gets 403)
```bash
curl -X GET "http://localhost:5000/api/applications/job/64f1a2b3c4d5e6f7g8h9i0j1" \
  -H "Authorization: Bearer <different_hiring_manager_token>"
```

Response:
```json
{
  "success": false,
  "message": "You are not authorized to view applicants for this job"
}
```
Status: 403 Forbidden

---

## Summary

✅ Phase 5 Complete
✅ Applicant tracking fully implemented
✅ Hiring managers can manage applications
✅ Creator-only access enforced
✅ Status validation working
✅ No breaking changes to previous phases
