import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { getCurrentUser } from '@/utils/api';

interface RequireSuperuserProps {
  children: React.ReactNode;
}

const RequireSuperuser: React.FC<RequireSuperuserProps> = ({ children }) => {
  const location = useLocation();
  const [isSuperuser, setIsSuperuser] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkSuperuser = async () => {
      try {
        const user = await getCurrentUser();
        setIsSuperuser(user.is_superuser);
      } catch (error) {
        setIsSuperuser(false);
        toast.error('Failed to verify permissions');
      } finally {
        setIsLoading(false);
      }
    };

    checkSuperuser();
  }, []);

  if (isLoading) {
    return null; // Or a loading spinner
  }

  if (!isSuperuser) {
    toast.error('You do not have permission to access this page');
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  return <>{children}</>;
};

export default RequireSuperuser;