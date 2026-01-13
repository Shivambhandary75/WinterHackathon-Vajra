const IncidentsList = ({ incidents, onIncidentClick, onUpvote, onDownvote, selectedId }) => {
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-[#28363D] text-white',
      'in-progress': 'bg-[#6D9197] text-white',
      'resolved': 'bg-[#99AEAD] text-white',
    };
    return colors[status] || 'bg-gray-400 text-white';
  };

  const getTypeIcon = (type) => {
    const icons = {
      crime: '/assets/images/handcuff.png',
      missing: '/assets/images/question.png',
      'dog-attack': '/assets/images/pets.png',
      dog: '/assets/images/pets.png',
      natural: '/assets/images/flood.png',
      natural_disaster: '/assets/images/flood.png',
      hazard: '/assets/images/siren.png',
    };
    return icons[type] || '/assets/images/location.png';
  };

  const getTypeLabel = (type) => {
    const labels = {
      crime: 'Crime',
      missing: 'Missing Person',
      'dog-attack': 'Dog Attack',
      dog: 'Dog Attack',
      natural: 'Natural Disaster',
      natural_disaster: 'Natural Disaster',
      hazard: 'Hazard',
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-3">
      {incidents.length === 0 ? (
        <div className="text-center py-12 text-[#99AEAD]">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">No incidents found</p>
          <p className="text-sm mt-2">Try changing the filter or report a new incident</p>
        </div>
      ) : (
        incidents.map((incident) => (
          <div
            key={incident.id}
            onClick={() => onIncidentClick(incident)}
            className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all cursor-pointer border-2 ${
              selectedId === incident.id
                ? 'border-[#658B6F] ring-2 ring-[#658B6F] ring-opacity-50'
                : 'border-transparent'
            }`}
          >
            <div className="p-4">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3 flex-1">
                  <img src={getTypeIcon(incident.type)} alt={incident.type} className="w-10 h-10" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-[#28363D] truncate">{incident.title}</h3>
                      {incident.priority && (
                        <span className={`inline-block w-3 h-3 rounded-full shrink-0 ${
                          incident.priority === 'critical' ? 'bg-red-500' :
                          incident.priority === 'high' ? 'bg-orange-500' :
                          incident.priority === 'medium' ? 'bg-yellow-500' :
                          'bg-green-500'
                        }`} title={`${incident.priority} priority`}></span>
                      )}
                    </div>
                    <p className="text-xs text-[#2F575D] mb-2">{getTypeLabel(incident.type)}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(incident.status)}`}>
                  {incident.status}
                </span>
              </div>

              {/* Description */}
              <p className="text-sm text-[#2F575D] mb-3 line-clamp-2">{incident.description}</p>

              {/* Proof Image */}
              {incident.proof && (
                <div className="mb-3 rounded-lg overflow-hidden">
                  <img
                    src={
                      incident.proof.startsWith('http') 
                        ? incident.proof 
                        : `http://localhost:8080${incident.proof.startsWith('/') ? '' : '/'}${incident.proof}`
                    }
                    alt="Evidence"
                    className="w-full h-32 object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      console.error('Failed to load image:', incident.proof);
                    }}
                  />
                </div>
              )}

              {/* Location */}
              <div className="flex items-center gap-2 text-xs text-[#658B6F] mb-3">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <span className="truncate">{incident.address}</span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-[#CEE1DD]">
                <div className="flex items-center gap-4 text-xs text-[#2F575D]">
                  <span>calender{incident.date}</span>
                  <span>person {incident.reporter}</span>
                  {incident.proof && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                      </svg>
                      Proof
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpvote(incident.id);
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#CEE1DD] hover:bg-[#C4CDC1] text-[#2F575D] transition-colors"
                  >
                    <img src="/assets/images/downVote.png" alt="downvote" className="w-4 h-4" />
                    <span className="font-semibold text-xs">{incident.downvotes || 0}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default IncidentsList;
