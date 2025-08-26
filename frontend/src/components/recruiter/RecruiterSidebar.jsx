import { Link,useLocation } from "react-router-dom";
import { Briefcase, User , FileText} from "lucide-react"

export default function RecruiterSidebar(){
    const location = useLocation();

    const links = [
        { path:"/recruiter/profile",label:"Profile",icon:<User size={20}/>},
        { path:"/recruiter/jobs",label:"Job Postings",icon:<Briefcase size={20}/>},
        { path:"/recruiter/applications",label:"Applications",icon:<FileText size={20}/>},
    ]

    return (
        <aside className="w-64 min-h-screen bg-white shadow-lg p-4">
            <h2 className="text-xl font-bold mb-6">Recruiter Dashboard</h2>
            <nav className="space-y-2">
                {links.map((link)=>(
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 ${
                        location.pathname === link.path ? "bg-gray-200 font-semibold":""
                      }`}
                    >
                        {link.icon} {link.label}
                    </Link>
                ))}

            </nav>
        </aside>
    )
}