import { useState, useEffect } from "react";
import MapView from "../components/MapView";
import axiosInstance from "../utils/axiosInstance";

const SafetyMap = () => {
  const [filter, setFilter] = useState("all");
  const [timeRange, setTimeRange] = useState("week");
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch verified reports from server
  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      // Fetch verified reports from map endpoint
      const response = await axiosInstance.get("/map/reports", {
        params: {
          status: "verified",
        },
      });

      const data = Array.isArray(response.data)
        ? response.data
        : response.data.data || [];

      // Transform data to match component format
      const transformedData = data.map((report) => ({
        id: report._id,
        type: report.category?.toLowerCase() || "other",
        title: report.title,
        description: report.description,
        location: {
          lat: report.location?.coordinates?.[1] || 0,
          lng: report.location?.coordinates?.[0] || 0,
        },
        address: report.location?.address || "Unknown Location",
        status: "verified",
        upvotes: report.upvotes || 0,
        downvotes: report.downvotes || 0,
        date: report.createdAt
          ? new Date(report.createdAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        severity: calculateSeverity(report.priority, report.upvotes),
      }));

      setIncidents(transformedData);
      setError(null);
    } catch (err) {
      console.error("Error fetching incidents:", err);
      setError("Failed to load safety reports");
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateSeverity = (priority, upvotes) => {
    if (priority === "CRITICAL" || upvotes > 50) return "critical";
    if (priority === "HIGH" || upvotes > 30) return "high";
    if (priority === "MEDIUM" || upvotes > 10) return "medium";
    return "low";
  };

  const handleUpvote = async (id) => {
    try {
      await axiosInstance.post("/votes", {
        reportId: id,
        voteType: "upvote",
      });
      // Update local state
      setIncidents(
        incidents.map((inc) =>
          inc.id === id ? { ...inc, upvotes: inc.upvotes + 1 } : inc
        )
      );
    } catch (err) {
      console.error("Error upvoting:", err);
    }
  };

  const handleDownvote = async (id) => {
    try {
      await axiosInstance.post("/votes", {
        reportId: id,
        voteType: "downvote",
      });
      // Update local state
      setIncidents(
        incidents.map((inc) =>
          inc.id === id ? { ...inc, downvotes: (inc.downvotes || 0) + 1 } : inc
        )
      );
    } catch (err) {
      console.error("Error downvoting:", err);
    }
  };

  const filteredIncidents = incidents.filter(
    (inc) => filter === "all" || inc.type === filter
  );

  const getSafetyScore = () => {
    const total = incidents.length;
    const critical = incidents.filter((i) => i.severity === "critical").length;
    const high = incidents.filter((i) => i.severity === "high").length;

    const score = Math.max(0, 100 - (critical * 20 + high * 10));
    return score;
  };

  const safetyScore = getSafetyScore();
  const getSafetyColor = () => {
    if (safetyScore >= 80) return "text-[#658B6F]";
    if (safetyScore >= 60) return "text-[#6D9197]";
    if (safetyScore >= 40) return "text-[#C4CDC1]";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-[#CEE1DD]">
      <div className="pt-4 flex h-screen">
        {/* Info Sidebar */}
        <div className="w-96 bg-white shadow-lg overflow-y-auto">
          <div className="p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-[#28363D] mb-2">
                Safety Awareness Map
              </h1>
              <p className="text-sm text-[#2F575D]">
                Real-time safety information for travelers and residents
              </p>
            </div>

            {/* Safety Score */}
            <div className="bg-linear-to-br from-[#28363D] to-[#2F575D] rounded-xl p-6 mb-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[#CEE1DD] text-sm mb-1">
                    Area Safety Score
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-5xl font-bold ${getSafetyColor()}`}>
                      {safetyScore}
                    </span>
                    <span className="text-2xl opacity-60">/100</span>
                  </div>
                </div>
                <div className="text-6xl">
                  {safetyScore >= 80
                    ? "right"
                    : safetyScore >= 60
                    ? "warning"
                    : "alert"}
                </div>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#658B6F] transition-all duration-500"
                  style={{ width: `${safetyScore}%` }}
                ></div>
              </div>
              <p className="text-xs text-[#CEE1DD] mt-3">
                Based on {incidents.length} verified reports in the last{" "}
                {timeRange}
              </p>
            </div>

            {/* Time Range Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#28363D] mb-3">
                Time Range
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "day", label: "24h" },
                  { value: "week", label: "7 days" },
                  { value: "month", label: "30 days" },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setTimeRange(value)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                      timeRange === value
                        ? "bg-[#658B6F] text-white"
                        : "bg-[#CEE1DD] text-[#28363D] hover:bg-[#C4CDC1]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Incident Type Filter */}
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#28363D] mb-3">
                Filter by Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  {
                    value: "all",
                    label: "All",
                    icon: "/assets/images/location.png",
                  },
                  {
                    value: "crime",
                    label: "Crime",
                    icon: "/assets/images/handcuff.png",
                  },
                  {
                    value: "dog-attack",
                    label: "Dog Attack",
                    icon: "/assets/images/pets.png",
                  },
                  {
                    value: "natural",
                    label: "Natural",
                    icon: "/assets/images/flood.png",
                  },
                ].map(({ value, label, icon }) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    className={`px-4 py-2 rounded-lg transition-colors text-sm flex items-center justify-center gap-2 ${
                      filter === value
                        ? "bg-[#658B6F] text-white"
                        : "bg-[#CEE1DD] text-[#28363D] hover:bg-[#C4CDC1]"
                    }`}
                  >
                    <img src={icon} alt={label} className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Risk Zones */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-[#28363D] mb-4">
                Nearby Risk Zones
              </h3>

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#658B6F] mx-auto mb-2"></div>
                    <p className="text-sm text-[#2F575D]">Loading...</p>
                  </div>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                  <p>{error}</p>
                  <button
                    onClick={fetchIncidents}
                    className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                  >
                    Retry
                  </button>
                </div>
              )}

              {/* Empty State */}
              {!loading && !error && incidents.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-sm text-[#2F575D]">
                    No verified incidents found
                  </p>
                </div>
              )}

              {/* Incidents List */}
              {!loading && !error && incidents.length > 0 && (
                <div className="space-y-3">
                  {filteredIncidents.map((incident) => (
                    <div
                      key={incident.id}
                      className="bg-[#CEE1DD] rounded-lg p-4"
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={
                            {
                              crime: "/assets/images/handcuff.png",
                              missing: "/assets/images/question.png",
                              "dog-attack": "/assets/images/pets.png",
                              natural: "/assets/images/flood.png",
                            }[incident.type]
                          }
                          alt={incident.type}
                          className="w-8 h-8"
                        />
                        <div className="flex-1">
                          <div className="font-semibold text-[#28363D] mb-1">
                            {incident.title}
                          </div>
                          <div className="text-xs text-[#2F575D] mb-2">
                            {incident.address}
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                incident.severity === "critical"
                                  ? "bg-red-500 text-white"
                                  : incident.severity === "high"
                                  ? "bg-orange-500 text-white"
                                  : incident.severity === "medium"
                                  ? "bg-yellow-500 text-white"
                                  : "bg-green-500 text-white"
                              }`}
                            >
                              {incident.severity}
                            </span>
                            <span className="text-xs text-[#658B6F]">
                              {" "}
                              {incident.upvotes}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Safety Tips */}
            <div className="bg-[#658B6F] rounded-xl p-6 text-white">
              <h3 className="font-bold text-lg mb-3"> Safety Tips</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Avoid high-risk areas, especially at night</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Keep emergency contacts readily available</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Share your location with trusted contacts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span>•</span>
                  <span>Report suspicious activities immediately</span>
                </li>
              </ul>
            </div>

            {/* Tourist Info */}
            <div className="mt-6 border-t border-[#CEE1DD] pt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="text-4xl">suit</div>
                <div>
                  <h3 className="font-bold text-[#28363D]">
                    Tourist & New Residents
                  </h3>
                  <p className="text-xs text-[#2F575D]">
                    Stay informed about your surroundings
                  </p>
                </div>
              </div>
              <div className="bg-[#CEE1DD] rounded-lg p-4 text-sm text-[#2F575D]">
                This platform provides real-time safety information verified by
                the community and local authorities. All displayed incidents are
                verified to ensure accuracy.
              </div>
            </div>
          </div>
        </div>

        {/* Map View */}
        <div className="flex-1 relative">
          <MapView
            incidents={filteredIncidents}
            selectedIncident={selectedIncident}
            onIncidentSelect={setSelectedIncident}
            onUpvote={handleUpvote}
            onDownvote={handleDownvote}
          />

          {/* Floating Info Card */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl px-6 py-3">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-[#28363D]">
                  {incidents.length}
                </div>
                <div className="text-xs text-[#2F575D]">Total Incidents</div>
              </div>
              <div className="h-8 w-px bg-[#CEE1DD]"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-[#658B6F]">
                  {incidents.filter((i) => i.status === "verified").length}
                </div>
                <div className="text-xs text-[#2F575D]">Verified</div>
              </div>
              <div className="h-8 w-px bg-[#CEE1DD]"></div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getSafetyColor()}`}>
                  {safetyScore}
                </div>
                <div className="text-xs text-[#2F575D]">Safety Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyMap;
