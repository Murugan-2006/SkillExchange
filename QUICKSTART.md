# Quick Start Guide

## Prerequisites
- Node.js v14+
- MongoDB (local or Atlas)
- npm or yarn

## Installation & Setup

### 1. Install Server Dependencies
```bash
cd server
npm install
```

### 2. Install Client Dependencies
```bash
cd ../client
npm install
```

### 3. Configure Environment Variables

**Backend** - Create `server/.env`:
```env
MONGO_URI=mongodb://localhost:27017/skillexchange
JWT_SECRET=your_secret_key_here
PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**Frontend** - Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000
```

### 4. Start MongoDB (if using local)
```bash
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongodb

# Or use MongoDB Atlas for cloud
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm run dev
```

## Access URLs
- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- API: http://localhost:5000/api

## Test Accounts

**Admin Account (for testing):**
- Email: admin@test.com
- Password: admin123

**Student Account (for testing):**
- Email: student@test.com
- Password: student123

Create these accounts via the register endpoint or by manually seeding the database.

## Project Features Implemented

✅ **Authentication**
- User registration (Student/Admin)
- JWT-based login
- Role-based access control

✅ **Courses**
- Browse courses
- Create/edit courses (Admin only)
- Course details with skills and credits

✅ **Enrollment**
- Enroll in courses
- Track learning progress
- Update video watch progress

✅ **Dashboard**
- Student dashboard with enrollment progress
- Admin dashboard with course management
- Quick stats and analytics

✅ **User Interface**
- Home page
- Login/Register forms
- Course browsing and filtering
- Student and admin dashboards

## Features To Implement

⬜ **Video Management**
- Upload videos
- Video player with progress tracking
- Attention-aware playback

⬜ **Discussions**
- Create discussion threads
- Reply to discussions
- Upvoting system

⬜ **AI Quizzes**
- Auto-generate quizzes from transcripts
- Quiz attempt tracking
- Adaptive difficulty

⬜ **Projects**
- Project submission
- Admin review and approval
- Feedback system

⬜ **Certificates**
- Certificate generation
- Unique verification links
- Public verification page

⬜ **Credits System**
- Credit transactions
- Credit spending for premium courses
- Admin credit management

⬜ **Analytics**
- Completion rates
- Student engagement metrics
- Quiz performance analytics

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED
```
Solution: Ensure MongoDB is running or update MONGO_URI to MongoDB Atlas connection string

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
Solution: Kill the process or change PORT in .env

### CORS Errors
Ensure CORS_ORIGIN in server/.env matches your frontend URL (http://localhost:5173)

### Dependencies Not Found
```bash
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Implement Video Management** - Create video upload and playback features
2. **Build Discussion System** - Q&A threads with peer replies
3. **Integrate AI Quiz System** - Use OpenAI/Gemini API for auto-generated quizzes
4. **Implement Project Submission** - Project upload and admin review workflow
5. **Create Certificate System** - Auto-generation and verification
6. **Complete Credits Economy** - Full credit system with transactions
7. **Add Analytics** - Dashboard with comprehensive metrics

## File Structure

See [main.txt](../main.txt) for system specifications and [README.md](../README.md) for architecture overview.

## Support

For API documentation, see [docs/API.md](../docs/API.md)
For database schema, see [docs/DATABASE.md](../docs/DATABASE.md)
For detailed setup, see [docs/SETUP.md](../docs/SETUP.md)
