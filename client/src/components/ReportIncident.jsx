import { useState } from 'react';

const ReportIncident = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    type: 'crime',
    title: '',
    description: '',
    location: { lat: 0, lng: 0 },
    address: '',
    priority: 'medium',
    proof: null,
  });
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [proofPreview, setProofPreview] = useState(null);

  const incidentTypes = [
    { value: 'crime', label: 'Crime', icon: '/assets/images/handcuff.png', description: 'Theft, assault, vandalism' },
    { value: 'missing', label: 'Missing Person', icon: '/assets/images/question.png', description: 'Missing individuals' },
    { value: 'dog-attack', label: 'Dog Attack', icon: '/assets/images/pets.png', description: 'Stray dog incidents' },
    { value: 'natural', label: 'Natural Danger', icon: '/assets/images/flood.png', description: 'Floods, landslides, hazards' },
  ];

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });
          setUseCurrentLocation(true);
          // Reverse geocoding would happen here in production
          setFormData(prev => ({
            ...prev,
            address: `Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`,
          }));
        },
        (error) => {
          alert('Unable to get location. Please enter address manually.');
        }
      );
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, proof: file.name });
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.address) {
      alert('Please fill in all required fields');
      return;
    }
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#28363D] text-white p-6 rounded-t-xl flex justify-between items-center">
          <h2 className="text-2xl font-bold">Report Incident</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-[#CEE1DD] transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Incident Type Selection */}
          <div>
            <label className="block text-[#28363D] font-semibold mb-3">Incident Type *</label>
            <div className="grid grid-cols-2 gap-3">
              {incidentTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    formData.type === type.value
                      ? 'border-[#658B6F] bg-[#CEE1DD]'
                      : 'border-[#C4CDC1] hover:border-[#99AEAD]'
                  }`}
                >
                  <img src={type.icon} alt={type.label} className="w-10 h-10 mb-2" />
                  <div className="font-semibold text-[#28363D]">{type.label}</div>
                  <div className="text-xs text-[#2F575D] mt-1">{type.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[#28363D] font-semibold mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Brief title for the incident"
              className="w-full px-4 py-3 rounded-lg border-2 border-[#C4CDC1] focus:border-[#658B6F] focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[#28363D] font-semibold mb-2">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide detailed information about the incident"
              rows={4}
              className="w-full px-4 py-3 rounded-lg border-2 border-[#C4CDC1] focus:border-[#658B6F] focus:outline-none transition-colors resize-none"
              required
            />
          </div>

          {/* Threat Level / Priority */}
          <div>
            <label className="block text-[#28363D] font-semibold mb-3">Threat Level *</label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'low' })}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  formData.priority === 'low'
                    ? 'border-green-500 bg-green-50'
                    : 'border-[#C4CDC1] hover:border-green-400'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-green-500 mx-auto mb-1"></div>
                <div className="text-xs font-semibold text-[#28363D]">Low</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'medium' })}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  formData.priority === 'medium'
                    ? 'border-yellow-500 bg-yellow-50'
                    : 'border-[#C4CDC1] hover:border-yellow-400'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-yellow-500 mx-auto mb-1"></div>
                <div className="text-xs font-semibold text-[#28363D]">Medium</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'high' })}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  formData.priority === 'high'
                    ? 'border-orange-500 bg-orange-50'
                    : 'border-[#C4CDC1] hover:border-orange-400'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-orange-500 mx-auto mb-1"></div>
                <div className="text-xs font-semibold text-[#28363D]">High</div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, priority: 'critical' })}
                className={`p-3 rounded-lg border-2 transition-all text-center ${
                  formData.priority === 'critical'
                    ? 'border-red-500 bg-red-50'
                    : 'border-[#C4CDC1] hover:border-red-400'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-red-500 mx-auto mb-1"></div>
                <div className="text-xs font-semibold text-[#28363D]">Critical</div>
              </button>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-[#28363D] font-semibold mb-2">
              Location *
            </label>
            <div className="space-y-3">
              <button
                type="button"
                onClick={handleLocationClick}
                className="w-full bg-[#6D9197] hover:bg-[#658B6F] text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                {useCurrentLocation ? 'Location Captured' : 'Use Current Location'}
              </button>
              
              <div className="text-center text-[#2F575D] text-sm">or</div>
              
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address manually or click map"
                className="w-full px-4 py-3 rounded-lg border-2 border-[#C4CDC1] focus:border-[#658B6F] focus:outline-none transition-colors"
                required
              />
            </div>
          </div>

          {/* Proof Upload */}
          <div>
            <label className="block text-[#28363D] font-semibold mb-2">
              Proof (Optional)
            </label>
            <div className="border-2 border-dashed border-[#C4CDC1] rounded-lg p-6 text-center hover:border-[#658B6F] transition-colors">
              <input
                type="file"
                id="proof-upload"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="proof-upload" className="cursor-pointer">
                {proofPreview ? (
                  <div className="space-y-2">
                    <img src={proofPreview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
                    <p className="text-[#658B6F] text-sm">Click to change</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <svg className="w-12 h-12 mx-auto text-[#99AEAD]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-[#2F575D]">Upload images or documents</p>
                    <p className="text-xs text-[#99AEAD]">PNG, JPG, PDF up to 10MB</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Verification Notice */}
          <div className="bg-[#CEE1DD] border-l-4 border-[#658B6F] p-4 rounded">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-[#658B6F] shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
              <div className="text-sm text-[#2F575D]">
                <p className="font-semibold text-[#28363D] mb-1">Identity Verification</p>
                <p>Your report will be verified through government-issued ID or location-based verification to ensure authenticity.</p>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-lg border-2 border-[#C4CDC1] text-[#28363D] hover:bg-[#CEE1DD] transition-colors font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 rounded-lg bg-[#658B6F] hover:bg-[#6D9197] text-white transition-colors font-semibold"
            >
              Submit Report
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIncident;
