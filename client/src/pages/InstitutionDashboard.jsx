import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';
import axiosInstance from "../utils/axiosInstance";

const InstitutionDashboard = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [institutionData, setInstitutionData] = useState(null);
  const [assignmentInput, setAssignmentInput] = useState("");
  const [notesInput, setNotesInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);

  // Fetch institution profile data
  useEffect(() => {
    fetchInstitutionProfile();
    fetchReports();
  }, []);

  // Update assignment input when incident is selected
  useEffect(() => {
    if (selectedIncident) {
      setAssignmentInput(selectedIncident.assignedOfficer || "");
      setNotesInput(selectedIncident.institutionNotes || "");
    }
  }, [selectedIncident]);

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
      setError(null);
      
      console.log('Fetching reports...');
      // Add limit parameter to fetch all reports (or a high number)
      const response = await axiosInstance.get("/reports?limit=1000");
      console.log('Reports API response:', response.data);
      
      // Handle different response structures
      let data = [];
      if (Array.isArray(response.data)) {
        data = response.data;
      } else if (response.data.reports && Array.isArray(response.data.reports)) {
        data = response.data.reports;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        data = response.data.data;
      } else if (response.data.success && response.data.data) {
        data = Array.isArray(response.data.data) ? response.data.data : [response.data.data];
      }
      
      console.log('Extracted data:', data);
      console.log('Number of reports:', data.length);

      // Transform data to match component format
      const transformedData = data.map((report) => {
        console.log('Transforming report:', report);
        
        // Map backend status to frontend format
        const statusMap = {
          'PENDING': 'pending',
          'IN_PROGRESS': 'in-progress',
          'UNDER_REVIEW': 'under-review',
          'RESOLVED': 'resolved',
          'CLOSED': 'closed'
        };
        
        return {
          id: report._id,
          type: report.category?.toLowerCase() || "other",
          title: report.title,
          description: report.description,
          location: {
            lat: report.location?.coordinates?.[1] || 0,
            lng: report.location?.coordinates?.[0] || 0,
          },
          address: report.location?.address || "Unknown Location",
          status: statusMap[report.status] || report.status?.toLowerCase() || "pending",
          upvotes: report.upVotes || report.upvotes || 0,
          downvotes: report.downVotes || report.downvotes || 0,
          reporter: report.reportedBy?.name || "Anonymous User",
          reporterId: report.reportedBy?._id || "",
          date: report.createdAt
            ? new Date(report.createdAt).toISOString().split("T")[0]
            : new Date().toISOString().split("T")[0],
          proof: report.images?.length > 0 
            ? (typeof report.images[0] === 'string' ? report.images[0] : report.images[0]?.url) 
            : null,
          assignedTo: report.assignedOfficer || null,
          assignedOfficer: report.assignedOfficer || null,
          priority: report.priority?.toLowerCase() || "medium",
          institutionNotes: report.institutionNotes || "",
        };
      });

      console.log('Transformed data:', transformedData);
      setReports(transformedData);
      setError(null);
    } catch (err) {
      console.error("Error fetching reports:", err);
      console.error("Error details:", err.response?.data);
      setError(err.response?.data?.message || "Failed to load reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      // Map frontend status format to backend format
      const statusMap = {
        'pending': 'PENDING',
        'in-progress': 'IN_PROGRESS',
        'under-review': 'UNDER_REVIEW',
        'resolved': 'RESOLVED',
        'closed': 'CLOSED'
      };
      
      const statusToSend = statusMap[newStatus] || newStatus.toUpperCase();
      
      console.log('Updating status:', { id, newStatus: statusToSend });
      
      const response = await axiosInstance.put(`/reports/${id}/status`, {
        newStatus: statusToSend,
      });
      
      console.log('Status update response:', response.data);
      
      // Update local state with lowercase status for UI
      setReports(
        reports.map((r) => (r.id === id ? { ...r, status: newStatus.toLowerCase() } : r))
      );
      
      // Also update selected incident if it's the one being modified
      if (selectedIncident && selectedIncident.id === id) {
        setSelectedIncident({ ...selectedIncident, status: newStatus.toLowerCase() });
      }
      
      alert('Status updated successfully!');
    } catch (err) {
      console.error("Error updating status:", err);
      alert(err.response?.data?.message || "Failed to update status");
    }
  };

  const handleAssignment = async (id, officer) => {
    try {
      console.log('Assigning report:', { id, officer });
      
      const response = await axiosInstance.put(`/reports/${id}/assignment`, {
        assignedOfficer: officer,
      });
      
      console.log('Assignment response:', response.data);
      
      // Get the updated report from response
      const updatedReport = response.data.report;
      
      // Update local state with actual status from backend
      setReports(
        reports.map((r) =>
          r.id === id ? { ...r, assignedOfficer: officer, status: updatedReport.status.toLowerCase().replace('_', '-') } : r
        )
      );
      
      // Update selected incident if it's the one being modified
      if (selectedIncident && selectedIncident.id === id) {
        setSelectedIncident({ ...selectedIncident, assignedOfficer: officer, status: updatedReport.status.toLowerCase().replace('_', '-') });
      }
      
      alert('Report assigned successfully!');
    } catch (err) {
      console.error("Error assigning report:", err);
      alert(err.response?.data?.message || "Failed to assign report");
    }
  };

  const handleNotesUpdate = async (id, notes) => {
    try {
      console.log('Updating notes:', { id, notes });
      
      const response = await axiosInstance.put(`/reports/${id}/notes`, {
        notes: notes,
      });
      
      console.log('Notes update response:', response.data);
      
      // Update local state
      setReports(
        reports.map((r) =>
          r.id === id ? { ...r, institutionNotes: notes } : r
        )
      );
      
      // Update selected incident if it's the one being modified
      if (selectedIncident && selectedIncident.id === id) {
        setSelectedIncident({ ...selectedIncident, institutionNotes: notes });
      }
      
      alert('Notes updated successfully!');
    } catch (err) {
      console.error("Error updating notes:", err);
      alert(err.response?.data?.message || "Failed to update notes");
    }
  };

  const filteredReports = reports.filter((r) => {
    // Filter by status
    const statusMatch = filter === "all" || r.status === filter;
    
    // Filter by search query (category or location)
    const searchMatch = searchQuery === "" || 
      r.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.title?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return statusMatch && searchMatch;
  });

  // Get unique categories and locations for suggestions
  const getCategorySuggestions = () => {
    const categories = [...new Set(reports.map(r => r.type).filter(Boolean))];
    return categories.map(cat => ({
      value: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' '),
      type: 'category'
    }));
  };

  const getLocationSuggestions = () => {
    const locations = [...new Set(reports.map(r => r.address).filter(Boolean))];
    return locations.slice(0, 5).map(loc => ({
      value: loc,
      label: loc,
      type: 'location'
    }));
  };

  const suggestions = searchQuery.length > 0 ? 
    [...getCategorySuggestions(), ...getLocationSuggestions()]
      .filter(s => s.label.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 8) : [];

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
              <div className="bg-gradient-to-r from-[#CEE1DD ] to-[#CEE1DD ] rounded-lg p-6 mb-4 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{institutionData.institutionName}</h2>
                    <p className="text-sm opacity-90">{institutionData.institutionType}</p>
                    <p className="text-xs opacity-75 mt-1">{institutionData.officialEmail}</p>
                  </div>
                  {/* <div className="text-right">
                    <div className="inline-flex items-center px-3 py-1 rounded-full bg-white bg-opacity-20 text-sm">
                      {institutionData.isVerified ? (
                        <><span className="mr-2">✓</span> Verified</>
                      ) : (
                        <><span className="mr-2"></span> Pending Verification</>
                      )}
                    </div>
                  </div> */}
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

          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="relative">
              <div className="flex items-center gap-2">
                <svg 
                  className="absolute left-4 w-5 h-5 text-gray-400"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search by category (crime, missing, dog...) or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocus(true)}
                  onBlur={() => setTimeout(() => setSearchFocus(false), 200)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-[#C4CDC1] rounded-lg focus:border-[#658B6F] focus:outline-none text-[#28363D]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              
              {/* Suggestions Dropdown */}
              {searchFocus && suggestions.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border-2 border-[#C4CDC1] rounded-lg shadow-xl max-h-64 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearchQuery(suggestion.value);
                        setSearchFocus(false);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-[#CEE1DD] transition-colors flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                    >
                      {suggestion.type === 'category' ? (
                        <svg className="w-5 h-5 text-[#658B6F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-[#6D9197]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#28363D]">{suggestion.label}</p>
                        <p className="text-xs text-gray-500 capitalize">{suggestion.type}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {searchQuery && (
              <p className="mt-3 text-sm text-[#2F575D]">
                Found <span className="font-bold text-[#658B6F]">{filteredReports.length}</span> report(s) matching "{searchQuery}"
              </p>
            )}
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
                    src="/assets/images/wall-clock.png"
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
                    src="/assets/images/processing-time.png"
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

          {/* Map View */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-[#28363D] mb-4">Reports Map</h2>
            <div className="h-[600px] rounded-lg overflow-hidden">
              <MapView
                incidents={filteredReports.map(report => ({
                  ...report,
                  _id: report.id,
                  coordinates: report.location,
                  address: report.address,
                  type: report.type,
                  title: report.title,
                  description: report.description,
                  status: report.status,
                  priority: report.priority,
                  upvotes: report.upvotes,
                  downvotes: report.downvotes,
                  reporter: report.reporter,
                  date: report.date,
                  proof: report.proof
                }))}
                selectedIncident={null}
                onIncidentSelect={(incident) => {
                  const report = reports.find(r => r.id === incident._id || r.id === incident.id);
                  if (report) setSelectedIncident(report);
                }}
                onUpvote={null}
                onDownvote={null}
              />
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
                                dog: "/assets/images/pets.png",
                                hazard: "/assets/images/flood.png",
                                natural_disaster: "/assets/images/flood.png",
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
                          {report.assignedOfficer || "Unassigned"}
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
                    <div className="space-y-2">
                      <img 
                        src={
                          selectedIncident.proof.startsWith('http') 
                            ? selectedIncident.proof 
                            : `http://localhost:8080${selectedIncident.proof.startsWith('/') ? '' : '/'}${selectedIncident.proof}`
                        }
                        alt="Evidence"
                        className="max-w-full max-h-64 rounded-lg object-contain border border-gray-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <p className="text-red-500 text-sm" style={{display: 'none'}}>Failed to load image</p>
                      <button
                        onClick={() =>
                          window.open(
                            selectedIncident.proof.startsWith('http') 
                              ? selectedIncident.proof 
                              : `http://localhost:8080${selectedIncident.proof.startsWith('/') ? '' : '/'}${selectedIncident.proof}`,
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
                        View Evidence in New Tab
                      </button>
                    </div>
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
                  value={assignmentInput}
                  onChange={(e) => setAssignmentInput(e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value !== selectedIncident.assignedOfficer) {
                      handleAssignment(selectedIncident.id, e.target.value);
                    }
                  }}
                  placeholder="Officer name or team"
                  className="w-full px-4 py-3 rounded-lg border-2 border-[#C4CDC1] focus:border-[#658B6F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#28363D] font-semibold mb-2">
                  Institution Notes
                </label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  onBlur={(e) => {
                    if (e.target.value !== selectedIncident.institutionNotes) {
                      handleNotesUpdate(selectedIncident.id, e.target.value);
                    }
                  }}
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
