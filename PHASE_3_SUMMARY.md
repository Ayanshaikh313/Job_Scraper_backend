# Phase 3 Implementation - Jobs CRUD Summary

## Files Created (3)

### 1. `src/models/Job.js` - NEW
Job model with Mongoose schema.

**Fields:**
- `title` (String, required) - Job title
- `company` (String, required) - Company name
- `location` (String, required) - Job location
- `description` (String, required) - Job description
- `salary` (String, required) - Salary range
- `employmentType` (String, enum, required) - Full-time, Part-time, Contract, Temporary, Internship
- `createdBy` (ObjectId, references User, required) - Job creator
- `createdAt` (Date, auto) - Creation timestamp
- `updatedAt` (Date, auto) - Update timestamp

---

### 2. `src/controllers/jobController.js` - NEW
Job CRUD controller with 5 functions:

**Functions:**

#### `createJob(req, res, next)`
- Creates new job
- Only Hiring Managers can access (via middleware)
- Validates all required fields
- Validates employmentType enum
- Uses req.userId from JWT token as createdBy
- Returns 201 with created job

#### `getAllJobs(req, res, next)`
- Returns all jobs with pagination
- Query filters: search, location, employmentType, page, limit
- Search searches in title, company, and description
- All authenticated users can access
- Returns jobs sorted by creation date (newest first)
- Returns pagination metadata

#### `getJobById(req, res, next)`
- Returns single job by ID
- All authenticated users can access
- Populates creator details
- Returns 404 if job not found

#### `updateJob(req, res, next)`
- Updates job fields
- Only Hiring Managers can access (via middleware)
- Only creator of job can update it (403 if not creator)
- At least one field must be provided
- Validates employmentType if provided
- Returns 403 if user is not creator
- Returns updated job with populated creator

#### `deleteJob(req, res, next)`
- Deletes job by ID
- Only Hiring Managers can access (via middleware)
- Only creator of job can delete it (403 if not creator)
- Returns 404 if job not found
- Returns 200 with empty data on success

---

### 3. `src/routes/jobRoutes.js` - NEW
Job routes with authentication and authorization.

**Routes:**
- POST /api/jobs → createJob (authenticate + authorizeRoles('hiring_manager'))
- GET /api/jobs → getAllJobs (authenticate)
- GET /api/jobs/:id → getJobById (authenticate)
- PUT /api/jobs/:id → updateJob (authenticate + authorizeRoles('hiring_manager'))
- DELETE /api/jobs/:id → deleteJob (authenticate + authorizeRoles('hiring_manager'))

---

## Files Modified (1)

### `src/server.js` - MODIFIED
Added job routes to Express app.

**Changes:**
```javascript
// Added import
const jobRoutes = require('./routes/jobRoutes');

// Added route mounting
app.use('/api/jobs', jobRoutes);
```

---

## API Endpoints Added (5)

### 1. Create Job (Hiring Managers Only)
```
POST /api/jobs
Headers: Authorization: Bearer <token>
Body: {
  "title": "Senior Developer",
  "company": "Tech Corp",
  "location": "New York, NY",
  "description": "We are looking for...",
  "salary": "$150,000 - $200,000",
  "employmentType": "Full-time"
}
Response: 201
{
  "success": true,
  "message": "Job created successfully",
  "data": {
    "_id": "...",
    "title": "Senior Developer",
    "company": "Tech Corp",
    "location": "New York, NY",
    "description": "We are looking for...",
    "salary": "$150,000 - $200,000",
    "employmentType": "Full-time",
    "createdBy": {
      "_id": "...",
      "name": "Jane Manager",
      "email": "jane@example.com"
    },
    "createdAt": "2024-01-15T10:30:45.123Z",
    "updatedAt": "2024-01-15T10:30:45.123Z"
  }
}
```

---

### 2. Get All Jobs (All Authenticated Users)
```
GET /api/jobs?search=developer&location=New+York&employmentType=Full-time&page=1&limit=10
Headers: Authorization: Bearer <token>
Response: 200
{
  "success": true,
  "message": "Jobs retrieved successfully",
  "data": [
    {
      "_id": "...",
      "title": "Senior Developer",
      "company": "Tech Corp",
      "location": "New York, NY",
      "description": "...",
      "salary": "$150,000 - $200,000",
      "employmentType": "Full-time",
      "createdBy": {
        "_id": "...",
        "name": "Jane Manager",
        "email": "jane@example.com"
      },
      "createdAt": "2024-01-15T10:30:45.123Z",
      "updatedAt": "2024-01-15T10:30:45.123Z"
    }
  ],
  "pagination": {
    "total": 50,
    "pages": 5,
    "page": 1,
    "limit": 10
  }
}
```

**Query Parameters:**
- `search` - Search in title, company, description
- `location` - Filter by location (case-insensitive)
- `employmentType` - Filter by employment type
- `page` - Page number (default: 1)
- `limit` - Results per page (default: 10)

---

### 3. Get Job By ID (All Authenticated Users)
```
GET /api/jobs/:id
Headers: Authorization: Bearer <token>
Response: 200
{
  "success": true,
  "message": "Job retrieved successfully",
  "data": {
    "_id": "...",
    "title": "Senior Developer",
    "company": "Tech Corp",
    "location": "New York, NY",
    "description": "...",
    "salary": "$150,000 - $200,000",
    "employmentType": "Full-time",
    "createdBy": {
      "_id": "...",
      "name": "Jane Manager",
      "email": "jane@example.com"
    },
    "createdAt": "2024-01-15T10:30:45.123Z",
    "updatedAt": "2024-01-15T10:30:45.123Z"
  }
}
```

**Error (404):**
```json
{
  "success": false,
  "message": "Job not found"
}
```

---

### 4. Update Job (Hiring Managers Only - Creator Only)
```
PUT /api/jobs/:id
Headers: Authorization: Bearer <token>
Body: {
  "title": "Updated Job Title",
  "salary": "$160,000 - $220,000"
}
Response: 200
{
  "success": true,
  "message": "Job updated successfully",
  "data": { ... updated job ... }
}
```

**Errors:**
- 403 if user is not the creator
- 403 if user is not a hiring manager
- 400 if no fields provided for update
- 400 if invalid employmentType
- 404 if job not found

---

### 5. Delete Job (Hiring Managers Only - Creator Only)
```
DELETE /api/jobs/:id
Headers: Authorization: Bearer <token>
Response: 200
{
  "success": true,
  "message": "Job deleted successfully",
  "data": {}
}
```

**Errors:**
- 403 if user is not the creator
- 403 if user is not a hiring manager
- 404 if job not found

---

## Authorization Rules

| Endpoint | Method | Student | Hiring Manager | Creator Only |
|----------|--------|---------|-----------------|--------------|
| /api/jobs | POST | ✗ | ✓ | N/A |
| /api/jobs | GET | ✓ | ✓ | N/A |
| /api/jobs/:id | GET | ✓ | ✓ | N/A |
| /api/jobs/:id | PUT | ✗ | ✓ | ✓ (403 if not creator) |
| /api/jobs/:id | DELETE | ✗ | ✓ | ✓ (403 if not creator) |

---

## Key Features

✅ Job model with all required fields
✅ createdBy references User model
✅ Hiring managers only can create/update/delete jobs
✅ Only job creator can update/delete their own job
✅ Students can view all jobs and search
✅ Pagination support with page and limit
✅ Full-text search in title, company, description
✅ Filter by location and employment type
✅ Proper HTTP status codes (201, 200, 400, 403, 404)
✅ Proper error messages
✅ JWT role-based authorization
✅ No breaking changes to Phase 1 & 2

---

## Test Examples

### Create Job (as Hiring Manager)
```bash
curl -X POST http://localhost:5000/api/jobs \
  -H "Authorization: Bearer <hiring_manager_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Frontend Developer",
    "company": "Tech Inc",
    "location": "San Francisco, CA",
    "description": "Build amazing user interfaces",
    "salary": "$120,000 - $160,000",
    "employmentType": "Full-time"
  }'
```

### Search Jobs (as Student or Hiring Manager)
```bash
curl -X GET "http://localhost:5000/api/jobs?search=developer&location=San%20Francisco" \
  -H "Authorization: Bearer <token>"
```

### Update Job (as Job Creator)
```bash
curl -X PUT http://localhost:5000/api/jobs/<job_id> \
  -H "Authorization: Bearer <hiring_manager_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "salary": "$130,000 - $170,000"
  }'
```

### Delete Job (as Job Creator)
```bash
curl -X DELETE http://localhost:5000/api/jobs/<job_id> \
  -H "Authorization: Bearer <hiring_manager_token>"
```

---

## Summary

✅ Phase 3 Complete
✅ Job CRUD fully implemented
✅ Role-based authorization working
✅ Creator-only edit/delete working
✅ Search and filtering working
✅ No changes to authentication logic
