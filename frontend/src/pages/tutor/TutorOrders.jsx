import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { extractResults } from "../../api/api";
import Pagination from "../../components/ui/Pagination";

const TutorOrders = () => {
  const [orders, setOrders] = useState([]);
  const [search,setSearch] = useState("");
  const [page,setPage] = useState(1);
  const [count,setCount] = useState(0);

  const totalPages = Math.ceil(count / 10); 

  const fetchOrders = async () => {
    try {
      const res = await axiosInstance.get(`/tutor/orders/`,{
        params:{
          search:search || undefined,
          page,
        }
      });
      setOrders(extractResults(res));
      setCount(res.data.count)
    } catch (err) {
      console.error("Failed to load tutor orders", err);
    }
  };

  useEffect(() => {
    fetchOrders();
  },[search,page]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-600">All Orders</h2>
      </div>

      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by email / course"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 border px-3 py-2 rounded w-1/3"
        />
      </div>  

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
            <tr>
              <th className="p-3">Course</th>
              <th className="p-3">Student</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.id} className="border-t">
                <td className="p-3">{order.course_title}</td>
                <td className="p-3">{order.student_email}</td>
                <td className="p-3">₹{order.amount}</td>
                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      order.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {order.status}
                  </span>
                </td>
                <td className="p-3">
                  {new Date(order.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        setPage={setPage}
      />
    </div>
  );
};

export default TutorOrders;
