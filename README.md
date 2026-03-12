PyTech – AI Powered E-Learning Platform

PyTech is an end-to-end modern AI-integrated eLearning platform designed to deliver structured learning, interactive assessments, and intelligent assistance for students.

The platform allows instructors to create structured courses while learners track their progress through modules, lessons, quizzes, and AI-assisted learning tools.

PyTech focuses on practical learning workflows, progress tracking, and smart AI interaction within courses.

🌟 Vision

The vision of PyTech is to build a learning platform that goes beyond static courses by integrating:

📚 Structured learning paths

🧠 AI-assisted understanding

📊 Progress tracking and evaluation

🤝 Instructor–student interaction

The goal is to make learning more interactive, measurable, and intelligent.

🛠 Tech Stack
Frontend

⚛️ React.js

🎨 Tailwind CSS

🔗 Axios

📦 React Router

💬 WebSocket (real-time chat)

Backend

🐍 Django

⚡ Django REST Framework

🔐 JWT Authentication

🔄 Django Channels (WebSockets)

Database

🗄 PostgreSQL

AI / ML

🤖 Sentence Transformers

🧠 Vector Embeddings

📄 Context-based AI Chat for course documents

Payment Integration

💳 Razorpay Payment Gateway

Other Tools

🐳 Docker

📜 Logging system

📡 REST APIs

🔄 Git & GitHub

👥 User Roles
👨‍🎓 Student

Students can:

Register and login

Browse courses

Purchase courses

Track learning progress

Take quizzes

Earn certificates

Chat with AI assistant

Participate in community chat

👨‍🏫 Instructor

Instructors can:

Create courses

Add modules and lessons

Upload course materials

Create quizzes and assessments

Conduct live sessions

Monitor student progress

🛡 Admin

Admins manage the platform:

Approve or reject courses

Review instructor content updates

Manage users

Monitor payments

Maintain platform quality

⚙ Core Modules
🔐 Authentication System

Secure authentication with role-based access.

Features:

User registration

Login / Logout

JWT authentication

Role-based permissions

📚 Course Management

Instructors can create structured courses.

Structure:

Course
→ Modules
→ Lessons

Features:

Video lessons

Document materials

Course updates

Content approval workflow

📊 Course Progress Tracking

Tracks how students move through courses.

Features:

Lesson completion tracking

Module progress

Course completion status

Certificate eligibility

When a certificate is issued, the system freezes progress to prevent modification.

🧠 AI Learning Assistant

AI chatbot integrated inside lessons to help students understand course materials.

Features:

Ask questions about documents

Context-aware responses

Embedded chat interface

Document-based knowledge retrieval

💬 Community Chat

Students can communicate inside courses.

Features:

Real-time messaging

Course-based discussion

Instructor interaction

🧾 Quiz & Assessment System

Evaluate student learning progress.

Features:

Course quizzes

Attempt tracking

Pass / fail logic

📡 Live Sessions

Instructors can conduct interactive live classes.

Features:

Schedule sessions

Student participation

Real-time learning experience

💳 Payment System

Students can purchase courses.

Features:

Secure Razorpay integration

Course purchase tracking

Access control based on purchase

📁 Project Structure
pytech/
│
├── backend/
│   ├── users/
│   ├── courses/
│   ├── progress/
│   ├── quiz/
│   ├── payments/
│   ├── chat/
│   ├── ai/
│   └── livesessions/
│
├── frontend/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   └── utils/
│
├── docker/
├── requirements.txt
└── README.md
✨ Key Features

✔ AI-powered course assistant
✔ Structured course learning
✔ Real-time chat system
✔ Quiz and assessment engine
✔ Certificate generation
✔ Instructor course management
✔ Secure payment integration
✔ Course progress tracking

🚀 Future Improvements

Course recommendation system

Student analytics dashboard

👩‍💻 Author

Sneha
Full Stack Developer

Backend: Django / DRF

Frontend: React

Database: PostgreSQL

AI Integration

📄 License

This project is licensed under the MIT License.

⭐ If you find this project useful, feel free to star the repository.
