import { useState } from 'react';
import { Link, useNavigate, useLocation } from "react-router-dom";
import Input from "../components/Input";
import Button from "../components/Button";
import Card from "../components/Card";
import axiosInstance from "../utils/axiosInstance";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";
  const [formData, setFormData] = useState({
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
      const response = await axiosInstance.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      // Save token and user info to localStorage
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("userType", "user");
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userName", user.name);

      // Redirect to originally requested page or dashboard
      navigate(from, { replace: true });
    } catch (error) {
      console.error("Login error:", error);
      setErrors({
        general:
          error.response?.data?.message ||
          "Invalid email or password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#CEE1DD] via-[#C4CDC1] to-[#99AEAD] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-[#658B6F] rounded-lg"></div>
            <span className="text-[#28363D] text-2xl font-bold">SafetyNet</span>
          </Link>
          <h1 className="text-3xl font-bold text-[#28363D] mb-2">
            Welcome Back
          </h1>
          <p className="text-[#6D9197]">Sign in to access your account</p>
        </div>

        {/* Login Form */}
        <Card>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* General Error Message */}
            {errors.general && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {errors.general}
              </div>
            )}

            <Input
              label="Email Address"
              type="email"
              name="email"
              id="email"
              placeholder="you@example.com"
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
                <span className="ml-2 text-sm text-[#6D9197]">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-[#658B6F] hover:text-[#6D9197] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#C4CDC1]"></div>
              </div>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#6D9197]">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-[#658B6F] hover:text-[#6D9197] font-semibold transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-6 border-t border-[#CEE1DD] pt-6">
            <p className="text-xs text-center text-[#99AEAD]">
              Government Institution?{" "}
              <Link
                to="/institution-login"
                className="text-[#658B6F] hover:text-[#6D9197] transition-colors"
              >
                Login here
              </Link>
            </p>
          </div>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[#6D9197]">
            Protected by government-grade security. Your data is encrypted and
            never shared.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
