# Skill Exchange Learning Platform

A comprehensive MERN stack web application for project-based skill verification with AI-powered quizzes, learning credits economy, and interactive learning engagement.

## Features

- **Project-Based Certification** - Students submit projects for review to earn certificates
- **Learning Credits Economy** - Earn credits by teaching peers and answering questions
- **AI-Powered Quizzes** - Dynamically generated from video transcripts using LLM APIs
- **Attention-Aware Playback** - Video pauses when student loses focus (webcam integration)
- **Live Discussion Threads** - Peer-to-peer learning with upvotes and instructor-pinned answers
- **Admin Dashboard** - Course management, project reviews, analytics
- **Role-Based Access Control** - Separate flows for students and instructors

## Project Structure

```
skillexchange/
├── server/                    # Backend (Node + Express)
│   ├── models/               # MongoDB schemas
│   ├── routes/               # API routes
│   ├── controllers/          # Business logic
│   ├── middleware/           # Auth, error handling
│   ├── config/               # Database config
│   ├── utils/                # Helper functions
│   └── server.js
│
├── client/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API client
│   │   ├── hooks/            # Custom React hooks
│   │   ├── context/          # Context API state
│   │   ├── assets/           # Images, fonts
│   │   ├── styles/           # Global styles
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   └── vite.config.js
│
├── docs/                      # Documentation
│   ├── API.md                # API endpoints
│   ├── DATABASE.md           # MongoDB schemas
│   └── SETUP.md              # Setup instructions
│
└── README.md
```

## Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **JWT** - Authentication
- **Multer** - File uploads
- **OpenAI/Gemini API** - AI quiz generation

### Frontend
- **React** - UI library
- **Vite** - Build tool
- **Axios** - HTTP client
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **face-api.js** - Attention detection

### Database
- **MongoDB** - Document database
- **Mongoose** - ODM

## Getting Started

### Prerequisites
- Node.js (v14+)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
cd skillexchange
```

2. **Setup Backend**
```bash
cd server
npm install
```

3. **Setup Frontend**
```bash
cd ../client
npm install
```

### Configuration

1. **Backend .env** (`server/.env`)
```
MONGO_URI=mongodb://localhost:27017/skillexchange
JWT_SECRET=your_secret_key
PORT=5000
OPENAI_API_KEY=your_openai_key
GEMINI_API_KEY=your_gemini_key
```

2. **Frontend .env** (`client/.env`)
```
VITE_API_URL=http://localhost:5000
```

### Running the Application

**Terminal 1 - Start Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Start Frontend:**
```bash
cd client
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:5000

## Database Collections

- **users** - Student and Admin profiles
- **courses** - Course content and metadata
- **enrollments** - Student course enrollments and progress
- **videos** - Video content and transcripts
- **discussions** - Q&A threads per course
- **credits** - Student learning credits ledger
- **projects** - Student project submissions
- **certificates** - Issued certificates
- **quizzes** - Auto-generated quiz questions

## API Documentation

See [docs/API.md](docs/API.md) for complete API endpoints.

## Database Schema

See [docs/DATABASE.md](docs/DATABASE.md) for MongoDB collection schemas.

## Development Guidelines

- Use ES6+ syntax
- Follow RESTful API design
- Implement proper error handling
- Add JWT authentication to protected routes
- Use middleware for common operations
- Keep components modular and reusable

## Security

- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- HTTPS in production
- Webcam feature is opt-in only
- No face data stored

## License

MIT
