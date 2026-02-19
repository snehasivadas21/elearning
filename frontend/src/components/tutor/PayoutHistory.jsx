import { useState } from "react";
import Pagination from "../ui/Pagination";

const PAGE_SIZE = 5;

const PayoutHistory = ({ payouts }) => {
  const [page,setPage] = useState(1);

  const totalPages = Math.ceil(payouts.length / PAGE_SIZE);
  const paginated = payouts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Payment History</h2>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
            <tr>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {paginated.map(p => (
              <tr key={p.id}>
                <td className="px-6 py-4">₹ {p.amount}</td>
                <td className="px-6 py-4">{p.status}</td>
                <td className="px-6 py-4">{new Date(p.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={page} totalPages={totalPages} setPage={setPage} />
    </div>
  );
};

export default PayoutHistory;
