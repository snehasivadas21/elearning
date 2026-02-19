import { useEffect, useState } from "react";
import axiosInstance from "../../api/axiosInstance";
import { toast } from "react-toastify";

const CourseReviews = ({ courseId }) => {
  const [reviews, setReviews] = useState([]);
  const [status, setStatus] = useState(null);
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchReviews();
    fetchReviewStatus();
  }, [courseId]);

  const fetchReviews = async () => {
    try {
      const res = await axiosInstance.get(`/reviews/?course=${courseId}`);
      setReviews(res.data.results ?? []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const fetchReviewStatus = async () => {
    try {
      const res = await axiosInstance.get(
        `/reviews/review_status/?course=${courseId}`
      );
      setStatus(res.data);

      if (res.data.review) {
        setRating(String(res.data.review.rating)); 
        setComment(res.data.review.comment || "");
      } else {
        
        setRating("");
        setComment("");
      }
    } catch (error) {
      console.error("Error fetching review status:", error);
      setStatus(null);
    }
  };

  const submitReview = async () => {
    if (!rating || rating === "") {
      toast.error("Please select a rating");
      return;
    }

    setLoading(true);
    try {
      if (status?.has_reviewed) {
       
        await axiosInstance.patch(
          `/reviews/${status.review.id}/`,
          { rating: Number(rating), comment }
        );
        toast.success("Review updated successfully!");
      } else {
        await axiosInstance.post(`/reviews/`, {
          course: courseId,
          rating: Number(rating),
          comment,
        });
        toast.success("Review submitted successfully!");
      }
      await fetchReviews();
      await fetchReviewStatus();
      
    } catch (error) {
      console.error("Error submitting review:", error);
      const errorMsg = error.response?.data?.detail || 
                      error.response?.data?.rating?.[0] ||
                      error.response?.data?.comment?.[0] ||
                      "Failed to submit review";
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async () => {
    setLoading(true);
    try {
      await axiosInstance.delete(`/reviews/${status.review.id}/`);
      toast.success("Review deleted successfully!");
      
      setRating("");
      setComment("");
      
      await fetchReviews();
      await fetchReviewStatus();
      
    } catch (error) {
      console.error("Error deleting review:", error);
      toast.error("Failed to delete review. Please try again.");
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="relative">
      <h2 className="text-lg font-bold mb-4">Reviews</h2>

      {status?.can_review && (
        <div className="border p-4 rounded mb-6 bg-gray-50">
          <h3 className="font-semibold mb-2">
            {status.has_reviewed ? "Edit your review" : "Write a review"}
          </h3>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Rating</label>
            <select
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              <option value="">Select rating</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n} ⭐
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="block text-sm font-medium mb-1">Comment</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="border p-2 w-full rounded"
              placeholder="Share your experience with this course..."
              rows={4}
              disabled={loading}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={submitReview}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? "Submitting..." : status.has_reviewed ? "Update Review" : "Submit Review"}
            </button>

            {status.has_reviewed && (
              <button
                onClick={()=>setShowDeleteModal(true)}
                disabled={loading}
                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Deleting..." : "Delete Review"}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="font-semibold mb-3">
          All Reviews - {reviews.length}
        </h3>
        
        {reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-gray-900">{r.user_name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-yellow-500 mb-2">{"⭐".repeat(r.rating)}</p>
                {r.comment && (
                  <p className="text-sm text-gray-700">{r.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No reviews yet. Be the first to review!
          </p>
        )}
      </div>
      
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[480px]">
            <h3 className="text-lg font-semibold mb-3">
              Delete Review
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete your review?
              This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>

              <button
                onClick={deleteReview}
                disabled={loading}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                {loading ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseReviews;