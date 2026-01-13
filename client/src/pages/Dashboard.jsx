import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import MapView from "../components/MapView";
import ReportIncident from "../components/ReportIncident";
import IncidentsList from "../components/IncidentsList";
import axiosInstance from "../utils/axiosInstance";

const Dashboard = () => {
  const navigate = useNavigate();
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [filter, setFilter] = useState("all");
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);

  // Fetch user profile data
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Fetch reports when userData is available
  useEffect(() => {
    if (userData) {
      fetchReports();
      
      // Auto-refresh reports every 30 seconds for real-time updates
      const refreshInterval = setInterval(() => {
        fetchReports();
      }, 30000); // 30 seconds

      return () => clearInterval(refreshInterval); // Cleanup on unmount
    }
  }, [userData]);

  const fetchUserProfile = async () => {
    try {
      const response = await axiosInstance.get("/auth/me");
      const user = response.data.user || response.data;
      setUserData(user);
      // Update localStorage with latest user data
      if (user) {
        localStorage.setItem("userName", user.name);
        localStorage.setItem("userEmail", user.email);
        if (user.city) localStorage.setItem("userCity", user.city);
        if (user.state) localStorage.setItem("userState", user.state);
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
      if (err.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("token");
        localStorage.removeItem("userType");
        navigate("/login");
      }
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      // Fetch ALL reports for universal map view
      const response = await axiosInstance.get("/reports", {
        params: {
          limit: 500, // Increased limit for nationwide view
        },
      });
      const data = Array.isArray(response.data)
        ? response.data
        : response.data.reports || response.data.data || [];

      // Transform data to match component format
      const transformedData = data.map((report) => {
        const lat = report.location?.coordinates?.[1] || 0;
        const lng = report.location?.coordinates?.[0] || 0;
        const rawAddress = report.location?.address || "Unknown Location";

        // Check if address looks like coordinates (e.g., "Lat: 12.9597, Lng: 77.6405")
        const isCoordinateString =
          rawAddress.includes("Lat:") || rawAddress.includes("lat:");
        const displayAddress = isCoordinateString
          ? `${lat.toFixed(4)}, ${lng.toFixed(4)}`
          : rawAddress;

        return {
          _id: report._id,
          id: report._id,
          type: report.category?.toLowerCase() || "other",
          title: report.title,
          description: report.description,
          coordinates: {
            lat,
            lng,
          },
          location: {
            lat,
            lng,
          },
          address: displayAddress,
          status: report.status?.toLowerCase() || "pending",
          priority: report.priority?.toLowerCase() || "medium",
          upvotes: report.upVotes || report.upvotes || 0,
          downvotes: report.downVotes || report.downvotes || 0,
          reporter: report.reportedBy?.name || "Anonymous User",
          createdAt: report.createdAt,
          date: report.createdAt
            ? new Date(report.createdAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          proof: report.images?.length > 0 ? report.images[0].url : null,
        };
      });

      console.log("Transformed incidents:", transformedData);
      console.log("Sample transformed incident:", transformedData[0]);
      setIncidents(transformedData);
      setError(null);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports");
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReportSubmit = async (newReport) => {
    try {
      console.log("New report data received:", newReport);

      let latitude = newReport.location?.lat;
      let longitude = newReport.location?.lng;

      console.log("Initial coordinates:", { latitude, longitude });

      // If no coordinates provided, try to get from address
      if (!latitude || !longitude || latitude === 0 || longitude === 0) {
        if (!newReport.address) {
          alert('Please provide a location by using "Use Current Location" or entering an address.');
          return;
        }
        
        console.log("Attempting to geocode address:", newReport.address);
        try {
          const geocodeResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              newReport.address
            )}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
          );
          const geocodeData = await geocodeResponse.json();

          if (geocodeData.status === "OK" && geocodeData.results.length > 0) {
            latitude = geocodeData.results[0].geometry.location.lat;
            longitude = geocodeData.results[0].geometry.location.lng;
            console.log("Geocoded address to:", { latitude, longitude });
          } else {
            alert(
              'Could not find coordinates for the address. Please use "Use Current Location" or enter a valid address.'
            );
            return;
          }
        } catch (geocodeError) {
          console.error("Geocoding error:", geocodeError);
          alert(
            'Failed to get coordinates for address. Please try using "Use Current Location" button.'
          );
          return;
        }
      }

      // Final validation - ensure we have valid coordinates
      if (!latitude || !longitude || latitude === 0 || longitude === 0) {
        alert(
          'Invalid location. Please use "Use Current Location" or enter a valid address.'
        );
        return;
      }

      // Map frontend category values to backend expected values
      const categoryMap = {
        crime: "CRIME",
        missing: "MISSING",
        "dog-attack": "DOG",
        dog: "DOG",
        natural: "NATURAL_DISASTER",
        hazard: "HAZARD",
        natural_disaster: "NATURAL_DISASTER",
      };

      const backendCategory =
        categoryMap[newReport.type?.toLowerCase()] || "CRIME";

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('title', newReport.title);
      formData.append('category', backendCategory);
      formData.append('description', newReport.description);
      formData.append('priority', (newReport.priority || "MEDIUM").toUpperCase());
      formData.append('latitude', latitude);
      formData.append('longitude', longitude);
      formData.append('address', newReport.address || "Unknown Location");
      
      // Add file if provided
      if (newReport.proof instanceof File) {
        formData.append('files', newReport.proof);
      }

      console.log("Submitting report with file:", newReport.proof?.name || 'No file');
      const response = await axiosInstance.post("/reports/with-files", formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log("Report created:", response.data);

      setShowReportModal(false);
      fetchReports(); // Refresh the list
      alert("Report submitted successfully!");
    } catch (err) {
      console.error("Error creating report:", err);
      console.error("Error response:", err.response?.data);
      alert(
        err.response?.data?.message ||
          "Failed to create report. Please try again."
      );
    }
  };

  const handleUpvote = async (id) => {
    try {
      // Get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const response = await axiosInstance.post("/votes", {
                reportId: id,
                voteType: "UP",
                userLatitude: position.coords.latitude,
                userLongitude: position.coords.longitude,
              });

              // Update local state immediately with response data
              if (response.data.success && response.data.report) {
                setIncidents(prevIncidents => 
                  prevIncidents.map(inc => 
                    inc._id === id 
                      ? { 
                          ...inc, 
                          upvotes: response.data.report.upVotes || 0,
                          downvotes: response.data.report.downVotes || 0
                        }
                      : inc
                  )
                );
              }
            } catch (err) {
              console.error("Error upvoting:", err);
              alert(
                err.response?.data?.message ||
                  "Failed to upvote. Please try again."
              );
            }
          },
          (error) => {
            console.error("Location error:", error);
            alert("Please enable location access to vote on incidents.");
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );
      } else {
        alert(
          "Geolocation is not supported by your browser. Please use a modern browser to vote."
        );
      }
    } catch (err) {
      console.error("Error upvoting:", err);
      alert("Failed to upvote. Please try again.");
    }
  };

  const handleDownvote = async (id) => {
    try {
      // Get user's current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            try {
              const response = await axiosInstance.post("/votes", {
                reportId: id,
                voteType: "DOWN",
                userLatitude: position.coords.latitude,
                userLongitude: position.coords.longitude,
              });

              // Update local state immediately with response data
              if (response.data.success && response.data.report) {
                setIncidents(prevIncidents => 
                  prevIncidents.map(inc => 
                    inc._id === id 
                      ? { 
                          ...inc, 
                          upvotes: response.data.report.upVotes || 0,
                          downvotes: response.data.report.downVotes || 0
                        }
                      : inc
                  )
                );
              }
            } catch (err) {
              console.error("Error downvoting:", err);
              alert(
                err.response?.data?.message ||
                  "Failed to downvote. Please try again."
              );
            }
          },
          (error) => {
            console.error("Location error:", error);
            alert("Please enable location access to vote on incidents.");
          },
          {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0,
          }
        );
      } else {
        alert(
          "Geolocation is not supported by your browser. Please use a modern browser to vote."
        );
      }
    } catch (err) {
      console.error("Error downvoting:", err);
      alert("Failed to downvote. Please try again.");
    }
  };

  const filteredIncidents = incidents.filter(
    (inc) => filter === "all" || inc.type === filter
  );

  return (
    <div className="min-h-screen bg-[#CEE1DD]">
      <div className="pt-4 flex h-screen">
        {/* Sidebar */}
        <div className="w-96 bg-white shadow-lg overflow-y-auto">
          <div className="p-6">
            {/* User Welcome Section */}
            {userData && (
              <div className="mb-6 p-4 bg-gradient-to-r from-[#658B6F] to-[#6D9197] rounded-lg text-white">
                <p className="text-sm font-semibold opacity-90">{userData.name}</p>
                <p className="text-xs opacity-75">{userData.email}</p>
                {(userData.city || userData.state) && (
                  <div className="mt-2 pt-2 border-t border-white border-opacity-20 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <p className="text-xs opacity-90">
                      {[userData.city, userData.state].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-[#28363D]">
                Safety Reports
              </h1>
              <button
                onClick={() => setShowReportModal(true)}
                className="bg-[#658B6F] hover:bg-[#6D9197] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Report
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { value: "all", label: "All", icon: "/assets/images/list.png" },
                {
                  value: "crime",
                  label: "Crime",
                  icon: "/assets/images/handcuff.png",
                },
                {
                  value: "missing",
                  label: "Missing",
                  icon: "/assets/images/question.png",
                },
                {
                  value: "dog",
                  label: "Dog Attack",
                  icon: "/assets/images/pets.png",
                },
                {
                  value: "natural_disaster",
                  label: "Natural",
                  icon: "/assets/images/flood.png",
                },
              ].map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    filter === value
                      ? "bg-[#658B6F] text-white"
                      : "bg-[#C4CDC1] text-[#28363D] hover:bg-[#99AEAD]"
                  }`}
                >
                  <img src={icon} alt={label} className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#CEE1DD] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[#28363D]">
                  {incidents.length}
                </div>
                <div className="text-sm text-[#2F575D]">Total Reports</div>
              </div>
              {/* <div className="bg-[#CEE1DD] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[#28363D]">
                  {incidents.filter((i) => i.status === "verified").length}
                </div>
                <div className="text-sm text-[#2F575D]"></div>
              </div> */}
            </div>

            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#658B6F] mx-auto mb-2"></div>
                  <p className="text-[#2F575D]">Loading reports...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <p>{error}</p>
                <button
                  onClick={fetchReports}
                  className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && incidents.length === 0 && (
              <div className="text-center py-8 px-4">
                <div className="bg-[#CEE1DD] rounded-lg p-6">
                  <svg
                    className="w-16 h-16 mx-auto mb-4 text-[#6D9197]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-[#28363D] font-semibold mb-2">
                    No reports found
                  </p>
                  <p className="text-sm text-[#2F575D]">
                    {userData?.city && userData?.state
                      ? `No safety reports found in ${userData.city}, ${userData.state}`
                      : "No safety reports available in your area"}
                  </p>
                  <p className="text-xs text-[#99AEAD] mt-2">
                    Be the first to report an incident in your area!
                  </p>
                </div>
              </div>
            )}

            {/* Incidents List */}
            {!loading && !error && incidents.length > 0 && (
              <IncidentsList
                incidents={filteredIncidents}
                onIncidentClick={setSelectedIncident}
                onUpvote={handleUpvote}
                onDownvote={handleDownvote}
                selectedId={selectedIncident?.id}
              />
            )}
          </div>
        </div>

        {/* Map View */}
        <div className="flex-1">
          <MapView
            incidents={filteredIncidents}
            selectedIncident={selectedIncident}
            onIncidentSelect={setSelectedIncident}
            onUpvote={handleUpvote}
            onDownvote={handleDownvote}
          />
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <ReportIncident
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportSubmit}
        />
      )}
    </div>
  );
};

export default Dashboard;
