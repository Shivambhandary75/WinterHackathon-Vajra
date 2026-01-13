import { useState, useEffect, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Component to handle map instance
const MapController = ({ userLocation, onMapLoad }) => {
  const map = useMap();
  
  useEffect(() => {
    if (map) {
      onMapLoad(map);
    }
  }, [map, onMapLoad]);
  
  return null;
};

const MapView = ({
  incidents,
  selectedIncident,
  onIncidentSelect,
  onUpvote,
  onDownvote,
}) => {
  const [userLocation, setUserLocation] = useState(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [isLocationLoading, setIsLocationLoading] = useState(true);
  const [mapInstance, setMapInstance] = useState(null);

  // Debug: Log incidents data
  useEffect(() => {
    console.log("MapView incidents:", incidents);
    console.log("Number of incidents:", incidents?.length || 0);
    if (incidents && incidents.length > 0) {
      console.log("Sample incident:", incidents[0]);
    }
  }, [incidents]);

  // Sync selected marker when incidents update (after voting)
  useEffect(() => {
    if (selectedMarker && incidents) {
      const updatedIncident = incidents.find(
        inc => inc._id === selectedMarker._id || inc.id === selectedMarker.id
      );
      if (updatedIncident) {
        setSelectedMarker(updatedIncident);
      }
    }
  }, [incidents]);

  // Get incident pin color based on status
  const getPinColor = (status) => {
    const colors = {
      pending: "#d0efff",
      "in-progress": "#2a9df4",
      in_progress: "#2a9df4",
      "under-review": "#2a9df4",
      under_review: "#2a9df4",
      resolved: "#1167b1",
      closed: "#1167b1",
    };
    return colors[status] || "#d0efff"; // Default to pending color instead of black
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      critical: "#ef4444",
      high: "#f97316",
      medium: "#eab308",
      low: "#22c55e",
    };
    return colors[priority] || "#6b7280";
  };

  // Request user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          console.log("User location fetched:", userCoords);
          setUserLocation(userCoords);
          setIsLocationLoading(false);
        },
        (error) => {
          console.error("Location access error:", error.message);
          // Fallback to India center
          setUserLocation({
            lat: 20.5937,
            lng: 78.9629,
          });
          setIsLocationLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    } else {
      console.warn("Geolocation not supported");
      // Geolocation not supported
      setUserLocation({
        lat: 20.5937,
        lng: 78.9629,
      });
      setIsLocationLoading(false);
    }
  }, []);

  // Handle marker click
  const handleMarkerClick = (incident) => {
    setSelectedMarker(incident);
    if (onIncidentSelect) {
      onIncidentSelect(incident);
    }
  };

  // Handle recenter to user location
  const handleRecenterToUserLocation = () => {
    if (userLocation && mapInstance) {
      mapInstance.panTo(userLocation);
      mapInstance.setZoom(15);
    }
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-lg">
      {isLocationLoading ? (
        <div className="flex items-center justify-center h-full bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Fetching your location...</p>
          </div>
        </div>
      ) : (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            defaultCenter={userLocation}
            defaultZoom={15}
            gestureHandling="greedy"
            disableDefaultUI={false}
            mapId="safety-map"
            style={{ width: "100%", height: "100%" }}
          >
            {/* Map controller to get map instance */}
            <MapController 
              userLocation={userLocation}
              onMapLoad={setMapInstance}
            />
            {/* User location marker */}
            {userLocation && (
              <AdvancedMarker position={userLocation}>
                <div className="relative">
                  <Pin
                    background="#3b82f6"
                    borderColor="#1e40af"
                    glyphColor="#ffffff"
                    scale={1.5}
                  />
                  <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-blue-600 text-white px-2 py-1 rounded text-xs font-semibold">
                    You are here
                  </div>
                </div>
              </AdvancedMarker>
            )}

            {/* Incident markers */}
            {incidents &&
              incidents
                .filter(
                  (incident) => {
                    const hasValidCoords = incident.coordinates &&
                      typeof incident.coordinates.lat === 'number' &&
                      typeof incident.coordinates.lng === 'number' &&
                      !isNaN(incident.coordinates.lat) &&
                      !isNaN(incident.coordinates.lng) &&
                      !(incident.coordinates.lat === 0 && incident.coordinates.lng === 0);
                    
                    if (!hasValidCoords) {
                      console.log("Filtered out incident (invalid/zero coords):", incident.title, incident.coordinates);
                    }
                    return hasValidCoords;
                  }
                )
                .map((incident) => (
                  <AdvancedMarker
                    key={incident._id}
                    position={{
                      lat: incident.coordinates.lat,
                      lng: incident.coordinates.lng,
                    }}
                    onClick={() => handleMarkerClick(incident)}
                  >
                    <div className="relative">
                      {/* Pulsing circle background */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="w-16 h-16 rounded-full animate-ping opacity-75"
                          style={{
                            backgroundColor: getPinColor(incident.status),
                          }}
                        ></div>
                      </div>

                      {/* Outer circle */}
                      <div
                        className="relative w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-lg z-10"
                        style={{
                          backgroundColor: getPinColor(incident.status),
                          borderColor: getPriorityColor(incident.priority),
                        }}
                      >
                        {/* Inner icon/indicator */}
                        <div className="flex items-center justify-center">
                          <img 
                            src={
                              incident.type === "crime" ? "/assets/images/handcuff.png" :
                              incident.type === "missing" ? "/assets/images/question.png" :
                              incident.type === "dog" || incident.type === "dog-attack" ? "/assets/images/pets.png" :
                              incident.type === "natural" || incident.type === "natural_disaster" ? "/assets/images/flood.png" :
                              incident.type === "hazard" ? "/assets/images/siren.png" :
                              "/assets/images/location.png"
                            }
                            alt={incident.type}
                            className="w-6 h-6"
                          />
                        </div>
                      </div>

                      {/* Priority badge */}
                      {incident.priority && (
                        <div
                          className={`absolute -top-1 -right-1 w-5 h-5 rounded-full border-2 border-white z-20 ${
                            incident.priority === "critical"
                              ? "bg-red-500"
                              : incident.priority === "high"
                              ? "bg-orange-500"
                              : incident.priority === "medium"
                              ? "bg-yellow-500"
                              : "bg-green-500"
                          }`}
                        ></div>
                      )}
                    </div>
                  </AdvancedMarker>
                ))}

            {/* InfoWindow for selected marker */}
            {selectedMarker &&
              selectedMarker.coordinates &&
              selectedMarker.coordinates.lat &&
              selectedMarker.coordinates.lng && (
                <InfoWindow
                  position={{
                    lat: selectedMarker.coordinates.lat,
                    lng: selectedMarker.coordinates.lng,
                  }}
                  onCloseClick={() => setSelectedMarker(null)}
                >
                  <div className="p-3 max-w-sm">
                    {/* Image if available */}
                    {selectedMarker.proof && (
                      <div className="mb-3 -mx-3 -mt-3">
                        <img
                          src={
                            selectedMarker.proof.startsWith('http') 
                              ? selectedMarker.proof 
                              : `http://localhost:8080${selectedMarker.proof.startsWith('/') ? '' : '/'}${selectedMarker.proof}`
                          }
                          alt={selectedMarker.title}
                          className="w-full h-40 object-cover rounded-t-lg"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            console.error('Failed to load image:', selectedMarker.proof);
                          }}
                        />
                      </div>
                    )}

                    {/* Header with title and status */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900 text-base flex-1 pr-2">
                        {selectedMarker.title}
                      </h3>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                          selectedMarker.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : selectedMarker.status === "in-progress" ||
                              selectedMarker.status === "in_progress"
                            ? "text-white"
                            : "bg-green-100 text-green-800"
                        }`}
                        style={
                          selectedMarker.status === "in-progress" ||
                          selectedMarker.status === "in_progress"
                            ? { backgroundColor: "#2a9df4" }
                            : {}
                        }
                      >
                        {selectedMarker.status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Category/Type */}
                    <div className="text-xs text-gray-500 mb-2 capitalize">
                      {selectedMarker.type || "Incident"}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                      {selectedMarker.description}
                    </p>

                    {/* Location */}
                    <div className="flex items-start gap-2 text-xs text-gray-600 mb-3 bg-gray-50 p-2 rounded">
                      <svg
                        className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-500"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      <span className="flex-1">{selectedMarker.address}</span>
                    </div>

                    {/* Priority and Date */}
                    <div className="flex items-center justify-between text-xs mb-3">
                      <span
                        className={`px-2 py-1 rounded font-semibold ${
                          selectedMarker.priority === "critical"
                            ? "bg-red-100 text-red-800"
                            : selectedMarker.priority === "high"
                            ? "bg-orange-100 text-orange-800"
                            : selectedMarker.priority === "medium"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {selectedMarker.priority} priority
                      </span>
                      <span className="text-gray-500">
                        {selectedMarker.date ||
                          new Date(
                            selectedMarker.createdAt
                          ).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Reporter */}
                    {selectedMarker.reporter && (
                      <div className="flex items-center gap-2 text-xs text-gray-600 mb-3">
                        <svg
                          className="w-4 h-4 text-gray-500"
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                        </svg>
                        <span>Reported by: {selectedMarker.reporter}</span>
                      </div>
                    )}

                    {/* Voting buttons */}
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onUpvote) {
                            onUpvote(selectedMarker._id || selectedMarker.id);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 hover:shadow-md text-sm font-semibold transition-all active:scale-95"
                        title="Upvote this report"
                      >
                        <img 
                          src="/assets/images/upVote.png" 
                          alt="Upvote" 
                          className="w-5 h-5"
                        />
                        <span className="min-w-[20px] text-center">{selectedMarker.upvotes || 0}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onDownvote) {
                            onDownvote(selectedMarker._id || selectedMarker.id);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 hover:shadow-md text-sm font-semibold transition-all active:scale-95"
                        title="Downvote this report"
                      >
                        <img 
                          src="/assets/images/downVote.png" 
                          alt="Downvote" 
                          className="w-5 h-5"
                        />
                        <span className="min-w-[20px] text-center">{selectedMarker.downvotes || 0}</span>
                      </button>
                    </div>
                  </div>
                </InfoWindow>
              )}
          </Map>

          {/* Legend */}
          <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm p-4 rounded-lg shadow-xl z-10">
            <h4 className="font-bold text-[#28363D] mb-3 text-sm">
              Problem Status
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: "#d0efff" }}
                ></div>
                <span className="text-[#2F575D]">Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: "#2a9df4" }}
                ></div>
                <span className="text-[#2F575D]">In Progress</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: "#1167b1" }}
                ></div>
                <span className="text-[#2F575D]">Resolved</span>
              </div>
            </div>
            <div className="border-t border-[#CEE1DD] mt-3 pt-3">
              <h4 className="font-bold text-[#28363D] mb-2 text-sm">
                Threat Level
              </h4>
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

          {/* My Location Button */}
          <button
            onClick={handleRecenterToUserLocation}
            className="absolute top-24 left-4 bg-[#658B6F] hover:bg-[#6D9197] text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-10 transition-colors cursor-pointer"
            title="Go to my location"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
            <span className="text-sm font-medium">My Location</span>
          </button>
        </APIProvider>
      )}
    </div>
  );
};

export default MapView;
