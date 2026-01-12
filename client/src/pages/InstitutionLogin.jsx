import { useState } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import Card from "../components/Card";
import axiosInstance from "../utils/axiosInstance";

const InstitutionLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/institution";
  const [formData, setFormData] = useState({
    institutionId: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    const newErrors = {};
    if (!formData.institutionId) {
      newErrors.institutionId = "Institution ID is required";
    }
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post("/institutions/login", {
        institutionId: formData.institutionId,
        email: formData.email,
        password: formData.password,
      });

      // Save token and institution info to localStorage
      const { token, institution } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("userType", "institution");
      localStorage.setItem("institutionId", institution.institutionId);
      localStorage.setItem("institutionEmail", institution.email);
      localStorage.setItem("institutionName", institution.name);

      // Redirect to originally requested page or institution dashboard
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Institution login error:", error);
      setErrors({
        general:
          error.response?.data?.message ||
          "Invalid credentials. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#28363D] via-[#2F575D] to-[#6D9197] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-[#658B6F] rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
              </svg>
            </div>
            <span className="text-white text-2xl font-bold">SafetyNet</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            Institution Portal
          </h1>
          <p className="text-[#CEE1DD]">
            Secure access for authorized institutions
          </p>
        </div>

        {/* Login Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Institution Badge */}
            <div className="bg-[#CEE1DD] border-l-4 border-[#658B6F] p-4 rounded">
              <div className="flex items-center gap-2">
                <svg
                  className="w-5 h-5 text-[#658B6F]"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
                <span className="text-sm font-semibold text-[#28363D]">
                  Authorized Institution Login
                </span>
              </div>
            </div>

            {/* General Error Message */}
            {errors.general && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {errors.general}
              </div>
            )}

            <Input
              label="Institution ID"
              type="text"
              name="institutionId"
              id="institutionId"
              placeholder="Enter your institution ID"
              value={formData.institutionId}
              onChange={handleChange}
              error={errors.institutionId}
              required
            />

            <Input
              label="Official Email Address"
              type="email"
              name="email"
              id="email"
              placeholder="officer@institution.gov.in"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              id="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              required
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-[#658B6F] border-[#C4CDC1] rounded focus:ring-[#658B6F]"
                />
                <span className="ml-2 text-sm text-[#6D9197]">
                  Keep me signed in
                </span>
              </label>
              <Link
                to="/institution-forgot-password"
                className="text-sm text-[#658B6F] hover:text-[#6D9197] transition-colors"
              >
                Reset password
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Authenticating..." : "Access Dashboard"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#6D9197]">
              Don't have institution access?{" "}
              <Link
                to="/institution-register"
                className="text-[#658B6F] hover:text-[#6D9197] font-semibold transition-colors"
              >
                Request Access
              </Link>
            </p>
          </div>

          <div className="mt-6 border-t border-[#CEE1DD] pt-6">
            <p className="text-xs text-center text-[#99AEAD]">
              Regular user?{" "}
              <Link
                to="/login"
                className="text-[#658B6F] hover:text-[#6D9197] transition-colors"
              >
                Login here
              </Link>
            </p>
          </div>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-start gap-3 text-white">
            <svg
              className="w-5 h-5 text-[#CEE1DD] shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14.59l-3.54-3.54 1.41-1.41L11 13.77l4.88-4.88 1.41 1.41L11 15.59z" />
            </svg>
            <div>
              <h4 className="font-semibold text-sm mb-1">Secure Access</h4>
              <p className="text-xs text-[#CEE1DD]">
                This portal is restricted to verified institutions only. All
                access is logged and monitored for security.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionLogin;
