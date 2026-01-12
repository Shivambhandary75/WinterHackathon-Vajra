import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axiosInstance from "../utils/axiosInstance";

const InstitutionDashboard = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [institutionData, setInstitutionData] = useState(null);

  // Fetch institution profile data
  useEffect(() => {
    fetchInstitutionProfile();
    fetchReports();
  }, []);

  const fetchInstitutionProfile = async () => {
    try {
      const response = await axiosInstance.get("/institutions/me");
      setInstitutionData(response.data.institution || response.data);
      // Update localStorage with latest institution data
      if (response.data.institution) {
        localStorage.setItem('institutionName', response.data.institution.institutionName);
        localStorage.setItem('institutionEmail', response.data.institution.officialEmail);
      }
    } catch (err) {
      console.error("Error fetching institution profile:", err);
      if (err.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('userType');
        navigate("/institution-login");
      }
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/reports");
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
        status: report.status?.toLowerCase() || "pending",
        upvotes: report.upvotes || 0,
        downvotes: report.downvotes || 0,
        reporter: report.reportedBy?.name || "Anonymous User",
        reporterId: report.reportedBy?._id || "",
        date: report.createdAt
          ? new Date(report.createdAt).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
        proof: report.images?.length > 0 ? report.images[0].url : null,
        assignedTo: report.assignedTo || null,
        priority: report.priority?.toLowerCase() || "medium",
        institutionNotes: report.institutionNotes || "",
      }));

      setReports(transformedData);
      setError(null);
    } catch (err) {
      console.error("Error fetching reports:", err);
      setError("Failed to load reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await axiosInstance.patch(`/reports/${id}`, {
        status: newStatus.toUpperCase(),
      });
      // Update local state
      setReports(
        reports.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Failed to update status");
    }
  };

  const handleAssignment = async (id, officer) => {
    try {
      await axiosInstance.post(`/assignments`, {
        reportId: id,
        assignedTo: officer,
      });
      // Update local state
      setReports(
        reports.map((r) =>
          r.id === id ? { ...r, assignedTo: officer, status: "in-progress" } : r
        )
      );
    } catch (err) {
      console.error("Error assigning report:", err);
      alert("Failed to assign report");
    }
  };

  const handleNotesUpdate = async (id, notes) => {
    try {
      await axiosInstance.patch(`/reports/${id}`, {
        institutionNotes: notes,
      });
      // Update local state
      setReports(
        reports.map((r) =>
          r.id === id ? { ...r, institutionNotes: notes } : r
        )
      );
    } catch (err) {
      console.error("Error updating notes:", err);
      alert("Failed to update notes");
    }
  };

  const filteredReports = reports.filter(
    (r) => filter === "all" || r.status === filter
  );

  const stats = {
    total: reports.length,
    pending: reports.filter((r) => r.status === "pending").length,
    inProgress: reports.filter((r) => r.status === "in-progress").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  };

  const getPriorityColor = (priority) => {
    const colors = {
      critical: "bg-red-500",
      high: "bg-orange-500",
      medium: "bg-yellow-500",
      low: "bg-green-500",
    };
    return colors[priority] || "bg-gray-500";
  };

  const getPriorityButtonColor = (priority) => {
    return "bg-[#2F575D] hover:bg-[#28363D]";
  };

  return (
    <div className="min-h-screen bg-[#CEE1DD]">
      <div className="pt-4 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header with Institution Info */}
          <div className="mb-8">
            {institutionData && (
              <div className="bg-gradient-to-r from-[#658B6F] to-[#6D9197] rounded-lg p-6 mb-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{institutionData.institutionName}</h2>
                    <p className="text-sm opacity-90">{institutionData.institutionType}</p>
                    <p className="text-xs opacity-75 mt-1">{institutionData.officialEmail}</p>
                  </div>
                  <div className="text-right">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-white bg-opacity-20 text-sm">
                      {institutionData.isVerified ? (
                        <><span className="mr-2">✓</span> Verified</>
                      ) : (
                        <><span className="mr-2">⏳</span> Pending Verification</>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <h1 className="text-3xl font-bold text-[#28363D] mb-2">
              Institution Dashboard
            </h1>
            <p className="text-[#2F575D]">
              Monitor and manage community safety reports
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#2F575D] text-sm mb-1">Total Reports</p>
                  <p className="text-3xl font-bold text-[#28363D]">
                    {stats.total}
                  </p>
                </div>
                <div className="bg-[#CEE1DD] p-4 rounded-lg">
                  <img
                    src="/assets/images/siren.png"
                    alt="Reports"
                    className="w-8 h-8"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#2F575D] text-sm mb-1">Pending Action</p>
                  <p className="text-3xl font-bold text-[#28363D]">
                    {stats.pending}
                  </p>
                </div>
                <div className="bg-[#CEE1DD] p-4 rounded-lg">
                  <img
                    src="/assets/images/question.png"
                    alt="Pending"
                    className="w-8 h-8"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#2F575D] text-sm mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-[#28363D]">
                    {stats.inProgress}
                  </p>
                </div>
                <div className="bg-[#CEE1DD] p-4 rounded-lg">
                  <img
                    src="/assets/images/magnifying-glass.png"
                    alt="In Progress"
                    className="w-8 h-8"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#2F575D] text-sm mb-1">Resolved</p>
                  <p className="text-3xl font-bold text-[#28363D]">
                    {stats.resolved}
                  </p>
                </div>
                <div className="bg-[#CEE1DD] p-4 rounded-lg">
                  <svg
                    className="w-8 h-8 text-[#658B6F]"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-wrap gap-3">
              {[
                { value: "all", label: "All Reports" },
                { value: "pending", label: "Pending" },
                { value: "in-progress", label: "In Progress" },
                { value: "resolved", label: "Resolved" },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    filter === value
                      ? "bg-[#658B6F] text-white shadow-lg"
                      : "bg-[#CEE1DD] text-[#28363D] hover:bg-[#C4CDC1]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#658B6F] mx-auto mb-4"></div>
                  <p className="text-[#2F575D]">Loading reports...</p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 m-4 rounded">
                <p className="mb-3">{error}</p>
                <button
                  onClick={fetchReports}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Empty State */}
            {!loading && !error && reports.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[#2F575D]">No reports found</p>
              </div>
            )}

            {/* Table Content */}
            {!loading && !error && reports.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#28363D] text-white">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Threat Level
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Type
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Title
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Location
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Community Vote
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Assigned To
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#CEE1DD]">
                    {filteredReports.map((report) => (
                      <tr
                        key={report.id}
                        className="hover:bg-[#CEE1DD] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-block w-3 h-3 rounded-full ${getPriorityColor(
                                report.priority
                              )}`}
                            ></span>
                            <span
                              className={`text-xs font-bold uppercase ${
                                report.priority === "critical"
                                  ? "text-red-600"
                                  : report.priority === "high"
                                  ? "text-orange-600"
                                  : report.priority === "medium"
                                  ? "text-yellow-600"
                                  : "text-green-600"
                              }`}
                            >
                              {report.priority}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <img
                            src={
                              {
                                crime: "/assets/images/handcuff.png",
                                missing: "/assets/images/question.png",
                                "dog-attack": "/assets/images/pets.png",
                                natural: "/assets/images/flood.png",
                              }[report.type]
                            }
                            alt={report.type}
                            className="w-8 h-8"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-[#28363D]">
                            {report.title}
                          </div>
                          <div className="text-xs text-[#2F575D]">
                            {report.date}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#2F575D] max-w-xs truncate">
                          {report.address}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <img
                                src="/assets/images/upVote.png"
                                alt="Upvote"
                                className="w-4 h-4"
                              />
                              <span className="font-semibold text-gray-900">
                                {report.upvotes}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <img
                                src="/assets/images/downVote.png"
                                alt="Downvote"
                                className="w-4 h-4"
                              />
                              <span className="font-semibold text-gray-900">
                                {report.downvotes}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                              report.status === "pending"
                                ? "bg-[#779e9c] text-white"
                                : report.status === "in-progress"
                                ? "bg-[#1ab5d0] text-white"
                                : report.status === "resolved"
                                ? "bg-[#250cb2] text-white"
                                : "bg-gray-400 text-white"
                            }`}
                          >
                            {report.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-[#2F575D]">
                          {report.assignedTo || "Unassigned"}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedIncident(report)}
                            className={`text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors border-4 ${getPriorityButtonColor(
                              report.priority
                            )} ${
                              report.status === "pending"
                                ? ""
                                : report.status === "in-progress"
                                ? ""
                                : report.status === "resolved"
                                ? ""
                                : "border-gray-400"
                            }`}
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#28363D] text-white p-6 rounded-t-xl flex justify-between items-center">
              <h2 className="text-2xl font-bold">Review Report</h2>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-white hover:text-[#CEE1DD] transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-[#28363D] mb-2">
                  {selectedIncident.title}
                </h3>
                <p className="text-[#2F575D]">{selectedIncident.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-[#2F575D]">
                    Threat Level
                  </label>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block w-3 h-3 rounded-full ${getPriorityColor(
                        selectedIncident.priority
                      )}`}
                    ></span>
                    <span
                      className={`text-sm font-bold uppercase ${
                        selectedIncident.priority === "critical"
                          ? "text-red-600"
                          : selectedIncident.priority === "high"
                          ? "text-orange-600"
                          : selectedIncident.priority === "medium"
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {selectedIncident.priority}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#2F575D]">
                    Reporter
                  </label>
                  <p className="text-[#28363D]">{selectedIncident.reporter}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#2F575D]">
                    Location
                  </label>
                  <p className="text-[#28363D]">{selectedIncident.address}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#2F575D]">
                    Date
                  </label>
                  <p className="text-[#28363D]">{selectedIncident.date}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#2F575D]">
                    Community Votes
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <img
                        src="/assets/images/upVote.png"
                        alt="Upvote"
                        className="w-5 h-5"
                      />
                      <span className="font-semibold text-gray-900">
                        {selectedIncident.upvotes}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <img
                        src="/assets/images/downVote.png"
                        alt="Downvote"
                        className="w-5 h-5"
                      />
                      <span className="font-semibold text-gray-900">
                        {selectedIncident.downvotes}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#2F575D]">
                    Proof Uploaded
                  </label>
                  {selectedIncident.proof ? (
                    <button
                      onClick={() =>
                        window.open(
                          `/uploads/${selectedIncident.proof}`,
                          "_blank"
                        )
                      }
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
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
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      View Evidence
                    </button>
                  ) : (
                    <p className="text-gray-500 text-sm">No proof uploaded</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[#28363D] font-semibold mb-2">
                  Update Status
                </label>
                <select
                  value={selectedIncident.status}
                  onChange={(e) =>
                    handleStatusUpdate(selectedIncident.id, e.target.value)
                  }
                  className="w-full px-4 py-3 rounded-lg border-2 border-[#C4CDC1] focus:border-[#658B6F] focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-[#28363D] font-semibold mb-2">
                  Assign To
                </label>
                <input
                  type="text"
                  value={selectedIncident.assignedTo || ""}
                  onChange={(e) =>
                    handleAssignment(selectedIncident.id, e.target.value)
                  }
                  placeholder="Officer name or team"
                  className="w-full px-4 py-3 rounded-lg border-2 border-[#C4CDC1] focus:border-[#658B6F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#28363D] font-semibold mb-2">
                  Institution Notes
                </label>
                <textarea
                  value={selectedIncident.institutionNotes}
                  onChange={(e) =>
                    handleNotesUpdate(selectedIncident.id, e.target.value)
                  }
                  placeholder="Add internal notes about actions taken"
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border-2 border-[#C4CDC1] focus:border-[#658B6F] focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="flex-1 px-6 py-3 rounded-lg bg-[#658B6F] hover:bg-[#6D9197] text-white transition-colors font-semibold"
                >
                  Save & Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstitutionDashboard;
