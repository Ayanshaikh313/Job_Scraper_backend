# Job Scraper Backend - Phase 1

Backend for the Job Scraper Platform built with Express.js, MongoDB, and JavaScript.

## Complete Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # MongoDB connection setup
│   │   └── env.js            # Environment variables configuration
│   ├── controllers/
│   │   └── authController.js # Authentication logic (register, login)
│   ├── middleware/
│   │   └── auth.js           # JWT authentication & authorization middleware
│   ├── models/
│   │   └── User.js           # User schema with bcryptjs hashing
│   ├── routes/
│   │   └── authRoutes.js     # Authentication endpoints
│   ├── services/
│   │   └── .gitkeep
│   ├── utils/
│   │   └── jwt.js            # JWT token generation and verification
│   └── server.js             # Express server setup
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules
├── package.json              # Dependencies and scripts
└── README.md                 # This file
```

## Created Files

- ✓ `src/config/database.js`
- ✓ `src/config/env.js`
- ✓ `src/controllers/authController.js`
- ✓ `src/middleware/auth.js`
- ✓ `src/models/User.js`
- ✓ `src/routes/authRoutes.js`
- ✓ `src/utils/jwt.js`
- ✓ `src/server.js`
- ✓ `package.json`
- ✓ `.env.example`
- ✓ `.gitignore`

## Installation Commands

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file from template
copy .env.example .env

# Edit .env with your MongoDB Atlas credentials
```

## Environment Variables Required

Create a `.env` file in the backend folder:

```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/job-scraper?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development
```

**How to get MongoDB URI:**
1. Create account on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Click "Connect" and choose "Drivers"
4. Copy the connection string and replace `<username>` and `<password>`

## Commands to Run the Backend

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:5000`

## API Endpoints

### Register User

**Endpoint:** `POST /api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123",
  "role": "student"
}
```

**Valid roles:** `student` or `hiring_manager`

**Success Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response Examples:**

```json
{
  "success": false,
  "message": "Email already registered"
}
```

```json
{
  "success": false,
  "message": "Passwords do not match"
}
```

```json
{
  "success": false,
  "message": "Invalid role. Must be \"student\" or \"hiring_manager\""
}
```

---

### Login User

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "_id": "64f1a2b3c4d5e6f7g8h9i0j1",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "student"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Error Response Examples:**

```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

```json
{
  "success": false,
  "message": "Please provide email and password"
}
```

---

### Health Check

**Endpoint:** `GET /api/health`

**Response (200):**
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

---

## Testing Instructions

### Using cURL

#### Test Health Check
```bash
curl http://localhost:5000/api/health
```

#### Register a new Student
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "test123",
    "confirmPassword": "test123",
    "role": "student"
  }'
```

#### Register a new Hiring Manager
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Manager",
    "email": "jane@example.com",
    "password": "test123",
    "confirmPassword": "test123",
    "role": "hiring_manager"
  }'
```

#### Login User
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "test123"
  }'
```

---

### Using Postman

1. Create a new Postman collection

2. **Health Check Request:**
   - Method: `GET`
   - URL: `http://localhost:5000/api/health`
   - Click Send

3. **Register Request:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/auth/register`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
   ```json
   {
     "name": "John Doe",
     "email": "john@example.com",
     "password": "test123",
     "confirmPassword": "test123",
     "role": "student"
   }
   ```
   - Click Send
   - **Copy the `token` from response**

4. **Login Request:**
   - Method: `POST`
   - URL: `http://localhost:5000/api/auth/login`
   - Headers: `Content-Type: application/json`
   - Body (raw JSON):
   ```json
   {
     "email": "john@example.com",
     "password": "test123"
   }
   ```
   - Click Send
   - **Save the `token` for future authenticated requests**

---

## Expected Test Results

| Scenario | Expected Status | Notes |
|----------|-----------------|-------|
| Register with valid data | 201 Created | Returns JWT token |
| Register duplicate email | 409 Conflict | Email already exists |
| Register mismatched passwords | 400 Bad Request | Passwords do not match |
| Register invalid role | 400 Bad Request | Role must be student or hiring_manager |
| Register missing fields | 400 Bad Request | All fields required |
| Login with correct credentials | 200 OK | Returns JWT token |
| Login with wrong password | 401 Unauthorized | Invalid credentials |
| Login with non-existent email | 401 Unauthorized | Invalid credentials |
| Login missing fields | 400 Bad Request | Email and password required |
| Health check | 200 OK | Server running |

---

## Features Implemented - Phase 1

✓ Express.js server with JavaScript  
✓ MongoDB Atlas connection with Mongoose  
✓ User model with required fields (name, email, password, role)  
✓ Email uniqueness constraint  
✓ Password hashing with bcryptjs  
✓ Role-based user types (student, hiring_manager)  
✓ JWT token generation with userId and role payload  
✓ JWT token verification utility  
✓ User registration endpoint with validation  
✓ User login endpoint with password verification  
✓ Authentication middleware for protected routes  
✓ Authorization middleware for role-based access  
✓ Error handling middleware  
✓ CORS enabled  
✓ Environment variables configuration  

---

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** JavaScript (ES6+)
- **Database:** MongoDB Atlas with Mongoose
- **Authentication:** JWT (jsonwebtoken)
- **Password Security:** bcryptjs
- **CORS:** cors
- **Environment:** dotenv
