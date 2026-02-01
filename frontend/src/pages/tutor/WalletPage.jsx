import { useEffect, useState } from "react";
import {
  getWalletSummary,
  getWalletTransactions,
  getPayoutHistory
} from "../../api/wallet";

import WalletSummary from "../../components/tutor/WalletSummary";
import WalletTransactions from "../../components/tutor/WalletTransactions";
import RequestPayoutModal from "../../components/tutor/RequestPayoutModal";
import PayoutHistory from "../../components/tutor/PayoutHistory";

const WalletPage = () => {
  const [summary, setSummary] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);

  const loadData = async () => {
    const [s, t, p] = await Promise.all([
      getWalletSummary(),
      getWalletTransactions(),
      getPayoutHistory()
    ]);

    setSummary(s.data);
    setTransactions(t.data);
    setPayouts(p.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-600">Wallet</h2>
      </div>
      <WalletSummary summary={summary} />

      <RequestPayoutModal
        balance={summary.available_balance}
        onSuccess={loadData}
      />

      <WalletTransactions transactions={transactions} />
      <PayoutHistory payouts={payouts} />
    </div>
  );
};

export default WalletPage;
