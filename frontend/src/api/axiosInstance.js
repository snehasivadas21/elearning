import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000/api",
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (
      error.response?.status === 403 && 
      error.response?.data?.detail?.toLowerCase().includes("deactivated")
    ){
      alert("Your account has been deactivated.Please contact support.")
      localStorage.clear();
      window.location.href = "/login";
      return Promise.reject(error);
    }
    const originalRequest = error.config;

    const excludedPaths = [
      "/users/login/",
      "/users/register/",
      "/users/token/",
      "/users/token/refresh/",
    ];

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !excludedPaths.some((path) => originalRequest.url.includes(path))
    ) {
      originalRequest._retry = true;
      try {
        const res = await axiosInstance.post("/users/token/refresh/", {
          refresh: localStorage.getItem("refresh"),
        });

        localStorage.setItem("accessToken", res.data.access);
        originalRequest.headers.Authorization = `Bearer ${res.data.access}`;

        return axiosInstance(originalRequest);
      } catch {
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;