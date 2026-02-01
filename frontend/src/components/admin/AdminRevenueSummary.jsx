const AdminRevenueSummary = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      
      {/* Total Revenue */}
      <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
        <p className="text-sm text-gray-500">💰 Total Revenue</p>
        <h3 className="text-2xl font-bold text-gray-800 mt-2">
          ₹{data.total_amount}
        </h3>
      </div>

      {/* Platform Commission */}
      <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
        <p className="text-sm text-gray-500">🏦 Platform Commission</p>
        <h3 className="text-2xl font-bold text-gray-800 mt-2">
          ₹{data.commission_amount}
        </h3>
      </div>

      {/* Instructor Earnings */}
      <div className="bg-white rounded-xl shadow p-5 border-l-4 border-purple-500">
        <p className="text-sm text-gray-500">👨‍🏫 Instructor Earnings</p>
        <h3 className="text-2xl font-bold text-gray-800 mt-2">
          ₹{data.instructor_earnings}
        </h3>
      </div>

    </div>
  );
};

export default AdminRevenueSummary;
