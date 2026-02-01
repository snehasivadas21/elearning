import { useState } from "react";
import { requestPayout } from "../../api/wallet";

const RequestPayoutModal = ({ balance, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (amount > balance) return alert("Insufficient balance");

    setLoading(true);
    await requestPayout(amount);
    setLoading(false);
    setAmount("");
    onSuccess();
  };

  return (
    <div className="mt-6 p-4 border rounded">
      <h3 className="font-semibold mb-2">Request Payout</h3>

      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        className="border p-2 mr-2"
        placeholder="Enter amount"
      />

      <button
        onClick={submit}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2"
      >
        Request
      </button>
    </div>
  );
};

export default RequestPayoutModal;
