import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children, requireAuth = true, userType = 'user' }) => {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const storedUserType = localStorage.getItem('userType');

  // Not authenticated
  if (requireAuth && !token) {
    // Redirect to login page, saving the attempted location
    const loginPath = userType === 'institution' ? '/institution-login' : '/login';
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // Authenticated but wrong user type
  if (requireAuth && storedUserType !== userType) {
    const redirectPath = storedUserType === 'institution' ? '/institution' : '/dashboard';
    return <Navigate to={redirectPath} replace />;
  }

  return children;
};

export default ProtectedRoute;
