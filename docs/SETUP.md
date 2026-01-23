# Project Setup Guide

Complete setup instructions for the Skill Exchange Learning Platform.

## Prerequisites

- **Node.js** v14 or higher
- **MongoDB** (local or MongoDB Atlas)
- **npm** or **yarn**
- **Git**
- API Keys for:
  - OpenAI (for AI quiz generation)
  - Gemini (optional alternative)

## Step 1: Install MongoDB

### Option A: Local MongoDB
```bash
# macOS with Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Linux (Ubuntu)
sudo apt-get update
sudo apt-get install -y mongodb
sudo systemctl start mongodb
```

### Option B: MongoDB Atlas (Cloud)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create account and free cluster
3. Get connection string
4. Whitelist your IP address

## Step 2: Project Setup

### Clone/Navigate to Project
```bash
cd /home/murugan/Documents/MERN/skillexchange
```

### Install Backend Dependencies
```bash
cd server
npm install
```

### Install Frontend Dependencies
```bash
cd ../client
npm install
```

## Step 3: Environment Configuration

### Backend .env Setup

Create `server/.env`:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb://localhost:27017/skillexchange
# OR for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/skillexchange

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# Email (optional - for password reset)
SMTP_SERVICE=gmail
SMTP_EMAIL=your_email@gmail.com
SMTP_PASSWORD=your_app_password

# AI APIs
OPENAI_API_KEY=sk-your-key-here
GEMINI_API_KEY=your-gemini-key-here

# File Upload
CLOUD_NAME=cloudinary_name
CLOUD_API_KEY=cloudinary_key
CLOUD_API_SECRET=cloudinary_secret

# CORS
CORS_ORIGIN=http://localhost:5173

# Admin Credentials (for seeding)
ADMIN_EMAIL=admin@skillexchange.com
ADMIN_PASSWORD=SecureAdminPassword123
```

### Frontend .env Setup

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME="Skill Exchange"
```

## Step 4: Initialize Database

### Create Collections and Indexes

```bash
cd server
node scripts/initializeDB.js
```

### Seed Sample Data (Optional)

```bash
node scripts/seedData.js
```

This will create:
- Sample admin account
- Sample courses
- Sample students
- Sample enrollments

## Step 5: Start Backend

```bash
cd server
npm run dev
```

Expected output:
```
Server running on http://localhost:5000
MongoDB connected
```

## Step 6: Start Frontend

**Open new terminal:**

```bash
cd client
npm run dev
```

Expected output:
```
  VITE v... ready in ... ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

## Step 7: Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000/api
- **API Docs**: http://localhost:5000/api-docs (if Swagger enabled)

## Default Credentials

**Admin Account:**
- Email: `admin@skillexchange.com`
- Password: `SecureAdminPassword123`

**Sample Student Account:**
- Email: `student@example.com`
- Password: `StudentPassword123`

## Verification Checklist

- [ ] Node.js and npm installed
- [ ] MongoDB running
- [ ] `.env` files created in both server and client
- [ ] Dependencies installed
- [ ] Backend server starts without errors
- [ ] Frontend starts without errors
- [ ] Can access http://localhost:5173
- [ ] Can login with credentials
- [ ] MongoDB collections created

## Troubleshooting

### MongoDB Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Start MongoDB service
```bash
sudo systemctl start mongodb  # Linux
brew services start mongodb-community  # macOS
```

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Kill process or change PORT in .env
```bash
# Find and kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change PORT in server/.env
```

### CORS Error
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Ensure CORS_ORIGIN in server/.env matches frontend URL
```env
CORS_ORIGIN=http://localhost:5173
```

### Module Not Found
```bash
rm -rf node_modules package-lock.json
npm install
```

### MongoDB Atlas Connection Issues
- Check IP whitelist in MongoDB Atlas
- Verify connection string format
- Ensure password doesn't contain special characters

## Development Tips

### VSCode Extensions Recommended
- ES7+ React/Redux/React-Native snippets
- MongoDB for VS Code
- Thunder Client (API testing)
- Prettier - Code formatter

### Debugging

**Backend:**
```bash
cd server
node --inspect-brk server.js
# Open chrome://inspect in Chrome DevTools
```

**Frontend:**
- Use React DevTools browser extension
- Use Redux DevTools (if Redux installed)

### Database Management

**View MongoDB collections:**
```bash
# Open MongoDB shell
mongosh

# Select database
use skillexchange

# List collections
show collections

# View documents
db.users.find()
```

## Production Deployment

See deployment guides in `docs/DEPLOYMENT.md` (to be created)

---

For issues or questions, check docs or create an issue in the repository.
