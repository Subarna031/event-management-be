import axiosInstance from "./axiosInstance";

export const analyticsApi = {
  eventStats: (eventId) => axiosInstance.get(`/analytics/events/${eventId}/`),
  dashboard: () => axiosInstance.get("/analytics/dashboard/"),
};
