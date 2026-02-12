import axiosInstance from "./axiosInstance";

export const getWalletSummary = () =>
  axiosInstance.get("/revenue/tutor/wallet/");

export const getWalletTransactions = () =>
  axiosInstance.get("/revenue/tutor/wallet/transactions/");

export const requestPayout = (data) =>
  axiosInstance.post("/revenue/tutor/payout/request/", data );

export const getPayoutHistory = () =>
  axiosInstance.get("/revenue/tutor/payouts/");
