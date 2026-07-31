import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface CustomerProtectedRouteProps {
  children: React.ReactNode;
}

export default function CustomerProtectedRoute({ children }: CustomerProtectedRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
