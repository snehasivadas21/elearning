const WalletTransactions = ({ transactions }) => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Transactions</h2>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
            <tr>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Amount</th>
              <th className="px-6 py-3">Reference</th>
              <th className="px-6 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map(tx => (
              <tr key={tx.id}>
                <td className={tx.type === "credit" ? "text-green-600" : "text-red-600"}>
                  {tx.type}
                </td>
                <td className="px-6 py-4">₹ {tx.amount}</td>
                <td className="px-6 py-4">{tx.reference}</td>
                <td className="px-6 py-4">{new Date(tx.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default WalletTransactions;
