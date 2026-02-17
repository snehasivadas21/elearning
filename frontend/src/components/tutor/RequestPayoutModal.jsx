import { useState } from "react";
import { requestPayout } from "../../api/wallet";
import { toast } from "react-toastify";

const RequestPayoutModal = ({ balance, onSuccess }) => {
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Safe balance handling
  const withdrawable = balance?.withdrawable_balance ?? 0;
  const availableBalance = balance?.available_balance ?? 0;  
  const pendingBalance = balance?.pending_balance ?? 0;

  const submit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error("Enter valid amount");
      return;
    }

    if (Number(amount) > Number(withdrawable)) {
      toast.error(`Insufficient balance. You can withdraw ₹${withdrawable}`);
      return;
    }

    if (!upiId.trim() && !(accountHolder.trim() && accountNumber.trim() && ifsc.trim())) {
      toast.error("Provide UPI or complete Bank details");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        amount: Number(amount),
      };

      if (upiId.trim()) payload.upi_id = upiId.trim();
      if (accountHolder.trim()) payload.account_holder_name = accountHolder.trim();
      if (accountNumber.trim()) payload.account_number = accountNumber.trim();
      if (ifsc.trim()) payload.ifsc_code = ifsc.trim();

      await requestPayout(payload);

      toast.success("Payout request submitted");

      // reset fields
      setAmount("");
      setUpiId("");
      setAccountHolder("");
      setAccountNumber("");
      setIfsc("");

      if (onSuccess) {
        onSuccess();
      } 

    } catch (err) {
      const errorMsg =
        err.response?.data?.detail ||
        err.response?.data?.error ||
        err.response?.data?.payment?.[0] ||
        "Payout failed";

      toast.error(errorMsg);
      console.error("Payout error:", err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 p-3 border rounded-lg space-y-3 max-w-md">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">Request Payout</h3>
        <div className="text-right">
          <p className="text-xs text-gray-500">Withdrawable Balance</p>
          <p className="text-lg font-bold">
            ₹ {withdrawable}
          </p>
        </div>
      </div>

      <input
        type="number"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="border rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder={`Enter amount (Max: ₹${withdrawable})`}
      />

      <div className="border-t pt-3">
        <p className="text-xs font-medium mb-2 text-gray-700">
          Payment Details
        </p>

        <input
          type="text"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value)}
          className="border rounded px-3 py-2 w-full text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="UPI ID (optional)"
        />

        <p className="text-center text-xs text-gray-500 my-1">OR</p>

        <input
          type="text"
          value={accountHolder}
          onChange={(e) => setAccountHolder(e.target.value)}
          className="border rounded px-3 py-2 w-full text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Account Holder Name"
        />

        <input
          type="text"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value)}
          className="border rounded px-3 py-2 w-full text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Account Number"
        />

        <input
          type="text"
          value={ifsc}
          onChange={(e) => setIfsc(e.target.value)}
          className="border rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="IFSC Code"
        />
      </div>

      <button
        onClick={submit}
        disabled={loading}
        className={`px-4 py-2 w-full text-white font-medium rounded ${
          loading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {loading ? "Processing..." : "Request Payout"}
      </button>

      {pendingBalance > 0 && (
        <p className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
          ℹ️ You have ₹{pendingBalance} in pending withdrawal requests
        </p>
      )}
    </div>
  );
};

export default RequestPayoutModal;
