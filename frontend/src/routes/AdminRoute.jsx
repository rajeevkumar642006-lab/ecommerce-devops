/**
 * AdminRoute.jsx
 *
 * Wraps routes that require admin role.
 * Redirects non-admins to the home page with a 403-style message.
 */

import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsLoggedIn, selectIsAdmin } from '../store/slices/authSlice';

const AdminRoute = ({ children }) => {
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const isAdmin    = useSelector(selectIsAdmin);

  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin)    return <Navigate to="/"      replace />;

  return children;
};

export default AdminRoute;
