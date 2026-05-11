import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useAuth } from "../hooks/useAuth";
import { useNotification } from "../hooks/useNotification";

const schema = yup.object({
  email: yup.string().email("Enter a valid email").required("Email is required"),
  username: yup
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username too long")
    .required("Username is required"),
  role: yup.string().oneOf(["organizer", "participant"]).required("Select a role"),
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  password2: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords do not match")
    .required("Please confirm your password"),
});

export default function Register() {
  const { register: registerUser, isAuthenticated, loading } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { role: "participant" },
  });

  const onSubmit = async (values) => {
    const result = await registerUser(values);
    if (result.success) {
      notify("Account created! Welcome to EventHub.", "success");
      navigate("/", { replace: true });
    } else {
      // Map backend field errors back to form
      Object.entries(result.errors).forEach(([field, msgs]) => {
        const msg = Array.isArray(msgs) ? msgs[0] : msgs;
        if (["email", "username", "password", "role"].includes(field)) {
          setError(field, { message: msg });
        } else {
          notify(msg, "error");
        }
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="card p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
            <p className="text-sm text-gray-500 mt-1">
              Already have an account?{" "}
              <Link to="/login" className="text-primary-600 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I want to
              </label>
              <div className="grid grid-cols-2 gap-3">
                {["participant", "organizer"].map((role) => (
                  <label
                    key={role}
                    className="flex flex-col items-center gap-1 p-3 border-2 rounded-lg cursor-pointer
                      has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50 transition-colors"
                  >
                    <input
                      type="radio"
                      value={role}
                      {...register("role")}
                      className="sr-only"
                    />
                    <span className="text-lg">{role === "participant" ? "🎟" : "🎪"}</span>
                    <span className="text-sm font-medium capitalize">{role}</span>
                    <span className="text-xs text-gray-400">
                      {role === "participant" ? "Attend events" : "Host events"}
                    </span>
                  </label>
                ))}
              </div>
              {errors.role && <p className="form-error">{errors.role.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                type="email"
                autoComplete="email"
                {...register("email")}
                className="input-field"
                placeholder="you@example.com"
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                autoComplete="username"
                {...register("username")}
                className="input-field"
                placeholder="johndoe"
              />
              {errors.username && <p className="form-error">{errors.username.message}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                {...register("password")}
                className="input-field"
                placeholder="At least 8 characters"
              />
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                {...register("password2")}
                className="input-field"
                placeholder="Repeat password"
              />
              {errors.password2 && (
                <p className="form-error">{errors.password2.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="btn-primary w-full"
            >
              {isSubmitting || loading ? "Creating account..." : "Create account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
