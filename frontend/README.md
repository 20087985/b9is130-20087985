Campus Club Event & Attendance Manager

A web application for managing student society/club events, seat availability, event registration, and role-based event administration.

Live Deployment & Repository Links

**Frontend (Live):** `https://b9is130-20087985.vercel.app/`
**Backend API (Render):** `https://b9is130-20087985-backend.onrender.com`
**GitHub Repository:** `https://github.com/20087985/b9is130-20087985`


Local Setup and Running
 To run backend - cd backend and node server.js
To run frontend - cd frontend and npm run dev

To run test 
For backend test - npm test
For frontend test - npm test


Features

**Authentication & Role-Based Access Control (RBAC):**
   User registration and login with JWT authentication.
   Self-registration assigns the default 'student' role;
**Event Browsing & Search:**
  View upcoming campus events with club name, date, location, seat capacity, remaining spots, and description.
  Search events by title or club name.
**Student Event Registration:**
  Students can register for available events while seat capacity remains open; full events display capacity status.
**Admin Event Management:**
  Admins can create new events (+ Create Event), edit existing event details/capacity, and delete events (Edit and Delete actions), without seeing the student Register Now button.

Tech Stack

**Frontend:** React (Vite), JavaScript, HTML/CSS
**Backend:** Node.js, Express, Mongoose, JSON Web Tokens (JWT)
**Database:** MongoDB Atlas (test database)
**Testing:** Automated unit/component tests
**Hosting:** Render (Backend Web Service, main branch auto-deploy) and Vercel/Frontend

Environment Variables

Backend (.env / Render Environment)
PORT=5000
MONGO_URI='https://cloud.mongodb.com/v2/6ad7507d12bfb6ee199b5610#/explorer/6ad75316c040fa73eed61cf6/test/users/find'
