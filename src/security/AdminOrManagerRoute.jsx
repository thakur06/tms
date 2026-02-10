import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminOrManagerRoute = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/auth" state={{ from: location }} replace />;
    }

    const role = user?.role;
    if (role !== 'admin' && role !== 'manager' && !user?.isManager) {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default AdminOrManagerRoute;
