import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { extractResults } from "../../api/api";

const MyPurchases = () => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await axiosInstance.get("/payment/orders/");
      setOrders(extractResults(res));
    };
    fetchOrders();
  }, []);

  const downloadInvoice = async (invoiceId) => {
    if (!invoiceId) return;

    const res = await axiosInstance.get(
      `/payment/invoices/${invoiceId}/download/`,
      { responseType: "blob" }
    );

    const blob = new Blob([res.data], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `invoice-${invoiceId}.pdf`;
    a.click();

    URL.revokeObjectURL(url);
  };

  if (!orders.length) {
    return <p className="p-6 text-gray-500">No purchases found</p>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-purple-600">My Purchase</h2>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 text-left text-sm font-semibold text-gray-600">
            <tr>
              <th className="p-3">Course</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
              <th className="p-3">Invoice</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {orders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3">{o.course_title}</td>
                <td className="p-3">₹{o.amount}</td>

                <td className="p-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    o.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : o.status === "pending"
                      ? "bg-yellow-100 text-yellow-700"
                      : "bg-red-100 text-red-700"
                  }`}>
                    {o.status}
                  </span>
                </td>

                <td className="p-3">
                  {new Date(o.created_at).toLocaleDateString()}
                </td>

                <td className="p-3">
                  {o.invoice_number || "—"}
                </td>

                <td className="p-3 space-x-2">
                  {o.status === "completed" && o.invoice_id && (
                    <button
                      onClick={() => downloadInvoice(o.invoice_id)}
                      className="bg-indigo-600 text-white px-3 py-1 rounded"
                    >
                      Download
                    </button>
                  )}

                  {o.status === "pending" && (
                    <button className="bg-yellow-500 text-white px-3 py-1 rounded">
                      Retry
                    </button>
                  )}

                  {o.status === "failed" && (
                    <span className="text-red-600 text-xs">
                      Failed
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
};

export default MyPurchases;
