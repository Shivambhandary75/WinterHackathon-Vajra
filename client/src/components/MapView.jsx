import { useState, useEffect } from 'react';

const MapView = ({ incidents, selectedIncident, onIncidentSelect, onUpvote, onDownvote }) => {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [userLocation, setUserLocation] = useState({ lat: 20.5937, lng: 78.9629 }); // Center of India

  // Get incident icon based on type
  const getIncidentIcon = (type) => {
    const icons = {
      crime: '/assets/images/handcuff.png',
      missing: '/assets/images/question.png',
      'dog-attack': '/assets/images/pets.png',
      natural: '/assets/images/flood.png',
    };
    return icons[type] || '/assets/images/location.png';
  };

  // Get marker color based on status
  const getMarkerColor = (status) => {
    const colors = {
      pending: '#d0efff',
      'in-progress': '#2a9df4',
      resolved: '#1167b1',
    };
    return colors[status] || '#28363D';
  };

  // Simulated map functionality (replace with real map library like Leaflet or Google Maps)
  useEffect(() => {
    // Request user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Location access denied:', error);
        }
      );
    }
  }, []);

  return (
    <div className="relative h-full bg-[#99AEAD]">
      {/* Map Container - This would be replaced with actual map library */}
      <div className="h-full relative">
        {/* Map Background */}
        <div className="absolute inset-0 bg-linear-to-br from-[#CEE1DD] to-[#99AEAD] opacity-30"></div>
        
        {/* Center Message */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          {/* <div className="bg-white/90 backdrop-blur-sm p-8 rounded-xl shadow-xl max-w-md">
            <div className="text-6xl mb-4">map</div>
            <h3 className="text-2xl font-bold text-[#28363D] mb-2">Interactive Map View</h3>
            <p className="text-[#2F575D] mb-4">
              Integrate with Leaflet, Google Maps, or Mapbox for full functionality
            </p>
            <div className="text-sm text-[#658B6F] bg-[#CEE1DD] p-3 rounded-lg">
               location {incidents.length} incidents mapped
            </div>
          </div> */}
        </div>

        {/* Incident Markers Visualization */}
        <div className="absolute inset-0 pointer-events-none">
          {incidents.map((incident, index) => (
            <div
              key={incident.id}
              className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2 transition-all hover:scale-125"
              style={{
                left: `${20 + (index * 15) % 70}%`,
                top: `${25 + (index * 20) % 50}%`,
              }}
              onClick={() => onIncidentSelect(incident)}
            >
              <div className="relative">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-4 border-white ${
                    selectedIncident?.id === incident.id ? 'ring-4 ring-[#658B6F] scale-125' : ''
                  }`}
                  style={{ backgroundColor: getMarkerColor(incident.status) }}
                >
                  <img src={getIncidentIcon(incident.type)} alt={incident.type} className="w-7 h-7" />
                </div>
                {incident.priority && (
                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                    incident.priority === 'critical' ? 'bg-red-500' :
                    incident.priority === 'high' ? 'bg-orange-500' :
                    incident.priority === 'medium' ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}></div>
                )}
              </div>
              {selectedIncident?.id === incident.id && (
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-xl w-72 z-50">
                  <div className="text-sm font-bold text-[#28363D] mb-1">{incident.title}</div>
                  <div className="text-xs text-[#2F575D] mb-2">{incident.address}</div>
                  <div className="text-xs text-[#658B6F] mb-3">
                    {incident.status}
                  </div>
                  
                  {/* Voting Buttons */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#CEE1DD]">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onUpvote && onUpvote(incident.id);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#CEE1DD] hover:bg-[#658B6F] hover:text-white text-[#28363D] transition-colors"
                      >
                        <img src="/assets/images/upVote.png" alt="upvote" className="w-4 h-4" />
                        <span className="font-semibold text-xs">{incident.upvotes || 0}</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDownvote && onDownvote(incident.id);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#CEE1DD] hover:bg-[#C4CDC1] hover:text-[#28363D] text-[#2F575D] transition-colors"
                      >
                        <img src="/assets/images/downVote.png" alt="downvote" className="w-4 h-4" />
                        <span className="font-semibold text-xs">{incident.downvotes || 0}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 space-y-2">
          <button className="bg-white p-3 rounded-lg shadow-lg hover:bg-[#CEE1DD] transition-colors">
            <svg className="w-6 h-6 text-[#28363D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button className="bg-white p-3 rounded-lg shadow-lg hover:bg-[#CEE1DD] transition-colors">
            <svg className="w-6 h-6 text-[#28363D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <button className="bg-white p-3 rounded-lg shadow-lg hover:bg-[#CEE1DD] transition-colors">
            <svg className="w-6 h-6 text-[#28363D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl">
          <h4 className="font-bold text-[#28363D] mb-3 text-sm">Problem Status</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#d0efff' }}></div>
              <span className="text-[#2F575D]">Pending</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#2a9df4' }}></div>
              <span className="text-[#2F575D]">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: 'darkblue' }}></div>
              <span className="text-[#2F575D]">Resolved</span>
            </div>
          </div>
          <div className="border-t border-[#CEE1DD] mt-3 pt-3">
            <h4 className="font-bold text-[#28363D] mb-2 text-sm">Threat Level</h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span className="text-[#2F575D]">Low</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <span className="text-[#2F575D]">Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <span className="text-[#2F575D]">High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <span className="text-[#2F575D]">Critical</span>
              </div>
            </div>
          </div>
        </div>

        {/* User Location Indicator */}
        <div className="absolute top-4 left-4 bg-[#658B6F] text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          <span className="text-sm font-medium">Your Location</span>
        </div>
      </div>

      {/* Integration Instructions Overlay */}
      <div className="absolute top-20 right-4 max-w-sm bg-[#28363D]/90 text-white p-4 rounded-lg shadow-xl">
        {/* <h4 className="font-bold mb-2"> Map Integration</h4> */}
        <p className="text-xs opacity-90">
          {/* Install react-leaflet or @vis.gl/react-google-maps for production map functionality with: */}
        </p>
        <code className="block mt-2 bg-black/30 p-2 rounded text-xs">
          {/* npm install react-leaflet leaflet */}
        </code>
      </div>
    </div>
  );
};

export default MapView;
