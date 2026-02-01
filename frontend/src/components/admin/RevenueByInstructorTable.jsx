const RevenueByInstructorTable = ({ data }) => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Revenue by Instructor</h2>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
            <tr>
              <th className="px-6 py-3">Instructor</th>
              <th className="px-6 py-3">Total Earned</th>
              <th className="px-6 py-3">Paid</th>
              <th className="px-6 py-3">Pending</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.map((row) => (
              <tr key={row.instructor_id}>
                <td className="px-6 py-4">{row.instructor_name}</td>
                <td className="px-6 py-4">₹{row.total_earned}</td>
                <td className="px-6 py-4">₹{row.paid_amount}</td>
                <td className="px-6 py-4">₹{row.pending_amount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RevenueByInstructorTable;
