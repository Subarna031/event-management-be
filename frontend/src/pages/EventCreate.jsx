import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useCategories, useCreateEvent } from "../hooks/useEvents";
import { useNotification } from "../hooks/useNotification";

// ── Per-step schemas ──────────────────────────────────────────────────────────

const stepSchemas = [
  // Step 0 — Details
  yup.object({
    title: yup.string().min(5, "Title must be at least 5 characters").max(200).required("Title is required"),
    description: yup.string().min(20, "Description must be at least 20 characters").required("Description is required"),
    category: yup.string().required("Please select a category"),
    tags: yup.string(),
  }),
  // Step 1 — Date & Venue
  yup.object({
    date: yup.string().required("Start date is required"),
    end_date: yup.string(),
    venue: yup.string().min(3, "Venue name is too short").required("Venue is required"),
    city: yup.string().required("City is required"),
    capacity: yup
      .number()
      .typeError("Capacity must be a number")
      .min(1, "Minimum 1")
      .max(100000, "Maximum 100,000")
      .required("Capacity is required"),
    status: yup.string().oneOf(["draft", "published"]).required(),
  }),
  // Step 2 — Media (optional)
  yup.object({}),
  // Step 3 — Preview (no extra validation)
  yup.object({}),
];

const STEPS = ["Details", "Date & Venue", "Media", "Preview"];

// ── Helper components ─────────────────────────────────────────────────────────

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
              i < current
                ? "bg-primary-600 text-white"
                : i === current
                ? "bg-primary-100 text-primary-700 ring-2 ring-primary-600"
                : "bg-gray-100 text-gray-400"
            }`}
          >
            {i < current ? "✓" : i + 1}
          </div>
          <span
            className={`text-sm font-medium hidden sm:block ${
              i === current ? "text-primary-700" : "text-gray-400"
            }`}
          >
            {label}
          </span>
          {i < STEPS.length - 1 && (
            <div
              className={`h-px w-6 sm:w-12 ${i < current ? "bg-primary-600" : "bg-gray-200"}`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function PreviewSection({ label, children }) {
  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function EventCreate() {
  const [step, setStep] = useState(0);
  const [bannerFile, setBannerFile] = useState(null);
  const [bannerPreview, setBannerPreview] = useState(null);
  const bannerRef = useRef();
  const navigate = useNavigate();
  const { notify } = useNotification();
  const { data: categories } = useCategories();
  const createEvent = useCreateEvent();

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(stepSchemas[step]),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      tags: "",
      date: "",
      end_date: "",
      venue: "",
      city: "",
      capacity: "",
      status: "published",
    },
    mode: "onTouched",
  });

  const values = watch();

  const handleNext = async () => {
    const valid = await trigger();
    if (valid) setStep((s) => s + 1);
  };

  const handleBack = () => setStep((s) => s - 1);

  const onBannerChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const onSubmit = async () => {
    const fd = new FormData();
    fd.append("title", values.title);
    fd.append("description", values.description);
    fd.append("category", values.category);
    fd.append("venue", values.venue);
    fd.append("city", values.city);
    fd.append("capacity", values.capacity);
    fd.append("status", values.status);
    fd.append("date", new Date(values.date).toISOString());
    if (values.end_date) fd.append("end_date", new Date(values.end_date).toISOString());
    if (bannerFile) fd.append("banner_image", bannerFile);

    // Tags: split comma-separated string into array items
    const tagList = values.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    tagList.forEach((t) => fd.append("tags", t));

    try {
      const event = await createEvent.mutateAsync(fd);
      notify("Event created successfully!", "success");
      navigate(`/events/${event.id}`);
    } catch (err) {
      const msg =
        err.response?.data?.title?.[0] ||
        err.response?.data?.detail ||
        "Failed to create event.";
      notify(msg, "error");
    }
  };

  const categoryName =
    categories?.find((c) => String(c.id) === String(values.category))?.name || "";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create an Event</h1>
        <p className="text-sm text-gray-500 mt-1">Fill in the details to publish your event.</p>
      </div>

      <StepIndicator current={step} />

      <div className="card p-6 sm:p-8">
        {/* ── Step 0: Details ── */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event title *</label>
              <input {...register("title")} className="input-field" placeholder="A catchy title for your event" />
              {errors.title && <p className="form-error">{errors.title.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
              <textarea
                {...register("description")}
                rows={5}
                className="input-field resize-none"
                placeholder="Describe your event — what will attendees experience?"
              />
              {errors.description && <p className="form-error">{errors.description.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
              <select {...register("category")} className="input-field">
                <option value="">— Select a category —</option>
                {categories?.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              {errors.category && <p className="form-error">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tags
                <span className="text-gray-400 font-normal ml-1">(comma-separated)</span>
              </label>
              <input
                {...register("tags")}
                className="input-field"
                placeholder="music, outdoor, networking"
              />
            </div>
          </div>
        )}

        {/* ── Step 1: Date & Venue ── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start date & time *</label>
                <input {...register("date")} type="datetime-local" className="input-field" />
                {errors.date && <p className="form-error">{errors.date.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End date & time</label>
                <input {...register("end_date")} type="datetime-local" className="input-field" />
                {errors.end_date && <p className="form-error">{errors.end_date.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Venue *</label>
              <input
                {...register("venue")}
                className="input-field"
                placeholder="Conference Hall A, City Convention Centre"
              />
              {errors.venue && <p className="form-error">{errors.venue.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input {...register("city")} className="input-field" placeholder="Kathmandu" />
                {errors.city && <p className="form-error">{errors.city.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                <input
                  {...register("capacity")}
                  type="number"
                  min={1}
                  className="input-field"
                  placeholder="200"
                />
                {errors.capacity && <p className="form-error">{errors.capacity.message}</p>}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
              <div className="flex gap-4">
                {["published", "draft"].map((s) => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer">
                    <input {...register("status")} type="radio" value={s} className="text-primary-600" />
                    <span className="text-sm capitalize">{s}</span>
                    <span className="text-xs text-gray-400">
                      {s === "published" ? "(visible to all)" : "(only you)"}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Media ── */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Banner image</label>
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-primary-400 transition-colors"
                onClick={() => bannerRef.current.click()}
              >
                {bannerPreview ? (
                  <img
                    src={bannerPreview}
                    alt="Banner preview"
                    className="w-full h-56 object-cover"
                  />
                ) : (
                  <div className="h-56 flex flex-col items-center justify-center text-gray-400">
                    <svg className="w-12 h-12 mb-3 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-medium">Click to upload banner</p>
                    <p className="text-xs mt-1">Recommended: 1200 × 630 px, JPEG or PNG</p>
                  </div>
                )}
              </div>
              <input
                ref={bannerRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onBannerChange}
              />
              {bannerFile && (
                <p className="text-xs text-gray-400 mt-2">
                  Selected: {bannerFile.name} ({(bannerFile.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            <p className="text-sm text-gray-400">
              No banner? That&apos;s fine — we&apos;ll show a colourful placeholder.
            </p>
          </div>
        )}

        {/* ── Step 3: Preview ── */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Review your event</h2>

            {bannerPreview && (
              <img src={bannerPreview} alt="Banner" className="w-full h-44 object-cover rounded-xl mb-4" />
            )}

            <PreviewSection label="Title">
              <p className="text-gray-900 font-medium">{values.title}</p>
            </PreviewSection>

            <PreviewSection label="Description">
              <p className="text-gray-600 text-sm whitespace-pre-line line-clamp-4">{values.description}</p>
            </PreviewSection>

            <div className="grid grid-cols-2 gap-3">
              <PreviewSection label="Category">
                <p className="text-gray-800 text-sm">{categoryName || "—"}</p>
              </PreviewSection>
              <PreviewSection label="Status">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    values.status === "published"
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {values.status}
                </span>
              </PreviewSection>
              <PreviewSection label="Date">
                <p className="text-gray-800 text-sm">
                  {values.date ? new Date(values.date).toLocaleString() : "—"}
                </p>
              </PreviewSection>
              <PreviewSection label="Capacity">
                <p className="text-gray-800 text-sm">{values.capacity} attendees</p>
              </PreviewSection>
              <PreviewSection label="City">
                <p className="text-gray-800 text-sm">{values.city}</p>
              </PreviewSection>
              <PreviewSection label="Venue">
                <p className="text-gray-800 text-sm">{values.venue}</p>
              </PreviewSection>
            </div>

            {values.tags && (
              <PreviewSection label="Tags">
                <div className="flex flex-wrap gap-1">
                  {values.tags.split(",").filter(Boolean).map((t) => (
                    <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      #{t.trim()}
                    </span>
                  ))}
                </div>
              </PreviewSection>
            )}
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={step === 0 ? () => navigate(-1) : handleBack}
            className="btn-secondary"
          >
            {step === 0 ? "Cancel" : "Back"}
          </button>

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={handleNext} className="btn-primary">
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={createEvent.isPending}
              className="btn-primary"
            >
              {createEvent.isPending ? "Publishing..." : "Publish Event"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
