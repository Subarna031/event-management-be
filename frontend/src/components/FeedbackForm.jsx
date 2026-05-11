import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import PropTypes from "prop-types";
import { feedbackApi } from "../api/feedback";
import { useNotification } from "../hooks/useNotification";

const schema = yup.object({
  rating: yup.number().min(1).max(5).required("Rating is required"),
  comment: yup.string().min(10, "Comment must be at least 10 characters").required(),
});

export default function FeedbackForm({ eventId, onSuccess }) {
  const { notify } = useNotification();
  const [images, setImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm({ resolver: yupResolver(schema) });

  const rating = watch("rating", 0);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("rating", values.rating);
      fd.append("comment", values.comment);
      images.forEach((img) => fd.append("uploaded_images", img));

      await feedbackApi.create(eventId, fd);
      notify("Feedback submitted. Thank you!", "success");
      reset();
      setImages([]);
      onSuccess?.();
    } catch (err) {
      const msg =
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        "Failed to submit feedback.";
      notify(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Star rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <label key={star} className="cursor-pointer">
              <input
                type="radio"
                value={star}
                className="sr-only"
                {...register("rating")}
              />
              <span
                className={`text-2xl ${
                  Number(rating) >= star ? "text-yellow-400" : "text-gray-300"
                }`}
              >
                ★
              </span>
            </label>
          ))}
        </div>
        {errors.rating && <p className="form-error">{errors.rating.message}</p>}
      </div>

      {/* Comment */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
        <textarea
          rows={4}
          {...register("comment")}
          className="input-field resize-none"
          placeholder="Share your experience..."
        />
        {errors.comment && <p className="form-error">{errors.comment.message}</p>}
      </div>

      {/* Image upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Photos (optional)
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => setImages(Array.from(e.target.files))}
        />
        <button
          type="button"
          onClick={() => fileRef.current.click()}
          className="btn-secondary text-sm"
        >
          {images.length ? `${images.length} file(s) selected` : "Choose images"}
        </button>
      </div>

      <button type="submit" disabled={submitting} className="btn-primary w-full">
        {submitting ? "Submitting..." : "Submit Feedback"}
      </button>
    </form>
  );
}

FeedbackForm.propTypes = {
  eventId: PropTypes.number.isRequired,
  onSuccess: PropTypes.func,
};
