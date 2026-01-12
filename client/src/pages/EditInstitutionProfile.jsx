import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';

const EditInstitutionProfile = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    institutionName: '',
    institutionType: '',
    registrationNumber: '',
    officialEmail: '',
    contactPerson: '',
    designation: '',
    phone: '',
    address: '',
    state: '',
    city: '',
    pincode: '',
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [changePassword, setChangePassword] = useState(false);

  const institutionTypes = [
    'Police Department',
    'Municipal Corporation',
    'Disaster Management',
    'Fire Department',
    'Health Department',
    'Forest Department',
    'Other Government Body',
  ];

  // Load institution data on component mount
  useEffect(() => {
    // TODO: Fetch institution data from API/localStorage
    const institutionData = {
      institutionName: 'Mumbai Police Department',
      institutionType: 'Police Department',
      registrationNumber: 'REG123456',
      officialEmail: 'contact@mumbaipolice.gov.in',
      contactPerson: 'Officer Kumar',
      designation: 'Senior Inspector',
      phone: '9876543210',
      address: 'Crawford Market, Mumbai',
      state: 'Maharashtra',
      city: 'Mumbai',
      pincode: '400001',
    };
    setFormData(prev => ({ ...prev, ...institutionData }));
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
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

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.institutionName) {
      newErrors.institutionName = 'Institution name is required';
    }
    
    if (!formData.institutionType) {
      newErrors.institutionType = 'Institution type is required';
    }
    
    if (!formData.registrationNumber) {
      newErrors.registrationNumber = 'Registration number is required';
    }
    
    if (!formData.officialEmail) {
      newErrors.officialEmail = 'Official email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.officialEmail)) {
      newErrors.officialEmail = 'Email is invalid';
    }
    
    if (!formData.contactPerson) {
      newErrors.contactPerson = 'Contact person name is required';
    }
    
    if (!formData.designation) {
      newErrors.designation = 'Designation is required';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[0-9]{10}$/.test(formData.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    if (!formData.address) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.state) {
      newErrors.state = 'State is required';
    }
    
    if (!formData.city) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.pincode) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^[0-9]{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }

    // Password validation (only if changing password)
    if (changePassword) {
      if (!formData.currentPassword) {
        newErrors.currentPassword = 'Current password is required';
      }
      
      if (!formData.newPassword) {
        newErrors.newPassword = 'New password is required';
      } else if (formData.newPassword.length < 8) {
        newErrors.newPassword = 'Password must be at least 8 characters';
      }
      
      if (!formData.confirmNewPassword) {
        newErrors.confirmNewPassword = 'Please confirm your new password';
      } else if (formData.newPassword !== formData.confirmNewPassword) {
        newErrors.confirmNewPassword = 'Passwords do not match';
      }
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: API call to update profile
      console.log('Institution profile update submitted:', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccessMessage('Institution profile updated successfully!');
      
      // Clear password fields after successful update
      if (changePassword) {
        setFormData(prev => ({
          ...prev,
          currentPassword: '',
          newPassword: '',
          confirmNewPassword: '',
        }));
        setChangePassword(false);
      }
    } catch (error) {
      setErrors({ submit: 'Failed to update profile. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Institution Profile</h1>
          <p className="text-gray-600">Update your institution information</p>
        </div>

        <Card className="p-8">
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {successMessage}
            </div>
          )}

          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {errors.submit}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Institution Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Institution Details</h2>
              
              <div className="space-y-4">
                <Input
                  label="Institution Name"
                  type="text"
                  name="institutionName"
                  value={formData.institutionName}
                  onChange={handleChange}
                  error={errors.institutionName}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Institution Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="institutionType"
                      value={formData.institutionType}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select Type</option>
                      {institutionTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                    {errors.institutionType && (
                      <p className="mt-1 text-sm text-red-600">{errors.institutionType}</p>
                    )}
                  </div>

                  <Input
                    label="Registration Number"
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    error={errors.registrationNumber}
                    required
                  />
                </div>

                <Input
                  label="Official Email"
                  type="email"
                  name="officialEmail"
                  value={formData.officialEmail}
                  onChange={handleChange}
                  error={errors.officialEmail}
                  required
                />
              </div>
            </div>

            {/* Contact Person Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Contact Person Details</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Contact Person Name"
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    error={errors.contactPerson}
                    required
                  />

                  <Input
                    label="Designation"
                    type="text"
                    name="designation"
                    value={formData.designation}
                    onChange={handleChange}
                    error={errors.designation}
                    required
                  />
                </div>

                <Input
                  label="Phone Number"
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  placeholder="10-digit phone number"
                  required
                />
              </div>
            </div>

            {/* Address Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Address Information</h2>
              
              <div className="space-y-4">
                <Input
                  label="Address"
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  error={errors.address}
                  required
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="State"
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    error={errors.state}
                    required
                  />

                  <Input
                    label="City"
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    error={errors.city}
                    required
                  />

                  <Input
                    label="Pincode"
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    error={errors.pincode}
                    placeholder="6-digit pincode"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Change Password Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Change Password</h2>
                <button
                  type="button"
                  onClick={() => setChangePassword(!changePassword)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  {changePassword ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {changePassword && (
                <div className="space-y-4">
                  <Input
                    label="Current Password"
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    error={errors.currentPassword}
                    required={changePassword}
                  />

                  <Input
                    label="New Password"
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    error={errors.newPassword}
                    placeholder="At least 8 characters"
                    required={changePassword}
                  />

                  <Input
                    label="Confirm New Password"
                    type="password"
                    name="confirmNewPassword"
                    value={formData.confirmNewPassword}
                    onChange={handleChange}
                    error={errors.confirmNewPassword}
                    required={changePassword}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default EditInstitutionProfile;
