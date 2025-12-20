import { Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Layouts & Pages
import Layout from "./components/user/Layout";
import Home from "./pages/user/Home";
import Login from "./pages/user/Login";
import Register from "./pages/user/Register";
import CheckEmail from "./pages/user/CheckEmail";
import VerifyEmail from "./pages/user/VerifyEmail";
import GoogleCallback from "./pages/user/GoogleCallback";
import ForgotPasswordPage from "./pages/user/ForgetPasswordPage";
import ResetPasswordPage from "./pages/user/ResetPasswordPage";
import Dashboard from "./pages/student/Dashboard";
import NotFound from "./pages/user/NotFound";
import CourseListPage from "./pages/user/Courses";
import CourseDetailPage from "./pages/user/CourseDetailPage";
import About from "./pages/user/About"
import MyCourse from "./pages/student/MyCourses"
import StudentProfile from "./pages/student/StudentProfile"
import StudentQuiz from "./pages/student/StudentQuiz"
import ChatPage from "./pages/student/ChatPage"
import LiveSessionPage from "./pages/tutor/LiveSessionPage";
import CertificatePage from "./pages/student/CertificatePage";

// Admin
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminTutors from "./pages/admin/AdminTutors";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCategories from "./pages/admin/AdminCategories";
import CourseReviewPage from "./pages/admin/AdminCourseReview";

// Tutor
import TutorLayout from "./components/tutor/TutorLayout";
import TutorDashboard from "./pages/tutor/TutorDashboard";
import TutorCourses from "./pages/tutor/TutorCourses";
import TutorCoursesContent from "./pages/tutor/TutorCoursesContent";

// Routes
import PrivateRoute from "./routes/PrivateRoute";
import RoleRoute from "./routes/RoleRoute";
import StudentLayout from "./components/student/StudentLayout";

function App() {
  return (
  <>
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path = "/courses" element={<CourseListPage/>}/>
        <Route path = "/courses/:id" element={<CourseDetailPage/>}/>
        <Route path="/about" element={<About/>} />

        {/* Protected Dashboard */}
        <Route path="/student" element={
          <PrivateRoute>
            <StudentLayout/>
          </PrivateRoute>
        }>
          <Route path="dashboard" element={<Dashboard/>}/>
          <Route path="courses" element={<MyCourse/>}/>
          <Route path="profile" element={<StudentProfile/>} />
          <Route path="quizzes" element={<StudentQuiz/>} />
          <Route path="chat/:courseId" element={<ChatPage/>}/>
          <Route path="live-session/:sessionId" element={<LiveSessionPage />} />
          <Route path="certificate" element={<CertificatePage/>}/>
        </Route>
      </Route>

      {/* Auth Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/check-email" element={<CheckEmail/>}/>
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/google/callback" element={<GoogleCallback />} />
      <Route path="/forget-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage/>}/>

      {/* Admin Section */}
      <Route path="/admin" element={
        <RoleRoute allowedRoles={['admin']}>
          <AdminLayout />
        </RoleRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="instructors" element={<AdminTutors />} />
        <Route path="courses" element={<AdminCourses />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="courses/:courseId/review" element={<CourseReviewPage />} />
      </Route>

      {/* Tutor Section */}
      <Route path="/tutor" element={
        <RoleRoute allowedRoles={['instructor']}>
          <TutorLayout />
        </RoleRoute>
      }>
        <Route index element={<TutorDashboard />} />
        <Route path="dashboard" element={<TutorDashboard />} />
        <Route path="courses" element={<TutorCourses />} />
        <Route path="courses/:id/content" element={<TutorCoursesContent/>}/>
        <Route path="chat/:courseId" element={<ChatPage/>}/>
      </Route>

      {/* Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    <ToastContainer position="top-right" autoClose={3000}/>
  </>  
  );
}

export default App;