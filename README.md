# 🚀 PyTech – AI Powered E-Learning Platform

**PyTech** is a modern **AI-integrated eLearning platform** built using **React and Django** that enables instructors to create structured learning experiences while students learn through **modules, lessons, quizzes, and AI-assisted support**.

The platform focuses on **interactive learning, progress tracking, and intelligent AI assistance** to enhance the learning experience.

---

# 🌟 Vision

PyTech aims to go beyond traditional eLearning platforms by combining:

* 📚 **Structured Learning Paths**
* 🧠 **AI-Assisted Learning**
* 📊 **Progress Tracking & Evaluation**
* 🤝 **Instructor–Student Interaction**

The goal is to make **learning interactive, measurable, and intelligent**.

---

# 🛠 Tech Stack

## Frontend

* ⚛️ **React.js**
* 🎨 **Tailwind CSS**
* 🔗 **Axios**
* 📦 **React Router**
* 💬 **WebSocket (Real-time chat)**

## Backend

* 🐍 **Django**
* ⚡ **Django REST Framework**
* 🔐 **JWT Authentication**
* 🔄 **Django Channels (WebSockets)**

## Database

* 🗄 **PostgreSQL**

## AI / ML

* 🤖 **Sentence Transformers**
* 🧠 **Vector Embeddings**
* 📄 **Context-based AI chat for course documents**

## Payment Integration

* 💳 **Razorpay Payment Gateway**

## Other Tools

* 🐳 **Docker**
* 📜 **Logging System**
* 📡 **REST APIs**
* 🔄 **Git & GitHub**

---

# 👥 User Roles

| Role                 | Description                                                                               |
| -------------------- | ----------------------------------------------------------------------------------------- |
| 👨‍🎓 **Student**    | Learn courses, track progress, attempt quizzes, interact with AI tutor, earn certificates |
| 👨‍🏫 **Instructor** | Create courses, manage modules and lessons, create quizzes, conduct live sessions         |
| 🛡 **Admin**         | Review courses, approve or reject content, manage users, monitor platform activity        |

---

# ⚙ Core Modules

## 🔐 Authentication System

Secure user authentication with **role-based access control**.

**Features**

* User registration
* Login / Logout
* JWT authentication
* Role-based permissions

---

## 📚 Course Management

Course structure:

Course
└── Modules
  └── Lessons

**Features**

* Video lessons
* Document resources
* Course approval workflow
* Instructor course management

---

## 📊 Course Progress Tracking

Tracks student learning progress across **lessons and modules**.

**Features**

* Lesson completion tracking
* Module progress tracking
* Course completion detection
* Certificate eligibility

Once a **certificate is issued**, progress is **frozen** to maintain course completion integrity.

---

## 🧠 AI Learning Assistant

An **AI chatbot integrated into course lessons** to assist students during learning.

**Features**

* Ask questions related to course documents
* Context-aware AI responses
* Embedded learning assistant
* Document-based knowledge retrieval

---

## 💬 Community Chat

Students can communicate within courses.

**Features**

* Real-time messaging
* Course-based discussions
* Instructor interaction
* Media message support

---

## 🧾 Quiz & Assessment System

Evaluate student knowledge through **structured assessments**.

**Features**

* Course quizzes
* Attempt tracking
* Pass / Fail logic
* Assessment validation

---

## 📡 Live Sessions

Instructors can conduct **interactive live classes**.

**Features**

* Schedule live sessions
* Student participation
* Real-time learning experience

---

## 💳 Payment System

Students can purchase courses through **secure payment integration**.

**Features**

* Razorpay payment gateway
* Course purchase tracking
* Access control based on enrollment

---

# 📁 Project Structure

```
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
```

---

# ✨ Key Features

✔ **AI-powered course assistant**
✔ **Structured learning modules**
✔ **Real-time course chat system**
✔ **Quiz & assessment engine**
✔ **Certificate generation system**
✔ **Instructor course management**
✔ **Secure payment integration**
✔ **Course progress tracking**

---

# ⚙ Installation (Local Setup)

## Clone Repository

```
git clone https://github.com/your-username/pytech.git
cd pytech
```

---

## Backend Setup

```
cd backend

python -m venv venv
source venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

---

## Frontend Setup

```
cd frontend

npm install
npm run dev
```

---

# 🚀 Deployment

Deployment instructions are available in:

**DEPLOYMENT.md**

This document contains **production setup, server configuration, and CI/CD workflow**.

---

# 🚀 Future Improvements

* Course recommendation system
* Student analytics dashboard
* AI-generated quizzes
* Advanced learning analytics

---

# 👩‍💻 Author

**Sneha**
Full Stack Developer

### Tech Expertise

**Backend:** Django / DRF
**Frontend:** React
**Database:** PostgreSQL
**AI Integration:** Vector Embeddings & NLP

---

# 📄 License

This project is licensed under the **MIT License**.

---

⭐ If you find this project useful, consider **starring the repository**.
