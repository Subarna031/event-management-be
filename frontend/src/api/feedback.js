import axiosInstance from "./axiosInstance";

export const feedbackApi = {
  list: (eventId) => axiosInstance.get(`/feedback/events/${eventId}/`),
  summary: (eventId) => axiosInstance.get(`/feedback/events/${eventId}/summary/`),
  create: (eventId, data) =>
    axiosInstance.post(`/feedback/events/${eventId}/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  update: (feedbackId, data) => axiosInstance.patch(`/feedback/${feedbackId}/`, data),
  delete: (feedbackId) => axiosInstance.delete(`/feedback/${feedbackId}/`),
};
