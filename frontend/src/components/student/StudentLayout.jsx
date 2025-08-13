import StudentSidebar from './StudentSidebar'
import { Outlet } from 'react-router-dom'

const StudentLayout = () => {
  return (
    <div className='flex min-h-screen bg-gray-50'>
        <StudentSidebar/>
        <div className='flex-1 p-6 overflow-y-auto'>
            <Outlet/>
        </div>
      
    </div>
  )
}

export default StudentLayout