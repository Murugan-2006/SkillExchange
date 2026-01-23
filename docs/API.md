# API Documentation

Complete REST API endpoints for the Skill Exchange Platform.

## Base URL
```
http://localhost:5000/api
```

## Authentication
All protected endpoints require JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## AUTH ENDPOINTS

### POST /auth/register
Register a new user (student or admin)

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt_token",
  "user": { ... }
}
```

### POST /auth/login
Login user

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": { ... }
}
```

---

## COURSE ENDPOINTS

### GET /courses
Get all available courses (public)

**Query Parameters:**
- `page`: Number (default: 1)
- `limit`: Number (default: 10)
- `category`: String (filter)
- `level`: String (filter)

**Response:**
```json
{
  "success": true,
  "courses": [ ... ],
  "total": 25
}
```

### GET /courses/:id
Get course details with videos

**Response:**
```json
{
  "success": true,
  "course": { ... }
}
```

### POST /courses (Admin Only)
Create new course

**Request Body:**
```json
{
  "title": "React Basics",
  "description": "Learn React fundamentals",
  "skillsCovered": ["React", "JavaScript"],
  "creditsRequired": 10,
  "level": "beginner",
  "isPaid": false
}
```

### PUT /courses/:id (Admin Only)
Update course

### DELETE /courses/:id (Admin Only)
Delete course

---

## ENROLLMENT ENDPOINTS

### POST /enrollments
Enroll in a course

**Request Body:**
```json
{
  "courseId": "course_id",
  "paymentMethod": "credits" | "free"
}
```

**Response:**
```json
{
  "success": true,
  "enrollment": { ... }
}
```

### GET /enrollments
Get student's enrolled courses (Protected)

### GET /enrollments/:id
Get enrollment details

### PUT /enrollments/:id/progress
Update video watch progress

**Request Body:**
```json
{
  "videoId": "video_id",
  "watchPercentage": 75,
  "lastWatchedAt": "2026-01-14T10:00:00Z"
}
```

---

## VIDEO ENDPOINTS

### GET /courses/:courseId/videos
Get all videos in a course

### POST /courses/:courseId/videos (Admin Only)
Upload video

**Request Body (multipart/form-data):**
- `video`: File
- `title`: String
- `description`: String
- `videoOrder`: Number

### PUT /videos/:id (Admin Only)
Update video details

### DELETE /videos/:id (Admin Only)
Delete video

---

## DISCUSSION ENDPOINTS

### GET /courses/:courseId/discussions
Get discussion threads for course

### POST /courses/:courseId/discussions
Create new discussion thread

**Request Body:**
```json
{
  "title": "How to use hooks?",
  "question": "Can someone explain..."
}
```

### POST /discussions/:id/replies
Add reply to discussion

**Request Body:**
```json
{
  "content": "Here's the answer..."
}
```

### PUT /discussions/:id/upvote
Upvote discussion

### PUT /discussions/:discussionId/replies/:replyId/upvote
Upvote reply

### PUT /discussions/:discussionId/replies/:replyId/pin (Admin Only)
Pin instructor answer

---

## QUIZ ENDPOINTS

### GET /videos/:videoId/quizzes
Get quiz for a video

### POST /videos/:videoId/quizzes/generate (Admin Only)
Generate quiz from video transcript

**Request Body:**
```json
{
  "difficulty": "medium",
  "questionCount": 10
}
```

### POST /quizzes/:id/attempt
Submit quiz answers

**Request Body:**
```json
{
  "answers": ["answer1", "answer2", ...]
}
```

**Response:**
```json
{
  "success": true,
  "score": 85,
  "feedback": { ... }
}
```

---

## PROJECT ENDPOINTS

### POST /projects
Submit project

**Request Body:**
```json
{
  "courseId": "course_id",
  "title": "Todo App",
  "description": "A React todo application",
  "gitHubLink": "https://github.com/user/project"
}
```

### GET /projects
Get student's projects (Protected)

### GET /courses/:courseId/projects (Admin Only)
Get all projects submitted for a course

### PUT /projects/:id/review (Admin Only)
Review and approve/reject project

**Request Body:**
```json
{
  "status": "approved" | "rejected",
  "feedback": "Great project!"
}
```

---

## CERTIFICATE ENDPOINTS

### GET /certificates
Get student's certificates (Protected)

### GET /certificates/:certificateId
Get certificate details (Public)

### GET /verify/:certificateNumber
Verify certificate (Public)

**Response:**
```json
{
  "isValid": true,
  "student": "John Doe",
  "course": "React Basics",
  "issuedAt": "2026-01-14",
  "skills": ["React", "JavaScript"]
}
```

### POST /certificates/:id/download
Download certificate as PDF (Protected)

---

## CREDITS ENDPOINTS

### GET /credits
Get student's credit balance (Protected)

**Response:**
```json
{
  "balance": 150,
  "transactions": [ ... ]
}
```

### GET /credits/history
Get credit transaction history

### PUT /credits/:studentId/freeze (Admin Only)
Freeze student credits

---

## ANALYTICS ENDPOINTS (Admin Only)

### GET /analytics/dashboard
Get analytics dashboard data

**Response:**
```json
{
  "totalStudents": 1000,
  "totalCourses": 50,
  "courseCompletion": 65,
  "studentEngagement": 78,
  "quizPerformance": 72,
  "dropoutRate": 12
}
```

### GET /analytics/course/:courseId
Get course-specific analytics

### GET /analytics/student/:studentId
Get student performance analytics

---

## ERROR RESPONSES

All errors follow this format:

```json
{
  "success": false,
  "message": "Error message",
  "error": "ERROR_CODE"
}
```

### Common Error Codes
- `UNAUTHORIZED`: Invalid/expired token
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Invalid input
- `DUPLICATE_ENTRY`: Resource already exists
- `SERVER_ERROR`: Internal server error

---

## Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error
