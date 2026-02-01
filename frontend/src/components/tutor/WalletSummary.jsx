const WalletSummary = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
        <p className="text-sm text-gray-500">Available Balance</p>
        <h3 className="text-2xl font-bold text-gray-800 mt-2">₹ {summary.available_balance}</h3>
      </div>

      <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
        <p className="text-sm text-gray-500">Total Earned</p>
        <p className="text-2xl font-bold text-gray-800 mt-2">₹ {summary.total_earned}</p>
      </div>
    </div>
  );
};

export default WalletSummary;
