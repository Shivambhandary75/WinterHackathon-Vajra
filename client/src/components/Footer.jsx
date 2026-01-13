import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-[#28363D] text-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="text-lg font-bold mb-4">SurakshaMap</h4>
            <p className="text-[#CEE1DD]">
              Building safer communities through transparency and collaboration.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-[#CEE1DD]">
              <li><Link to="/#features" className="hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/safety-map" className="hover:text-white transition-colors">Safety Map</Link></li>
              <li><Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-[#CEE1DD]">
              <li><Link to="/#about" className="hover:text-white transition-colors">About</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4">Legal</h4>
            <ul className="space-y-2 text-[#CEE1DD]">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#2F575D] pt-8 text-center text-[#CEE1DD]">
          <p>&copy; 2026 SurakshaMap. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
