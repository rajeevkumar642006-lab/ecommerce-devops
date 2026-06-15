/**
 * PrivateRoute.jsx
 *
 * Wraps any route that requires authentication.
 * If the user is not logged in, redirects to /login and preserves
 * the intended destination in location state so we can redirect back
 * after a successful login.
 *
 * Usage:
 *   <Route path="/orders" element={<PrivateRoute><OrdersPage /></PrivateRoute>} />
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsLoggedIn } from '../store/slices/authSlice';

const PrivateRoute = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const location   = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
