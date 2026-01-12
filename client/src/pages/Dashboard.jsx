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
      // Fetch reports - backend will filter based on authenticated user's location
      const response = await axiosInstance.get("/reports", {
        params: {
          userCity: userData?.city,
          userState: userData?.state,
          limit: 100, // Get more reports to display
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
          upvotes: report.upvotes || 0,
          downvotes: report.downvotes || 0,
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

      let latitude = newReport.location?.lat || 0;
      let longitude = newReport.location?.lng || 0;

      console.log("Initial coordinates:", { latitude, longitude });

      // Only geocode if BOTH coordinates are 0 and address exists
      if (latitude === 0 && longitude === 0 && newReport.address) {
        console.log("Attempting to geocode address:", newReport.address);
        try {
          const geocodeResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
              newReport.address
            )}&key=AIzaSyD_baF0etMza8OwVOQlTfHL1bTpbLGTi_Y`
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

      // Validate coordinates
      if (latitude === 0 && longitude === 0) {
        alert(
          'Please provide a valid location either by using "Use Current Location" or entering an address.'
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

      const reportData = {
        title: newReport.title,
        category: backendCategory,
        description: newReport.description,
        priority: (newReport.priority || "MEDIUM").toUpperCase(),
        latitude: latitude,
        longitude: longitude,
        address: newReport.address || "Unknown Location",
        images: newReport.proof ? [newReport.proof] : [],
      };

      console.log("Submitting report:", reportData);
      const response = await axiosInstance.post("/reports", reportData);
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

              // Update local state with response data
              if (response.data.success) {
                fetchReports(); // Refresh to get updated vote counts
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

              // Update local state with response data
              if (response.data.success) {
                fetchReports(); // Refresh to get updated vote counts
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
                <h2 className="text-lg font-semibold mb-1">Welcome back!</h2>
                <p className="text-sm opacity-90">{userData.name}</p>
                <p className="text-xs opacity-75">{userData.email}</p>
                {userData.city && userData.state && (
                  <div className="mt-2 pt-2 border-t border-white border-opacity-20">
                    <p className="text-xs opacity-90">
                      📍 Showing reports from: {userData.city}, {userData.state}
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
                  value: "dog-attack",
                  label: "Dog Attack",
                  icon: "/assets/images/pets.png",
                },
                {
                  value: "NATURAL_DISASTER",
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
              <div className="bg-[#CEE1DD] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[#28363D]">
                  {incidents.filter((i) => i.status === "verified").length}
                </div>
                <div className="text-sm text-[#2F575D]">Verified</div>
              </div>
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
