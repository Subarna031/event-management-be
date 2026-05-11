import axiosInstance from "./axiosInstance";

export const attendanceApi = {
  checkIn: (qrToken) => axiosInstance.post("/attendance/check-in/", { qr_token: qrToken }),
  eventAttendance: (eventId) => axiosInstance.get(`/attendance/event/${eventId}/`),
};
