import { useState } from "react";
import Pagination from "../ui/Pagination";

const PAGE_SIZE = 5;

const RevenueByCourseTable = ({ data }) => {
  const [page,setPage] = useState(1)

  const totalPages = Math.ceil(data.length / PAGE_SIZE);
  const paginated = data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Revenue by Course</h2>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
            <tr>
              <th className="px-6 py-3">Course</th>
              <th className="px-6 py-3">Instructor</th>
              <th className="px-6 py-3">Sales</th>
              <th className="px-6 py-3">Revenue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.map((row) => (
              <tr key={row.course_id}>
                <td className="px-6 py-4">{row.course_title}</td>
                <td className="px-6 py-4">{row.instructor_name}</td>
                <td className="px-6 py-4">{row.sales_count}</td>
                <td className="px-6 py-4">₹{row.total_amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  );
};

export default RevenueByCourseTable;
