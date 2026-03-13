import axios from "axios";

const axiosPublic = axios.create({
  baseURL: "https://pytech.site/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosPublic;