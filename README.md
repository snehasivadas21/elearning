# PyTech – Full Stack E-Learning Platform

## 📌 Project Overview

**PyTech** is a full-stack e-learning platform designed to connect **students, instructors, and hiring managers**.
It supports course creation, learning progress tracking, live sessions, certification, and hiring workflows — all in one system.
An end-to-end eLearning platform designed not just to teach, but to align learning with real-world hiring needs.

This project follows **industry-standard architecture**, **role-based access**, and **scalable API design**.

## 🚀 Tech Stack

### **Frontend**

* React.js
* Tailwind CSS
* Figma (UI/UX Design)

### **Backend**

* Django
* Django REST Framework
* JWT Authentication

### **Database**

* PostgreSQL

### **Other Tools**

* Postman (API Documentation & Mock Server)
* GitHub (Version Control)


## 👥 User Roles

| Role                    | Description                                                   |
| ----------------------- | ------------------------------------------------------------- |
| **Admin**               | Manages users, courses, analytics, and platform settings      |
| **Instructor**          | Creates courses, lessons, and live sessions          |
| **Student**             | Enrolls in courses, learns, earns certificates |
| **HR / Hiring Manager** | Filters candidates, views profiles, hiring analytics          |


## 🧩 Core Modules

### ✅ Authentication Module

* Signup / Login
* Role-based access
* Forgot & Reset Password
* JWT-based authentication

### ✅ Course Management

* Course creation & updates
* Category management
* Lesson & module builder
* Course approval workflow

### ✅ Learning Module

* Video & text lessons
* Progress tracking
* Certificates on completion

### ✅ Payment Module

* Course purchase
* Order management
* Payment status tracking

### ✅ Live Session Module

* Live video sessions
* Chat & reactions
* Attendance tracking
* Session recordings

### ✅ HR & Hiring Module

* Talent pool access
* Filter by skills & experience
* Resume & profile view
* Hiring workflow (shortlist → hire)

### ✅ Admin Dashboard

* User analytics
* Revenue tracking
* Course performance
* Platform monitoring

## 🧱 Database Design

The project uses a **normalized relational schema** including:

* Users & Profiles
* Courses, Lessons
* Enrollments & Progress
* Payments & Certificates
* Live Sessions & Chats
* HR Hiring Modules

## 📡 API Documentation

* API documented using **Postman**
* Includes:

  * Request & Response examples
  * Status codes
  * Mock server usage
* Follows **RESTful standards**


## 📂 Project Structure (High Level)

```
pytech/
├── backend/
│   ├── users/
│   ├── courses/
│   ├── payments/
│   ├── live_sessions/
│   ├── hr/
│   └── admin-panel/
├── frontend/
│   ├── components/
│   ├── pages/
│   └── services/
└── docs/

🔄 Development Workflow

1. Design UI in Figma
2. Plan API structure (Postman)
3. Implement backend APIs
4. Connect frontend
5. Test & refine

📌 Current Status

✅ API design completed
✅ Database schema finalized
✅ Postman documentation ready
⏳ Backend & frontend implementation in progress

🧠 Future Enhancements

* AI-powered course recommendations
* Resume scoring system
* Real-time interview scheduling
* Advanced analytics dashboard

👤 Author

Sneha
Full Stack Developer
Project: PyTech – Smart Learning Platform

📄 License

This project is for educational and demonstration purposes.

✨ Built with passion to create a smart learning ecosystem.
