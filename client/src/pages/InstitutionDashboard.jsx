import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const InstitutionDashboard = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Check if user is an authorized institution
  useEffect(() => {
    const userType = localStorage.getItem('userType');
    
    if (userType !== 'institution') {
      // Not an institution user - redirect
      navigate('/institution-login');
    }
  }, [navigate]);

  const [reports, setReports] = useState([
    {
      id: 1,
      type: 'crime',
      title: 'Theft Reported',
      description: 'Bike theft near metro station',
      location: { lat: 28.6139, lng: 77.2090 },
      address: 'Connaught Place, New Delhi',
      status: 'pending',
      upvotes: 15,
      downvotes: 2,
      reporter: 'Anonymous User (Verified)',
      reporterId: 'USER_1234',
      date: '2026-01-10',
      proof: 'theft_evidence.jpg',
      assignedTo: null,
      priority: 'high',
      institutionNotes: '',
    },
    {
      id: 2,
      type: 'missing',
      title: 'Missing Person',
      description: 'Last seen wearing blue shirt',
      location: { lat: 19.0760, lng: 72.8777 },
      address: 'Marine Drive, Mumbai',
      status: 'in-progress',
      upvotes: 28,
      downvotes: 1,
      reporter: 'Verified User',
      reporterId: 'USER_5678',
      date: '2026-01-11',
      proof: 'person_photo.jpg',
      assignedTo: 'Officer Kumar',
      priority: 'critical',
      institutionNotes: 'Search team deployed',
    },
    {
      id: 3,
      type: 'dog-attack',
      title: 'Stray Dog Attack',
      description: 'Aggressive stray dogs in the area',
      location: { lat: 12.9716, lng: 77.5946 },
      address: 'Koramangala, Bangalore',
      status: 'pending',
      upvotes: 42,
      downvotes: 8,
      reporter: 'Local Resident',
      reporterId: 'USER_9012',
      date: '2026-01-09',
      proof: null,
      assignedTo: null,
      priority: 'medium',
      institutionNotes: '',
    },
    {
      id: 4,
      type: 'natural',
      title: 'Flood Risk Zone',
      description: 'Heavy rainfall causing waterlogging',
      location: { lat: 22.5726, lng: 88.3639 },
      address: 'Salt Lake, Kolkata',
      status: 'resolved',
      upvotes: 67,
      downvotes: 3,
      reporter: 'Verified User',
      reporterId: 'USER_3456',
      date: '2026-01-08',
      proof: 'flood_area.jpg',
      assignedTo: 'Disaster Team A',
      priority: 'critical',
      institutionNotes: 'Drainage cleared, area safe',
    },
  ]);

  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    inProgress: reports.filter(r => r.status === 'in-progress').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
  };

  const handleStatusUpdate = (id, newStatus) => {
    setReports(reports.map(r => 
      r.id === id ? { ...r, status: newStatus } : r
    ));
  };

  const handleAssignment = (id, officer) => {
    setReports(reports.map(r => 
      r.id === id ? { ...r, assignedTo: officer, status: 'in-progress' } : r
    ));
  };

  const handleNotesUpdate = (id, notes) => {
    setReports(reports.map(r => 
      r.id === id ? { ...r, institutionNotes: notes } : r
    ));
  };

  const filteredReports = reports.filter(r => 
    filter === 'all' || r.status === filter
  );

  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    };
    return colors[priority] || 'bg-gray-500';
  };

  const getPriorityButtonColor = (priority) => {
    return 'bg-[#2F575D] hover:bg-[#28363D]';
  };

  return (
    <div className="min-h-screen bg-[#CEE1DD]">
      <Navbar />
      
      <div className="pt-16 px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#28363D] mb-2">Institution Dashboard</h1>
            <p className="text-[#2F575D]">Monitor and manage community safety reports</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#2F575D] text-sm mb-1">Total Reports</p>
                  <p className="text-3xl font-bold text-[#28363D]">{stats.total}</p>
                </div>
                <div className="bg-[#CEE1DD] p-4 rounded-lg">
                  <img src="/assets/images/siren.png" alt="Reports" className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#2F575D] text-sm mb-1">Pending Action</p>
                  <p className="text-3xl font-bold text-[#28363D]">{stats.pending}</p>
                </div>
                <div className="bg-[#CEE1DD] p-4 rounded-lg">
                  <img src="/assets/images/question.png" alt="Pending" className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#2F575D] text-sm mb-1">In Progress</p>
                  <p className="text-3xl font-bold text-[#28363D]">{stats.inProgress}</p>
                </div>
                <div className="bg-[#CEE1DD] p-4 rounded-lg">
                  <img src="/assets/images/magnifying-glass.png" alt="In Progress" className="w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#2F575D] text-sm mb-1">Resolved</p>
                  <p className="text-3xl font-bold text-[#28363D]">{stats.resolved}</p>
                </div>
                <div className="bg-[#CEE1DD] p-4 rounded-lg">
                  <svg className="w-8 h-8 text-[#658B6F]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'all', label: 'All Reports' },
                { value: 'pending', label: 'Pending' },
                { value: 'in-progress', label: 'In Progress' },
                { value: 'resolved', label: 'Resolved' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    filter === value
                      ? 'bg-[#658B6F] text-white shadow-lg'
                      : 'bg-[#CEE1DD] text-[#28363D] hover:bg-[#C4CDC1]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Reports Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#28363D] text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Threat Level</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Type</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Title</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Location</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Community Vote</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Assigned To</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#CEE1DD]">
                  {filteredReports.map((report) => (
                    <tr key={report.id} className="hover:bg-[#CEE1DD] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-3 h-3 rounded-full ${getPriorityColor(report.priority)}`}></span>
                          <span className={`text-xs font-bold uppercase ${
                            report.priority === 'critical' ? 'text-red-600' :
                            report.priority === 'high' ? 'text-orange-600' :
                            report.priority === 'medium' ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {report.priority}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <img 
                          src={{
                            crime: '/assets/images/handcuff.png',
                            missing: '/assets/images/question.png',
                            'dog-attack': '/assets/images/pets.png',
                            natural: '/assets/images/flood.png'
                          }[report.type]}
                          alt={report.type}
                          className="w-8 h-8"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#28363D]">{report.title}</div>
                        <div className="text-xs text-[#2F575D]">{report.date}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#2F575D] max-w-xs truncate">
                        {report.address}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <img src="/assets/images/upVote.png" alt="Upvote" className="w-4 h-4" />
                            <span className="font-semibold text-gray-900">{report.upvotes}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <img src="/assets/images/downVote.png" alt="Downvote" className="w-4 h-4" />
                            <span className="font-semibold text-gray-900">{report.downvotes}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                          report.status === 'pending' ? 'bg-[#779e9c] text-white' :
                          report.status === 'in-progress' ? 'bg-[#1ab5d0] text-white' :
                          report.status === 'resolved' ? 'bg-[#250cb2] text-white' :    
                          'bg-gray-400 text-white'
                        }`}>
                          {report.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-[#2F575D]">
                        {report.assignedTo || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedIncident(report)}
                          className={`text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors border-4 ${getPriorityButtonColor(report.priority)} ${
                            report.status === 'pending' ? '' :
                            report.status === 'in-progress' ? '' :
                            report.status === 'resolved' ? '' :
                            'border-gray-400'
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
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-[#28363D] mb-2">{selectedIncident.title}</h3>
                <p className="text-[#2F575D]">{selectedIncident.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-[#2F575D]">Threat Level</label>
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-3 h-3 rounded-full ${getPriorityColor(selectedIncident.priority)}`}></span>
                    <span className={`text-sm font-bold uppercase ${
                      selectedIncident.priority === 'critical' ? 'text-red-600' :
                      selectedIncident.priority === 'high' ? 'text-orange-600' :
                      selectedIncident.priority === 'medium' ? 'text-yellow-600' :
                      'text-green-600'
                    }`}>
                      {selectedIncident.priority}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#2F575D]">Reporter</label>
                  <p className="text-[#28363D]">{selectedIncident.reporter}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#2F575D]">Location</label>
                  <p className="text-[#28363D]">{selectedIncident.address}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#2F575D]">Date</label>
                  <p className="text-[#28363D]">{selectedIncident.date}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#2F575D]">Community Votes</label>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <img src="/assets/images/upVote.png" alt="Upvote" className="w-5 h-5" />
                      <span className="font-semibold text-gray-900">{selectedIncident.upvotes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <img src="/assets/images/downVote.png" alt="Downvote" className="w-5 h-5" />
                      <span className="font-semibold text-gray-900">{selectedIncident.downvotes}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#2F575D]">Proof Uploaded</label>
                  {selectedIncident.proof ? (
                    <button
                      onClick={() => window.open(`/uploads/${selectedIncident.proof}`, '_blank')}
                      className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      View Evidence
                    </button>
                  ) : (
                    <p className="text-gray-500 text-sm">No proof uploaded</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-[#28363D] font-semibold mb-2">Update Status</label>
                <select
                  value={selectedIncident.status}
                  onChange={(e) => handleStatusUpdate(selectedIncident.id, e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border-2 border-[#C4CDC1] focus:border-[#658B6F] focus:outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              <div>
                <label className="block text-[#28363D] font-semibold mb-2">Assign To</label>
                <input
                  type="text"
                  value={selectedIncident.assignedTo || ''}
                  onChange={(e) => handleAssignment(selectedIncident.id, e.target.value)}
                  placeholder="Officer name or team"
                  className="w-full px-4 py-3 rounded-lg border-2 border-[#C4CDC1] focus:border-[#658B6F] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#28363D] font-semibold mb-2">Institution Notes</label>
                <textarea
                  value={selectedIncident.institutionNotes}
                  onChange={(e) => handleNotesUpdate(selectedIncident.id, e.target.value)}
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
