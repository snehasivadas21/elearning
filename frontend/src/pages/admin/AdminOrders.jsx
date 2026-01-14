import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { extractResults } from "../../api/api";

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const fetchOrders = async () => {
    const res = await axiosInstance.get("/admin/orders/", {
      params: {
        status: status || undefined,
        search: search || undefined,
      },
    });
    setOrders(extractResults(res));
  };

  useEffect(() => {
    fetchOrders();
  }, [status, search]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-600">All Orders</h2>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Search by email / username"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4 border px-3 py-2 rounded w-1/3"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="mb-4 border px-2 py-1 rounded"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
            <tr>
              <th className="p-3">Order ID</th>
              <th className="p-3">User</th>
              <th className="p-3">Course</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payment ID</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3">{o.order_id}</td>
                <td className="p-3">{o.user_email}</td>
                <td className="p-3">{o.course_title}</td>
                <td className="p-3">₹{o.amount}</td>

                <td className="p-3">
                  <span
                    className={`px-2 py-1 rounded text-xs ${
                      o.status === "completed"
                        ? "bg-green-100 text-green-700"
                        : o.status === "pending"
                        ? "bg-yellow-100 text-yellow-700"
                        : o.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {o.status}
                  </span>
                </td>

                <td className="p-3 text-xs">
                  {o.payment_id || "—"}
                </td>

                <td className="p-3">
                  {new Date(o.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
