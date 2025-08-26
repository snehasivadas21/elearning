import { Outlet } from "react-router-dom";
import RecruiterSidebar from "../../components/recruiter/RecruiterSidebar";
import DashboardMetrics from "../../components/recruiter/DashboardMetrics";
import RecentApplications from "../../components/recruiter/RecentApplications";
import Analytics from "../../components/recruiter/Analytics";

export default function RecruiterDashboard() {
  return (
    <div className="flex">
      <RecruiterSidebar />
      <main className="flex-1 p-6 bg-gray-50 min-h-screen">
        <Outlet />
        <DashboardMetrics />
        <RecentApplications />
        <Analytics />
      </main>
    </div>
  );
}
