import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

const AdminPlatformCommissionPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/revenue/admin/revenue/transactions/")
      .then(res => {
        setTransactions(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load commission transactions", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-6">Loading transactions...</p>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-purple-600">
          Platform Commission
        </h2>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-sm font-semibold text-gray-600">
            <tr>
              <th className="px-6 py-3">Order ID</th>
              <th className="px-6 py-3">Course</th>
              <th className="px-6 py-3">Instructor</th>
              <th className="px-6 py-3">Total Amount</th>
              <th className="px-6 py-3">Commission</th>
              <th className="px-6 py-3">Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {transactions.map(tx => (
              <tr key={tx.order_id}>
                <td className="px-6 py-4 font-medium">
                  #{tx.order_id}
                </td>

                <td className="px-6 py-4">
                  {tx.course_title}
                </td>

                <td className="px-6 py-4">
                  {tx.instructor}
                </td>

                <td className="px-6 py-4">
                  ₹ {tx.total_amount}
                </td>

                <td className="px-6 py-4 text-black-600 font-medium">
                  ₹ {tx.commission_amount}
                </td>

                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(tx.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPlatformCommissionPage;
