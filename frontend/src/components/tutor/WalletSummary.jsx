const WalletSummary = ({ summary }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      
      <div className="bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
        <p className="text-sm text-gray-500">Total Earned</p>
        <h3 className="text-2xl font-bold text-gray-800 mt-2">
          ₹ {summary.total_earned || 0}
        </h3>
      </div>

      
      <div className="bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
        <p className="text-sm text-gray-500">Available Balance</p>
        <h3 className="text-2xl font-bold text-gray-800 mt-2">
          ₹ {summary.available_balance || 0}
        </h3>
      </div>

      
      <div className="bg-white rounded-xl shadow p-5 border-l-4 border-yellow-500">
        <p className="text-sm text-gray-500">Pending Withdrawals</p>
        <h3 className="text-2xl font-bold text-gray-800 mt-2">
          ₹ {summary.pending_balance || 0}
        </h3>
      </div>

      
      <div className="bg-white rounded-xl shadow p-5 border-l-4 border-purple-500">
        <p className="text-sm text-gray-500 flex items-center gap-1">
          Withdrawable Balance
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
            You can withdraw
          </span>
        </p>
        <h3 className="text-2xl font-bold text-gray-800 mt-2">
          ₹ {summary.withdrawable_balance || 0}
        </h3>
      </div>
    </div>
  );
};

export default WalletSummary;