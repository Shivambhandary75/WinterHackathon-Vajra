import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import InstitutionDashboard from "./pages/InstitutionDashboard";
import InstitutionLogin from "./pages/InstitutionLogin";
import InstitutionRegister from "./pages/InstitutionRegister";
import SafetyMap from "./pages/SafetyMap";
import EditProfile from "./pages/EditProfile";
import EditInstitutionProfile from "./pages/EditInstitutionProfile";
import "./App.css";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute userType="user">
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution"
            element={
              <ProtectedRoute userType="institution">
                <InstitutionDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/institution-login" element={<InstitutionLogin />} />
          <Route
            path="/institution-register"
            element={<InstitutionRegister />}
          />
          <Route path="/safety-map" element={<SafetyMap />} />
          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute userType="user">
                <EditProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/institution/profile/edit"
            element={
              <ProtectedRoute userType="institution">
                <EditInstitutionProfile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
