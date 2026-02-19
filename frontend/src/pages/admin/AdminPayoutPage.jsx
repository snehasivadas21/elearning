import { useEffect, useState } from "react";
import { getAdminPayouts, markPayoutPaid, markPayoutReject } from "../../api/adminRevenue";
import { toast } from "react-toastify";
import Pagination from "../../components/ui/Pagination";

const AdminPayoutPage = () => {
  const [payouts, setPayouts] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  const totalPages = Math.ceil(count / 9);

  const loadPayouts = async () => {
    try {
      const res = await getAdminPayouts(status, page);
      setPayouts(res.data.results);   // paginated response uses `results`
      setCount(res.data.count);
    } catch {
      toast.error("Failed to load payouts");
      setPayouts([]);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [status]);

  useEffect(() => {
    loadPayouts();
  }, [status,page]);

  const handleMarkPaid = async (id) => {
    try {
      await markPayoutPaid(id);
      toast.success("Payout marked as PAID");
      loadPayouts();
    } catch {
      toast.error("Failed to mark payout as PAID");
    }
  };

  const handleReject = async (id) => {
    try {
      await markPayoutReject(id);
      toast.success("Payout rejected and refunded");
      loadPayouts();
    } catch {
      toast.error("Failed to reject payout");
    }
  }

  const filteredPayouts = payouts.filter((p) =>
    p.instructor_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-600">Payout Management</h2>
      </div>

      <input
        type="text"
        placeholder="Search instructor..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 border px-3 py-2 rounded w-1/3"
      />
      
      <select 
        value={status} 
        className="ml-2 border px-2 py-1 rounded"
        onChange={(e) => setStatus(e.target.value)}
      >
        <option value="">All</option>
        <option value="PENDING">Pending</option>
        <option value="PAID">Paid</option>
        <option value="REJECTED">Rejected</option>
      </select>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
            <tr>
              <th className="px-6 py-3">ID</th>
              <th className="px-6 py-3">Instructor</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Payment Type</th>
              <th className="px-6 py-3">Payment Details</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Requested At</th>
              <th className="px-6 py-3">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {filteredPayouts.map((p,index) => (
              <tr key={p.id} className="border-t">
                <td className="px-6 py-4">{index+1}</td>
                <td className="px-6 py-4">{p.instructor_name}</td>
                <td className="px-6 py-4">₹{p.amount}</td>
                <td className="px-6 py-4">
                  {p.payment_type === "UPI" && (
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                      UPI
                    </span>
                  )}
                  {p.payment_type === "BANK" && (
                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">
                      BANK
                    </span>
                  )}
                  {!p.payment_type && (
                    <span className="text-gray-400 text-xs">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm">
                  {p.payment_type === "UPI" && p.payment_details?.upi_id}

                  {p.payment_type === "BANK" && (
                    <div>
                      <div>{p.payment_details?.account_holder_name}</div>
                      <div>{p.payment_details?.account_number}</div>
                      <div className="text-xs text-gray-500">
                        {p.payment_details?.ifsc_code}
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">{p.status}</td>
                <td className="px-6 py-4">{p.created_at}</td>
                <td className="px-6 py-4 space-x-2">
                  {p.status === "PENDING" && (
                    <>
                      <button
                        onClick={() => handleMarkPaid(p.id)}
                        className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Mark Paid
                      </button>

                      <button
                        onClick={() => handleReject(p.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {(p.status === "PAID" || p.status === "REJECTED") && (
                    <span className="text-gray-500 text-sm">—</span>
                  )}
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

export default AdminPayoutPage;
