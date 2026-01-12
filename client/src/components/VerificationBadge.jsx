const VerificationBadge = ({ verified, idVerified, locationVerified }) => {
  return (
    <div className="inline-flex items-center gap-2">
      {verified && (
        <div className="flex items-center gap-1 bg-[#658B6F] text-white px-3 py-1 rounded-full text-xs font-semibold">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          Verified User
        </div>
      )}
      {idVerified && (
        <div className="flex items-center gap-1 bg-[#6D9197] text-white px-3 py-1 rounded-full text-xs font-semibold" title="Government ID Verified">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
          </svg>
          ID
        </div>
      )}
      {locationVerified && (
        <div className="flex items-center gap-1 bg-[#99AEAD] text-white px-3 py-1 rounded-full text-xs font-semibold" title="Location Verified">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          Location
        </div>
      )}
    </div>
  );
};

export default VerificationBadge;
