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
import ForgotPasswordPage from "./pages/user/ForgetPasswordPage";
import ResetPasswordPage from "./pages/user/ResetPasswordPage";
import Dashboard from "./pages/student/Dashboard";
import NotFound from "./pages/user/NotFound";
import CourseListPage from "./pages/user/Courses";
import UserCourseDetail from "./pages/user/UserCourseDetail";
import About from "./pages/user/About"
import MyCourses from "./pages/student/MyCourses";
import StudentCourseDetail from "./pages/student/StudentCourseDetail";
import StudentProfile from "./pages/student/StudentProfile"
import MyPurchases from "./pages/student/MyPurchases";
import ChatPage from "./pages/student/ChatPage"
import LiveSessionPage from "./pages/live/LiveSessionPage";
import LiveWaitingPage from "./pages/live/LiveWaitingPage";
import CertificatePage from "./pages/student/CertificatePage";

// Admin
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminTutors from "./pages/admin/AdminTutors";
import AdminCourses from "./pages/admin/AdminCourses";
import AdminCourseDetail from "./pages/admin/AdminCourseDetail";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminRevenuePage from "./pages/admin/AdminRevenuePage";
import AdminPayoutPage from "./pages/admin/AdminPayoutPage";
import AdminPlatformCommissionPage from "./pages/admin/AdminPlatformCommissionPage";

// Tutor
import TutorLayout from "./components/tutor/TutorLayout";
import TutorDashboard from "./pages/tutor/TutorDashboard";
import TutorCourses from "./pages/tutor/TutorCourses";
import TutorCoursesContent from "./pages/tutor/TutorCoursesContent";
import TutorCourseDetail from "./pages/tutor/TutorCourseDetail";
import TutorOrders from "./pages/tutor/TutorOrders";
import InstructorLiveListPage from "./pages/tutor/InstructorLiveListPage";
import WalletPage from "./pages/tutor/WalletPage";

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
        <Route path = "/courses/:id" element={<UserCourseDetail/>}/> 
        <Route path="/about" element={<About/>} />

        {/* Protected Dashboard */}
        <Route path="/student" element={
          <PrivateRoute>
            <StudentLayout/>
          </PrivateRoute>
        }>
          <Route path="dashboard" element={<Dashboard/>}/>
          <Route path="mycourses" element={<MyCourses/>}/>
          <Route path="mycourses/:id" element={<StudentCourseDetail/>}/>
          <Route path="myprofile" element={<StudentProfile/>} />
          <Route path="mypurchase" element={<MyPurchases/>}/>
          <Route path="chat/:courseId" element={<ChatPage/>}/>
          <Route path="mycourses" element={<MyCourses/>}/>
          <Route path="mycourses/:id" element={<StudentCourseDetail/>}/>
          <Route path="myprofile" element={<StudentProfile/>} />
          <Route path="mypurchase" element={<MyPurchases/>}/>
          <Route path="chat/:id" element={<ChatPage/>}/>
          <Route path="live/:id" element={<LiveSessionPage />} />
          <Route path="live/:id/wait" element={<LiveWaitingPage />} />
          <Route path="certificate" element={<CertificatePage/>}/>
        </Route>
      </Route>

      {/* Auth Pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/check-email" element={<CheckEmail/>}/>
      <Route path="/verify-email" element={<VerifyEmail />} />
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
        <Route path="courses/:id" element={<AdminCourseDetail />}/>
        <Route path="categories" element={<AdminCategories />} />
        <Route path="orders" element={<AdminOrders/>}/>
        <Route path="payouts" element={<AdminPayoutPage/>}/>
        <Route path="revenue" element={<AdminRevenuePage/>}/>
        <Route path="transactions" element={<AdminPlatformCommissionPage/>}/>
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
        <Route path="courses/:id" element={<TutorCourseDetail />}/>
        <Route path="profile" element={<StudentProfile/>} />
        <Route path="orders" element={<TutorOrders/>}/>
        <Route path="chat/:courseId" element={<ChatPage/>}/>
        <Route path="courses/:id" element={<TutorCourseDetail />}/>
        <Route path="profile" element={<StudentProfile/>} />
        <Route path="orders" element={<TutorOrders/>}/>
        <Route path="chat" element={<ChatPage/>}/>
        <Route path="live" element={<InstructorLiveListPage/>}/>
        <Route path="live/:id/wait" element={<LiveWaitingPage />} />
        <Route path="live/:id" element={<LiveSessionPage />} />
        <Route path="wallet" element={<WalletPage/>}/>
      </Route>

      {/* Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    <ToastContainer position="top-right" autoClose={3000}/>
  </>  
  );
}

export default App;