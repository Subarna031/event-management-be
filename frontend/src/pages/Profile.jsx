import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { useNotification } from "../hooks/useNotification";
import { authApi } from "../api/auth";
import { ticketsApi } from "../api/tickets";
import TicketCard from "../components/TicketCard";

const profileSchema = yup.object({
  username: yup.string().min(3).required("Username is required"),
  bio: yup.string().max(300),
  interests: yup.string(),
});

export default function Profile() {
  const { user, refreshProfile } = useAuth();
  const { notify } = useNotification();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("profile");
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileRef = useRef();

  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ["my-tickets"],
    queryFn: () => ticketsApi.myTickets().then((r) => r.data),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      username: user?.username || "",
      bio: user?.bio || "",
      interests: (user?.interests || []).join(", "),
    },
  });

  const onProfileSubmit = async (values) => {
    try {
      const fd = new FormData();
      fd.append("username", values.username);
      fd.append("bio", values.bio || "");
      const interests = values.interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      interests.forEach((i) => fd.append("interests", i));
      if (fileRef.current?.files[0]) {
        fd.append("profile_image", fileRef.current.files[0]);
      }
      await authApi.updateProfile(fd);
      await refreshProfile();
      notify("Profile updated.", "success");
    } catch (err) {
      const msg = err.response?.data?.username?.[0] || "Failed to update profile.";
      notify(msg, "error");
    }
  };

  const ticketList = tickets?.results || tickets || [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
        {["profile", "tickets"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors capitalize ${
              activeTab === tab
                ? "border-primary-600 text-primary-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab}
            {tab === "tickets" && ticketList.length > 0 && (
              <span className="ml-1.5 bg-primary-100 text-primary-700 text-xs px-1.5 py-0.5 rounded-full">
                {ticketList.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === "profile" && (
        <form onSubmit={handleSubmit(onProfileSubmit)} className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div className="relative">
              {avatarPreview || user?.profile_image ? (
                <img
                  src={avatarPreview || user.profile_image}
                  alt="Avatar"
                  className="w-20 h-20 rounded-full object-cover border-2 border-primary-200"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-bold border-2 border-primary-200">
                  {user?.username?.charAt(0)?.toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) setAvatarPreview(URL.createObjectURL(file));
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current.click()}
                className="btn-secondary text-sm"
              >
                Change photo
              </button>
              <p className="text-xs text-gray-400 mt-1">
                {user?.email} ·{" "}
                <span className="capitalize font-medium">{user?.role}</span>
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input type="text" {...register("username")} className="input-field" />
            {errors.username && <p className="form-error">{errors.username.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              rows={3}
              {...register("bio")}
              className="input-field resize-none"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interests{" "}
              <span className="text-gray-400 font-normal">(comma-separated categories)</span>
            </label>
            <input
              type="text"
              {...register("interests")}
              className="input-field"
              placeholder="music, tech, sports"
            />
          </div>

          <button type="submit" disabled={isSubmitting} className="btn-primary">
            {isSubmitting ? "Saving..." : "Save changes"}
          </button>
        </form>
      )}

      {activeTab === "tickets" && (
        <div className="space-y-4">
          {ticketsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="card h-28 animate-pulse bg-gray-100" />
            ))
          ) : ticketList.length === 0 ? (
            <p className="text-gray-400 text-center py-12">
              No tickets yet. Register for an event!
            </p>
          ) : (
            ticketList.map((ticket) => <TicketCard key={ticket.id} ticket={ticket} />)
          )}
        </div>
      )}
    </div>
  );
}
