import axiosInstance from "./axiosInstance";

export const getRevenueSummary = () =>
  axiosInstance.get("/revenue/admin/revenue/total/");

export const getRevenueByCourse = () =>
  axiosInstance.get("/revenue/admin/revenue/by-course/");

export const getRevenueByInstructor = () =>
  axiosInstance.get("/revenue/admin/revenue/by-instructor/");

export const getAdminPayouts = (status = "", page = 1) => {
  const params = { page };
  if (status && status !== "ALL") params.status = status;
  return axiosInstance.get(`/revenue/admin/payout/`, { params });
};

export const markPayoutPaid = (id) =>
  axiosInstance.post(`/revenue/admin/payout/${id}/mark-paid/`);

export const markPayoutReject = (id) =>
  axiosInstance.post(`/revenue/admin/payout/${id}/reject/`);
