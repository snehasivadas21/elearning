import axiosInstance from "./axiosInstance";

export const getRevenueSummary = () =>
  axiosInstance.get("/revenue/admin/revenue/total/");

export const getRevenueByCourse = () =>
  axiosInstance.get("/revenue/admin/revenue/by-course/");

export const getRevenueByInstructor = () =>
  axiosInstance.get("/revenue/admin/revenue/by-instructor/");


export const getAdminPayouts = (status = "") => {
  const url = status
    ? `/revenue/admin/payout/${status.toLowerCase()}/`
    : `/revenue/admin/payout/history/`; 

  return axiosInstance.get(url);
};

export const markPayoutPaid = (id) =>
  axiosInstance.post(`/revenue/admin/payout/${id}/mark-paid/`);

export const markPayoutReject = (id) =>
  axiosInstance.post(`/revenue/admin/payout/${id}/reject/`);
