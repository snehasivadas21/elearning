import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { extractResults } from "../../api/api";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Pagination from "../../components/ui/Pagination";

const MyPurchases = () => {
  const [orders, setOrders] = useState([]);
  const [page,setPage] = useState(1);
  const [count,setCount] = useState(0);
  const [retryingId, setRetryingId] = useState(null);

  const totalPages = Math.ceil(count / 10); 
  const navigate = useNavigate()

  useEffect(() => {
    const fetchOrders = async () => {
      const res = await axiosInstance.get("/payment/orders/",{params:{page}});
      setOrders(extractResults(res));
      setCount(res.data.count);
    };
    fetchOrders();
  }, [page]);

  const handleRetry = async (order) => {
    if (retryingId) return;
    try {
      setRetryingId(order.order_id);

      const res = await axiosInstance.post(
        "payment/retry-order/",
        { order_id: order.order_id }
      );

      const { key, amount, currency, razorpay_order_id } = res.data;

      const options = {
        key,
        amount,
        currency,
        name: "PyTech",
        description: order.course.title,
        order_id: razorpay_order_id,

        handler: async function (response) {
          try {
            await axiosInstance.post("payment/verify-payment/", {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            toast.success("Payment successful");
            navigate(`/student/mycourses/${order.course.id}`);
          } catch {
            toast.error("Payment verification failed");
          } finally {
            setRetryingId(null);
          }
        },
        modal:{
          ondismiss:()=>setRetryingId(null),
        }
      };

      new window.Razorpay(options).open();

    } catch (err) {
      console.error("Retry error:", err.response?.data); 
      toast.error(err.response?.data?.error || "Retry failed");
      setRetryingId(null);
    }
  };


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

                  {o.status !== "completed" && (
                    <button
                      disabled={retryingId === o.id}
                      onClick={() => handleRetry(o)}
                      className="px-3 py-1 bg-yellow-500 text-white rounded"
                    >
                      Retry Payment
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
      <Pagination
        page={page}
        totalPages={totalPages}
        setPage={setPage}
      />
    </div>
  );
};

export default MyPurchases;
