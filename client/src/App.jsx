import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import InstitutionDashboard from './pages/InstitutionDashboard';
import InstitutionLogin from './pages/InstitutionLogin';
import InstitutionRegister from './pages/InstitutionRegister';
import SafetyMap from './pages/SafetyMap';
import EditProfile from './pages/EditProfile';
import EditInstitutionProfile from './pages/EditInstitutionProfile';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/institution" element={<InstitutionDashboard />} />
        <Route path="/institution-login" element={<InstitutionLogin />} />
        <Route path="/institution-register" element={<InstitutionRegister />} />
        <Route path="/safety-map" element={<SafetyMap />} />
        <Route path="/profile/edit" element={<EditProfile />} />
        <Route path="/institution/profile/edit" element={<EditInstitutionProfile />} />
      </Routes>
    </Router>
  );
}

export default App;
