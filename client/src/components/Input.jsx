const Input = ({ 
  label, 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  error,
  required = false,
  name,
  id
}) => {
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className="block text-[#28363D] font-medium mb-3">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-5 py-4 border-2 rounded-lg focus:outline-none focus:ring-2 transition-all ${
          error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-200' 
            : 'border-[#C4CDC1] focus:border-[#658B6F] focus:ring-[#CEE1DD]'
        }`}
      />
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default Input;
