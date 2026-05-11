import axiosInstance from "./axiosInstance";

export const ticketsApi = {
  myTickets: () => axiosInstance.get("/tickets/my/"),
  detail: (id) => axiosInstance.get(`/tickets/${id}/`),
};
