import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://localhost:8000/api",
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const excludedPaths = [
      "/users/login/",
      "/users/register/",
      "/users/token/",
      "/users/token/refresh/",
      "/users/verify-otp/",
    ];

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !excludedPaths.some((path) => originalRequest.url.includes(path))
    ) {
      originalRequest._retry = true;
      try {
        const res = await axios.post("http://localhost:8000/api/users/token/refresh/", {
          refresh: localStorage.getItem("refreshToken"),
        });

        const newAccess = res.data.access;

        // ✅ Update access token everywhere
        localStorage.setItem("accessToken", newAccess);
        axiosInstance.defaults.headers.Authorization = `Bearer ${newAccess}`;
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        return axiosInstance(originalRequest);
      } catch (err) {
        localStorage.clear();
        window.location.href = "/login";
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;