import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import axiosInstance from "../utils/axiosInstance";

const InstitutionRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    institutionName: "",
    institutionType: "",
    registrationNumber: "",
    officialEmail: "",
    contactPerson: "",
    designation: "",
    phone: "",
    address: "",
    state: "",
    city: "",
    pincode: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const institutionTypes = [
    "Police Department",
    "Municipal Corporation",
    "Disaster Management",
    "Fire Department",
    "Health Department",
    "Forest Department",
    "Other Government Body",
  ];

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: "",
      });
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.institutionName) {
      newErrors.institutionName = "Institution name is required";
    }
    if (!formData.institutionType) {
      newErrors.institutionType = "Institution type is required";
    }
    if (!formData.registrationNumber) {
      newErrors.registrationNumber = "Registration number is required";
    }
    if (!formData.officialEmail) {
      newErrors.officialEmail = "Official email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.officialEmail)) {
      newErrors.officialEmail = "Email is invalid";
    }
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.contactPerson) {
      newErrors.contactPerson = "Contact person name is required";
    }
    if (!formData.designation) {
      newErrors.designation = "Designation is required";
    }
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ""))) {
      newErrors.phone = "Phone number must be 10 digits";
    }
    if (!formData.address) {
      newErrors.address = "Address is required";
    }
    if (!formData.state) {
      newErrors.state = "State is required";
    }
    if (!formData.city) {
      newErrors.city = "City is required";
    }
    if (!formData.pincode) {
      newErrors.pincode = "Pincode is required";
    } else if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = "Pincode must be 6 digits";
    }
    return newErrors;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = "You must agree to the terms and conditions";
    }
    return newErrors;
  };

  const handleNext = () => {
    let newErrors = {};
    if (step === 1) {
      newErrors = validateStep1();
    } else if (step === 2) {
      newErrors = validateStep2();
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setStep(step + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateStep3();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      const response = await axiosInstance.post("/institutions/register", {
        institutionName: formData.institutionName,
        institutionType: formData.institutionType,
        registrationNumber: formData.registrationNumber,
        institutionId: formData.registrationNumber, // Use registration number as institution ID
        officialEmail: formData.officialEmail,
        contactPerson: formData.contactPerson,
        designation: formData.designation,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        password: formData.password,
      });

      // Save token and institution info to localStorage
      const { token, institution } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("userType", "institution");
      localStorage.setItem(
        "institutionEmail",
        institution.officialEmail || formData.officialEmail
      );
      localStorage.setItem(
        "institutionName",
        institution.institutionName || formData.institutionName
      );

      // Redirect to institution dashboard
      navigate("/institution");
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({
        submit:
          error.response?.data?.message ||
          "Registration failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-[#28363D] via-[#2F575D] to-[#6D9197] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl">
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
            Institution Registration
          </h1>
          <p className="text-[#CEE1DD]">Request access for your institution</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-center space-x-4">
            <div
              className={`flex items-center ${
                step >= 1 ? "text-white" : "text-[#99AEAD]"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= 1
                    ? "bg-[#658B6F] text-white"
                    : "bg-[#99AEAD] text-white"
                }`}
              >
                1
              </div>
              <span className="ml-2 font-medium hidden sm:inline">
                Institution Info
              </span>
            </div>
            <div
              className={`h-1 w-16 ${
                step >= 2 ? "bg-[#658B6F]" : "bg-[#99AEAD]"
              }`}
            ></div>
            <div
              className={`flex items-center ${
                step >= 2 ? "text-white" : "text-[#99AEAD]"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= 2
                    ? "bg-[#658B6F] text-white"
                    : "bg-[#99AEAD] text-white"
                }`}
              >
                2
              </div>
              <span className="ml-2 font-medium hidden sm:inline">
                Contact Details
              </span>
            </div>
            <div
              className={`h-1 w-16 ${
                step >= 3 ? "bg-[#658B6F]" : "bg-[#99AEAD]"
              }`}
            ></div>
            <div
              className={`flex items-center ${
                step >= 3 ? "text-white" : "text-[#99AEAD]"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= 3
                    ? "bg-[#658B6F] text-white"
                    : "bg-[#99AEAD] text-white"
                }`}
              >
                3
              </div>
              <span className="ml-2 font-medium hidden sm:inline">
                Security
              </span>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <Card>
          <form onSubmit={handleSubmit}>
            {/* Step 1: Institution Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="bg-[#CEE1DD] border-l-4 border-[#658B6F] p-4 rounded mb-6">
                  <h3 className="font-semibold text-[#28363D] mb-1">
                    Step 1: Institution Information
                  </h3>
                  <p className="text-sm text-[#2F575D]">
                    Provide official details about your institution
                  </p>
                </div>

                <Input
                  label="Institution Name"
                  type="text"
                  name="institutionName"
                  id="institutionName"
                  placeholder="e.g., Delhi Police Department"
                  value={formData.institutionName}
                  onChange={handleChange}
                  error={errors.institutionName}
                  required
                />

                <div>
                  <label className="block text-sm font-medium text-[#28363D] mb-2">
                    Institution Type *
                  </label>
                  <select
                    name="institutionType"
                    value={formData.institutionType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border-2 border-[#C4CDC1] focus:border-[#658B6F] focus:outline-none transition-colors"
                    required
                  >
                    <option value="">Select institution type</option>
                    {institutionTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.institutionType && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.institutionType}
                    </p>
                  )}
                </div>

                <Input
                  label="Registration/License Number"
                  type="text"
                  name="registrationNumber"
                  id="registrationNumber"
                  placeholder="Government registration number"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                  error={errors.registrationNumber}
                  required
                />

                <Input
                  label="Official Email Address"
                  type="email"
                  name="officialEmail"
                  id="officialEmail"
                  placeholder="officer@institution.gov.in"
                  value={formData.officialEmail}
                  onChange={handleChange}
                  error={errors.officialEmail}
                  required
                />

                <Button type="button" onClick={handleNext} className="w-full">
                  Next Step
                </Button>
              </div>
            )}

            {/* Step 2: Contact Details */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="bg-[#CEE1DD] border-l-4 border-[#658B6F] p-4 rounded mb-6">
                  <h3 className="font-semibold text-[#28363D] mb-1">
                    Step 2: Contact Information
                  </h3>
                  <p className="text-sm text-[#2F575D]">
                    Primary contact person details
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Input
                    label="Contact Person Name"
                    type="text"
                    name="contactPerson"
                    id="contactPerson"
                    placeholder="Officer name"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    error={errors.contactPerson}
                    required
                  />

                  <Input
                    label="Designation"
                    type="text"
                    name="designation"
                    id="designation"
                    placeholder="e.g., Senior Inspector"
                    value={formData.designation}
                    onChange={handleChange}
                    error={errors.designation}
                    required
                  />
                </div>

                <Input
                  label="Contact Phone Number"
                  type="tel"
                  name="phone"
                  id="phone"
                  placeholder="10-digit phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  required
                />

                <Input
                  label="Institution Address"
                  type="text"
                  name="address"
                  id="address"
                  placeholder="Full address"
                  value={formData.address}
                  onChange={handleChange}
                  error={errors.address}
                  required
                />

                <div className="grid md:grid-cols-3 gap-6">
                  <Input
                    label="State"
                    type="text"
                    name="state"
                    id="state"
                    placeholder="State"
                    value={formData.state}
                    onChange={handleChange}
                    error={errors.state}
                    required
                  />

                  <Input
                    label="City"
                    type="text"
                    name="city"
                    id="city"
                    placeholder="City"
                    value={formData.city}
                    onChange={handleChange}
                    error={errors.city}
                    required
                  />

                  <Input
                    label="Pincode"
                    type="text"
                    name="pincode"
                    id="pincode"
                    placeholder="6-digit pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    error={errors.pincode}
                    required
                  />
                </div>

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="w-full"
                  >
                    Back
                  </Button>
                  <Button type="button" onClick={handleNext} className="w-full">
                    Next Step
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Security */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="bg-[#CEE1DD] border-l-4 border-[#658B6F] p-4 rounded mb-6">
                  <h3 className="font-semibold text-[#28363D] mb-1">
                    Step 3: Account Security
                  </h3>
                  <p className="text-sm text-[#2F575D]">
                    Create secure credentials for your institution
                  </p>
                </div>

                <Input
                  label="Password"
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Create a strong password (min. 8 characters)"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                  required
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  name="confirmPassword"
                  id="confirmPassword"
                  placeholder="Re-enter your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                  required
                />

                <div className="bg-[#CEE1DD] p-4 rounded-lg">
                  <h4 className="font-semibold text-[#28363D] mb-2 flex items-center gap-2">
                    <svg
                      className="w-5 h-5 text-[#658B6F]"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-1 14.59l-3.54-3.54 1.41-1.41L11 13.77l4.88-4.88 1.41 1.41L11 15.59z" />
                    </svg>
                    Verification Process
                  </h4>
                  <p className="text-sm text-[#2F575D]">
                    Your registration will be reviewed by our admin team. You'll
                    need to provide:
                  </p>
                  <ul className="text-sm text-[#2F575D] mt-2 space-y-1 ml-4">
                    <li>• Official government documentation</li>
                    <li>• Authorization letter from department head</li>
                    <li>• Verification of contact details</li>
                  </ul>
                  <p className="text-sm text-[#2F575D] mt-2">
                    <strong>Processing time:</strong> 2-3 business days
                  </p>
                </div>

                <div>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="agreeToTerms"
                      checked={formData.agreeToTerms}
                      onChange={handleChange}
                      className="w-4 h-4 mt-1 text-[#658B6F] border-[#C4CDC1] rounded focus:ring-[#658B6F]"
                    />
                    <span className="ml-2 text-sm text-[#6D9197]">
                      I confirm that I am an authorized representative of the
                      institution and agree to the{" "}
                      <a
                        href="#"
                        className="text-[#658B6F] hover:text-[#6D9197] transition-colors"
                      >
                        Terms and Conditions
                      </a>{" "}
                      and{" "}
                      <a
                        href="#"
                        className="text-[#658B6F] hover:text-[#6D9197] transition-colors"
                      >
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                  {errors.agreeToTerms && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.agreeToTerms}
                    </p>
                  )}
                </div>

                {errors.submit && (
                  <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
                    {errors.submit}
                  </div>
                )}

                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="w-full"
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Submitting..." : "Submit Application"}
                  </Button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#6D9197]">
              Already have institution access?{" "}
              <Link
                to="/institution-login"
                className="text-[#658B6F] hover:text-[#6D9197] font-semibold transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="mt-4 border-t border-[#CEE1DD] pt-4">
            <p className="text-xs text-center text-[#99AEAD]">
              Regular user?{" "}
              <Link
                to="/register"
                className="text-[#658B6F] hover:text-[#6D9197] transition-colors"
              >
                Create user account
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
              <path d="M11 17h2v-6h-2v6zm1-15C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zM11 9h2V7h-2v2z" />
            </svg>
            <div>
              <h4 className="font-semibold text-sm mb-1">Important Notice</h4>
              <p className="text-xs text-[#CEE1DD]">
                All institution registrations are verified. Providing false
                information or impersonating government officials is a
                punishable offense.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstitutionRegister;
