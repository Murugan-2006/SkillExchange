#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================${NC}"
echo -e "${BLUE}Skill Exchange Platform Setup${NC}"
echo -e "${BLUE}================================${NC}\n"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version:${NC} $(node --version)"
echo -e "${GREEN}✓ npm version:${NC} $(npm --version)\n"

# Check if MongoDB is running
echo -e "${BLUE}Checking MongoDB connection...${NC}"
if nc -z localhost 27017 2>/dev/null; then
    echo -e "${GREEN}✓ MongoDB is running on localhost:27017${NC}\n"
else
    echo -e "${YELLOW}⚠ MongoDB doesn't appear to be running locally${NC}"
    echo -e "${YELLOW}  Please start MongoDB with: mongod${NC}"
    echo -e "${YELLOW}  Or use MongoDB Atlas and update MONGO_URI in .env${NC}\n"
fi

# Setup Backend
echo -e "${BLUE}Setting up Backend...${NC}"
cd server

if [ ! -d "node_modules" ]; then
    echo -e "Installing backend dependencies..."
    npm install
fi

echo -e "${GREEN}✓ Backend dependencies installed${NC}\n"

# Setup Frontend
echo -e "${BLUE}Setting up Frontend...${NC}"
cd ../client

if [ ! -d "node_modules" ]; then
    echo -e "Installing frontend dependencies..."
    npm install
fi

echo -e "${GREEN}✓ Frontend dependencies installed${NC}\n"

# Return to root
cd ..

echo -e "${BLUE}================================${NC}"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo -e "${BLUE}================================${NC}\n"

echo -e "${YELLOW}Next Steps:${NC}"
echo -e "1. Start MongoDB (if not running):"
echo -e "   ${GREEN}mongod${NC}\n"

echo -e "2. Seed the database (optional but recommended):"
echo -e "   ${GREEN}cd server && npm run seed${NC}\n"

echo -e "3. Start the backend server (in a new terminal):"
echo -e "   ${GREEN}cd server && npm run dev${NC}\n"

echo -e "4. Start the frontend (in another terminal):"
echo -e "   ${GREEN}cd client && npm run dev${NC}\n"

echo -e "5. Access the application:"
echo -e "   Frontend: ${GREEN}http://localhost:5173${NC}"
echo -e "   Backend:  ${GREEN}http://localhost:5000${NC}\n"

echo -e "${YELLOW}Test Accounts (after seeding):${NC}"
echo -e "Admin:    ${GREEN}admin@test.com / admin123${NC}"
echo -e "Student:  ${GREEN}student1@test.com / student123${NC}\n"
