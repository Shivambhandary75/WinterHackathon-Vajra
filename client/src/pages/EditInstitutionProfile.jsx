import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';
import axiosInstance from '../utils/axiosInstance';

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
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');

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
    fetchInstitutionProfile();
  }, []);

  const fetchInstitutionProfile = async () => {
    try {
      setIsFetching(true);
      setErrors({});
      
      console.log('Fetching institution profile...');
      const response = await axiosInstance.get('/institutions/me');
      console.log('Profile response:', response.data);
      
      if (response.data.success) {
        const institution = response.data.data;
        const newFormData = {
          institutionName: institution.institutionName || '',
          institutionType: institution.institutionType || '',
          registrationNumber: institution.registrationNumber || '',
          officialEmail: institution.officialEmail || '',
          contactPerson: institution.contactPerson?.name || '',
          designation: institution.contactPerson?.designation || '',
          phone: institution.contactPerson?.phone || '',
          address: institution.address?.street || '',
          state: institution.address?.state || '',
          city: institution.address?.city || '',
          pincode: institution.address?.pincode || '',
        };
        console.log('Setting form data:', newFormData);
        setFormData(newFormData);
      }
    } catch (error) {
      console.error('Error fetching institution profile:', error);
      console.error('Error response:', error.response);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        setErrors({ general: 'Session expired. Please login again.' });
        setTimeout(() => navigate('/institution-login'), 2000);
      } else {
        setErrors({ general: error.response?.data?.message || 'Failed to load profile data.' });
      }
    } finally {
      setIsFetching(false);
    }
  };

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
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrors({});
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    
    try {
      // Update profile information
      const profileData = {
        contactPerson: formData.contactPerson.trim(),
        designation: formData.designation.trim(),
        phone: formData.phone.replace(/\D/g, ''), // Remove non-digits
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.replace(/\D/g, ''), // Remove non-digits
      };

      console.log('Updating profile with data:', profileData);
      const response = await axiosInstance.put('/institutions/profile', profileData);
      console.log('Update response:', response.data);

      if (response.data.success) {
        setSuccessMessage('Institution profile updated successfully!');
        
        // Update localStorage with new name if needed
        localStorage.setItem("institutionName", formData.institutionName);
        
        // Refresh the profile data after a short delay
        setTimeout(() => {
          fetchInstitutionProfile();
          // Scroll to top to show success message
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 500);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      console.error('Error details:', error.response?.data);
      setErrors({ 
        general: error.response?.data?.message || error.message || 'Failed to update profile. Please try again.' 
      });
      // Scroll to top to show error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Edit Institution Profile</h1>
          <p className="text-gray-600">Update your institution information</p>
        </div>

        {isFetching ? (
          <Card className="p-8">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading profile data...</p>
            </div>
          </Card>
        ) : (
          <Card className="p-8">
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
                {successMessage}
              </div>
            )}

            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                {errors.general}
              </div>
            )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Institution Details */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Institution Details</h2>
              <p className="text-sm text-gray-500 mb-4">These fields are read-only and cannot be changed.</p>
              
              <div className="space-y-4">
                <Input
                  label="Institution Name"
                  type="text"
                  name="institutionName"
                  value={formData.institutionName}
                  onChange={handleChange}
                  error={errors.institutionName}
                  required
                  disabled
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
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-100 cursor-not-allowed"
                      required
                      disabled
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
                    disabled
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
                  disabled
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
        )}
      </div>
    </div>
  );
};

export default EditInstitutionProfile;
