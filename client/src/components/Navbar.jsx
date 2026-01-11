import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-[#28363D] shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-[#658B6F] rounded-lg"></div>
            <span className="text-white text-xl font-bold">SafetyNet</span>
          </Link>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-[#CEE1DD] hover:text-white transition-colors ">
              Home
            </Link>
            <Link to="/#features" className="text-[#CEE1DD] hover:text-white transition-colors">
              Features
            </Link>
            <Link to="/#about" className="text-[#CEE1DD] hover:text-white transition-colors">
              About
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-[#CEE1DD] hover:text-white transition-colors px-4 py-2"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="bg-[#658B6F] hover:bg-[#6D9197] text-white px-6 py-2 rounded-lg transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
