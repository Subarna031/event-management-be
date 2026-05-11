import axiosInstance from "./axiosInstance";

export const eventsApi = {
  list: (params) => axiosInstance.get("/events/", { params }),
  detail: (id) => axiosInstance.get(`/events/${id}/`),
  create: (data) => axiosInstance.post("/events/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  update: (id, data) => axiosInstance.patch(`/events/${id}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
  delete: (id) => axiosInstance.delete(`/events/${id}/`),
  register: (id) => axiosInstance.post(`/events/${id}/register/`),
  attendees: (id) => axiosInstance.get(`/events/${id}/attendees/`),
  categories: () => axiosInstance.get("/events/categories/"),
};
