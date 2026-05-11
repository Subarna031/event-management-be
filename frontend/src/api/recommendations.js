import axiosInstance from "./axiosInstance";

export const recommendationsApi = {
  get: (limit = 10) => axiosInstance.get("/recommendations/", { params: { limit } }),
};
