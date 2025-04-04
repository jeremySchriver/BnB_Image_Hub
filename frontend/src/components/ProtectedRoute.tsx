import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { isAuthenticated } from '@/utils/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const authenticated = await isAuthenticated();
        setIsAuthed(authenticated);
        if (!authenticated) {
          navigate('/login', { state: { from: location } });
        }
      } catch (error) {
        console.error('Auth verification failed:', error);
        navigate('/login', { state: { from: location } });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyAuth();
  }, [navigate, location]);

  if (isVerifying) {
    return <div>Loading...</div>;
  }

  return isAuthed ? <>{children}</> : null;
};

export default ProtectedRoute;