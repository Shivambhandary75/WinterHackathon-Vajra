import { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    state: '',
    city: '',
    agreeToTerms: false,
  });
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value,
    });
    // Clear error for this field
    if (errors[e.target.name]) {
      setErrors({
        ...errors,
        [e.target.name]: '',
      });
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.state) {
      newErrors.state = 'State is required';
    }
    if (!formData.city) {
      newErrors.city = 'City is required';
    }
    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }
    return newErrors;
  };

  const handleNext = () => {
    const newErrors = validateStep1();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = validateStep2();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Handle registration logic here
    console.log('Registration submitted:', formData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#CEE1DD] via-[#C4CDC1] to-[#99AEAD] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl">
        {/* Logo and Header */}
        <div className="text-center mb-10">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-[#658B6F] rounded-lg"></div>
            <span className="text-[#28363D] text-2xl font-bold">SafetyNet</span>
          </Link>
          <h1 className="text-3xl font-bold text-[#28363D] mb-2">Create Your Account</h1>
          <p className="text-[#6D9197]">Join the community and help make India safer</p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-10">
          <div className="flex items-center justify-center space-x-6">
            <div className={`flex items-center ${step >= 1 ? 'text-[#658B6F]' : 'text-[#C4CDC1]'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 1 ? 'bg-[#658B6F] text-white' : 'bg-[#C4CDC1] text-white'
              }`}>
                1
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Personal Info</span>
            </div>
            <div className={`h-1 w-24 ${step >= 2 ? 'bg-[#658B6F]' : 'bg-[#C4CDC1]'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-[#658B6F]' : 'text-[#C4CDC1]'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= 2 ? 'bg-[#658B6F] text-white' : 'bg-[#C4CDC1] text-white'
              }`}>
                2
              </div>
              <span className="ml-2 font-medium hidden sm:inline">Account Setup</span>
            </div>
          </div>
        </div>

        {/* Registration Form */}
        <Card>
          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-8">
                <Input
                  label="Full Name"
                  type="text"
                  name="fullName"
                  id="fullName"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={handleChange}
                  error={errors.fullName}
                  required
                />

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
                  label="Phone Number"
                  type="tel"
                  name="phone"
                  id="phone"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  required
                />

                <Button type="button" onClick={handleNext} className="w-full">
                  Next Step
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <Input
                    label="State"
                    type="text"
                    name="state"
                    id="state"
                    placeholder="Select your state"
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
                    placeholder="Enter your city"
                    value={formData.city}
                    onChange={handleChange}
                    error={errors.city}
                    required
                  />
                </div>

                <Input
                  label="Password"
                  type="password"
                  name="password"
                  id="password"
                  placeholder="Create a strong password"
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
                  <h4 className="font-semibold text-[#28363D] mb-2">Verification Required</h4>
                  <p className="text-sm text-[#6D9197]">
                    After registration, you'll need to verify your identity using government-issued ID 
                    or location-based verification to ensure authentic reporting and community safety.
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
                      I agree to the{' '}
                      <a href="#" className="text-[#658B6F] hover:text-[#6D9197] transition-colors">
                        Terms and Conditions
                      </a>{' '}
                      and{' '}
                      <a href="#" className="text-[#658B6F] hover:text-[#6D9197] transition-colors">
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                  {errors.agreeToTerms && (
                    <p className="text-red-500 text-sm mt-1">{errors.agreeToTerms}</p>
                  )}
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
                  <Button type="submit" className="w-full">
                    Create Account
                  </Button>
                </div>
              </div>
            )}

            {step === 1 && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#C4CDC1]"></div>
                  </div>
                  
                </div>

                <div className="grid grid-cols-2 gap-4">
                  
                 
                </div>
              </>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#6D9197]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#658B6F] hover:text-[#6D9197] font-semibold transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </Card>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[#6D9197]">
            Your information is protected with bank-level security. We never share your personal data.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
