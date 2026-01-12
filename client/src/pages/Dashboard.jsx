import { useState } from 'react';
import Navbar from '../components/Navbar';
import MapView from '../components/MapView';
import ReportIncident from '../components/ReportIncident';
import IncidentsList from '../components/IncidentsList';

const Dashboard = () => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [filter, setFilter] = useState('all');
  const [incidents, setIncidents] = useState([
    {
      id: 1,
      type: 'crime',
      title: 'Theft Reported',
      description: 'Bike theft near metro station',
      location: { lat: 28.6139, lng: 77.2090 },
      address: 'Connaught Place, New Delhi',
      status: 'pending',
      priority: 'high',
      upvotes: 15,
      downvotes: 2,
      reporter: 'Anonymous User',
      date: '2026-01-10',
      proof: null,
    },
    {
      id: 2,
      type: 'missing',
      title: 'Missing Person',
      description: 'Last seen wearing blue shirt',
      location: { lat: 19.0760, lng: 72.8777 },
      address: 'Marine Drive, Mumbai',
      status: 'in-progress',
      priority: 'critical',
      upvotes: 28,
      downvotes: 5,
      reporter: 'Verified User',
      date: '2026-01-11',
      proof: 'photo.jpg',
    },
    {
      id: 3,
      type: 'dog-attack',
      title: 'Stray Dog Attack',
      description: 'Aggressive stray dogs in the area',
      location: { lat: 12.9716, lng: 77.5946 },
      address: 'Koramangala, Bangalore',
      status: 'pending',
      priority: 'medium',
      upvotes: 42,
      downvotes: 3,
      reporter: 'Local Resident',
      date: '2026-01-09',
      proof: null,
    },
    {
      id: 4,
      type: 'natural',
      title: 'Flood Risk Zone',
      description: 'Heavy rainfall causing waterlogging',
      location: { lat: 22.5726, lng: 88.3639 },
      address: 'Salt Lake, Kolkata',
      status: 'resolved',
      priority: 'critical',
      upvotes: 67,
      downvotes: 8,
      reporter: 'Verified User',
      date: '2026-01-08',
      proof: 'flood-area.jpg',
    },
  ]);

  const handleReportSubmit = (newReport) => {
    const report = {
      ...newReport,
      id: incidents.length + 1,
      status: 'pending',
      priority: newReport.priority || 'medium',
      upvotes: 0,
      downvotes: 0,
      reporter: 'Current User',
      date: new Date().toISOString().split('T')[0],
    };
    setIncidents([report, ...incidents]);
    setShowReportModal(false);
  };

  const handleUpvote = (id) => {
    setIncidents(incidents.map(inc => 
      inc.id === id ? { ...inc, upvotes: inc.upvotes + 1 } : inc
    ));
  };

  const handleDownvote = (id) => {
    setIncidents(incidents.map(inc => 
      inc.id === id ? { ...inc, downvotes: (inc.downvotes || 0) + 1 } : inc
    ));
  };

  const filteredIncidents = incidents.filter(inc => 
    filter === 'all' || inc.type === filter
  );

  return (
    <div className="min-h-screen bg-[#CEE1DD]">
      <Navbar />
      
      <div className="pt-16 flex h-screen">
        {/* Sidebar */}
        <div className="w-96 bg-white shadow-lg overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-[#28363D]">Safety Reports</h1>
              <button
                onClick={() => setShowReportModal(true)}
                className="bg-[#658B6F] hover:bg-[#6D9197] text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Report
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2 mb-6">
              {[
                { value: 'all', label: 'All', icon: '/assets/images/list.png' },
                { value: 'crime', label: 'Crime', icon: '/assets/images/handcuff.png' },
                { value: 'missing', label: 'Missing', icon: '/assets/images/question.png' },
                { value: 'dog-attack', label: 'Dog Attack', icon: '/assets/images/pets.png' },
                { value: 'natural', label: 'Natural', icon: '/assets/images/flood.png' },
              ].map(({ value, label, icon }) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    filter === value
                      ? 'bg-[#658B6F] text-white'
                      : 'bg-[#C4CDC1] text-[#28363D] hover:bg-[#99AEAD]'
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
                <div className="text-2xl font-bold text-[#28363D]">{incidents.length}</div>
                <div className="text-sm text-[#2F575D]">Total Reports</div>
              </div>
              <div className="bg-[#CEE1DD] p-4 rounded-lg">
                <div className="text-2xl font-bold text-[#28363D]">
                  {incidents.filter(i => i.status === 'verified').length}
                </div>
                <div className="text-sm text-[#2F575D]">Verified</div>
              </div>
            </div>

            {/* Incidents List */}
            <IncidentsList
              incidents={filteredIncidents}
              onIncidentClick={setSelectedIncident}
              onUpvote={handleUpvote}
              onDownvote={handleDownvote}
              selectedId={selectedIncident?.id}
            />
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
