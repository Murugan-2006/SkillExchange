# Database Schema Design

MongoDB collections and their schemas for the Skill Exchange Platform.

## Collections

### 1. Users Collection

Stores student and admin profiles.

```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  role: "student" | "admin",
  profilePicture: String (URL),
  bio: String,
  skills: [String],
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean
}
```

### 2. Courses Collection

Course metadata and content.

```javascript
{
  _id: ObjectId,
  title: String,
  description: String,
  instructor: ObjectId (ref: User),
  skillsCovered: [String],
  creditsRequired: Number,
  creditsEarned: Number,
  category: String,
  level: "beginner" | "intermediate" | "advanced",
  videos: [ObjectId] (ref: Video),
  thumbnail: String (URL),
  duration: Number (in minutes),
  enrollmentCount: Number,
  completionRate: Number,
  isPaid: Boolean,
  price: Number,
  createdAt: Date,
  updatedAt: Date,
  isActive: Boolean
}
```

### 3. Enrollments Collection

Tracks student course enrollments and progress.

```javascript
{
  _id: ObjectId,
  student: ObjectId (ref: User),
  course: ObjectId (ref: Course),
  enrolledAt: Date,
  progress: {
    videosWatched: Number,
    totalVideos: Number,
    watchPercentage: Number,
    lastWatchedAt: Date,
    lastWatchedVideoId: ObjectId
  },
  status: "active" | "completed" | "dropped",
  certificateIssued: Boolean,
  certificateId: ObjectId (ref: Certificate),
  projectSubmitted: Boolean,
  projectStatus: "pending" | "approved" | "rejected",
  quizzesAttempted: Number,
  averageQuizScore: Number,
  creditsSpent: Number,
  updatedAt: Date
}
```

### 4. Videos Collection

Course video content.

```javascript
{
  _id: ObjectId,
  course: ObjectId (ref: Course),
  title: String,
  description: String,
  url: String (cloud storage link),
  duration: Number (in seconds),
  transcript: String,
  videoOrder: Number,
  thumbnail: String (URL),
  views: Number,
  uploadedAt: Date,
  updatedAt: Date
}
```

### 5. Discussions Collection

Live Q&A threads per course.

```javascript
{
  _id: ObjectId,
  course: ObjectId (ref: Course),
  student: ObjectId (ref: User),
  title: String,
  question: String,
  replies: [
    {
      replyId: ObjectId,
      author: ObjectId (ref: User),
      content: String,
      upvotes: Number,
      isPinned: Boolean,
      createdAt: Date
    }
  ],
  upvotes: Number,
  views: Number,
  createdAt: Date,
  updatedAt: Date,
  isSolved: Boolean
}
```

### 6. Credits Collection

Learning credits ledger (tracks all credit transactions).

```javascript
{
  _id: ObjectId,
  student: ObjectId (ref: User),
  balance: Number,
  transactions: [
    {
      transactionId: ObjectId,
      type: "earned" | "spent",
      amount: Number,
      reason: String,
      relatedId: ObjectId (course/project/discussion),
      createdAt: Date
    }
  ],
  frozenBalance: Number,
  reason: String (if frozen),
  updatedAt: Date
}
```

### 7. Projects Collection

Student project submissions.

```javascript
{
  _id: ObjectId,
  student: ObjectId (ref: User),
  course: ObjectId (ref: Course),
  title: String,
  description: String,
  gitHubLink: String (URL),
  submittedAt: Date,
  status: "pending" | "approved" | "rejected",
  feedback: String,
  reviewedBy: ObjectId (ref: User) (admin who reviewed),
  reviewedAt: Date,
  certificateId: ObjectId (ref: Certificate),
  updatedAt: Date
}
```

### 8. Certificates Collection

Issued certificates with verification details.

```javascript
{
  _id: ObjectId,
  student: ObjectId (ref: User),
  course: ObjectId (ref: Course),
  project: ObjectId (ref: Project),
  certificateNumber: String (unique),
  issuedAt: Date,
  verificationLink: String (unique URL),
  imageUrl: String (certificate image URL),
  skills: [String],
  expiresAt: Date (optional),
  isVerified: Boolean,
  verificationCount: Number
}
```

### 9. Quizzes Collection

Auto-generated quiz questions from video transcripts.

```javascript
{
  _id: ObjectId,
  video: ObjectId (ref: Video),
  course: ObjectId (ref: Course),
  questions: [
    {
      questionId: ObjectId,
      type: "mcq" | "short_answer",
      question: String,
      options: [String] (for MCQ),
      correctAnswer: String,
      explanation: String,
      difficulty: "easy" | "medium" | "hard",
      generatedAt: Date
    }
  ],
  isApproved: Boolean,
  approvedBy: ObjectId (ref: User) (admin),
  attempts: [
    {
      attemptId: ObjectId,
      student: ObjectId,
      answers: [String],
      score: Number,
      completedAt: Date
    }
  ],
  generatedAt: Date,
  updatedAt: Date
}
```

### 10. LearningCreditsRules Collection

Admin-defined rules for earning credits.

```javascript
{
  _id: ObjectId,
  rule: String,
  creditsAwarded: Number,
  description: String,
  isActive: Boolean,
  createdBy: ObjectId (ref: User) (admin),
  createdAt: Date,
  updatedAt: Date
}
```

## Indexes

Recommended MongoDB indexes for performance:

```javascript
// Users
db.users.createIndex({ email: 1 }, { unique: true })

// Courses
db.courses.createIndex({ instructor: 1 })
db.courses.createIndex({ category: 1 })

// Enrollments
db.enrollments.createIndex({ student: 1, course: 1 }, { unique: true })
db.enrollments.createIndex({ status: 1 })

// Videos
db.videos.createIndex({ course: 1 })

// Discussions
db.discussions.createIndex({ course: 1 })

// Credits
db.credits.createIndex({ student: 1 }, { unique: true })

// Projects
db.projects.createIndex({ student: 1, course: 1 })

// Certificates
db.certificates.createIndex({ student: 1 })
db.certificates.createIndex({ certificateNumber: 1 }, { unique: true })

// Quizzes
db.quizzes.createIndex({ video: 1 })
db.quizzes.createIndex({ course: 1 })
```
