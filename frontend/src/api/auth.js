import axiosInstance from "./axiosInstance";
import axios from "axios";

export const authApi = {
  register: (data) => axiosInstance.post("/auth/register/", data),
  login: (data) => axiosInstance.post("/auth/login/", data),
  logout: (refresh) => axiosInstance.post("/auth/logout/", { refresh }),

  /** Silent token refresh — uses bare axios to avoid interceptor loops. */
  refreshToken: (refresh) =>
    axios.post("/api/auth/token/refresh/", { refresh }),

  /** Fetch the authenticated user's own profile. */
  me: () => axiosInstance.get("/auth/me/"),

  getProfile: () => axiosInstance.get("/auth/profile/"),
  updateProfile: (data) =>
    axiosInstance.patch("/auth/profile/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  changePassword: (data) => axiosInstance.post("/auth/change-password/", data),
};
