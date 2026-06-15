/**
 * App.jsx  —  Root component
 *
 * Renders the persistent shell (Navbar + Footer) around the route outlet.
 * On mount, fetches the cart if the user is already logged in (token in
 * localStorage) so the cart badge is populated immediately on page load.
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Navbar    from './components/common/Navbar';
import Footer    from './components/common/Footer';
import AppRoutes from './routes/AppRoutes';

import { selectIsLoggedIn } from './store/slices/authSlice';
import { fetchCart }        from './store/slices/cartSlice';

const App = () => {
  const dispatch   = useDispatch();
  const isLoggedIn = useSelector(selectIsLoggedIn);

  // Hydrate cart from the API whenever the user is authenticated
  useEffect(() => {
    if (isLoggedIn) dispatch(fetchCart());
  }, [isLoggedIn, dispatch]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />

      <main style={{ flex: 1 }}>
        <AppRoutes />
      </main>

      <Footer />

      {/* Global toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss={false}
        pauseOnHover
        theme="light"
      />
    </div>
  );
};

export default App;
