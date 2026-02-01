import { useEffect, useState } from "react";
import { getAdminPayouts, markPayoutPaid } from "../../api/adminRevenue";

const AdminPayoutPage = () => {
  const [payouts, setPayouts] = useState([]);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  const loadPayouts = async () => {
    let res;

    if (status === "PENDING") {
      res = await getAdminPayouts("PENDING");
    } else if (status === "PAID" || status === "REJECTED") {
      res = await getAdminPayouts("history");
    } else {
      const pending = await getAdminPayouts("PENDING");
      const history = await getAdminPayouts("history");
      res = { data: [...pending.data, ...history.data] };
    }

    setPayouts(res.data);
  };

  useEffect(() => {
    loadPayouts();
  }, [status]);

  const handleMarkPaid = async (id) => {
    if (!window.confirm("Mark payout as PAID?")) return;
    await markPayoutPaid(id);
    loadPayouts();
  };

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
                <td className="px-6 py-4">{p.status}</td>
                <td className="px-6 py-4">{p.created_at}</td>
                <td className="px-6 py-4">
                  {p.status === "PENDING" && (
                    <button onClick={() => handleMarkPaid(p.id)}>
                      Mark Paid
                    </button>
                  )}
                  {p.status !== "PENDING" && "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPayoutPage;
