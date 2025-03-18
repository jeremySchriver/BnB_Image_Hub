
import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface TransitionWrapperProps {
  children: React.ReactNode;
  className?: string;
}

const TransitionWrapper: React.FC<TransitionWrapperProps> = ({ children, className = '' }) => {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);
  
  return (
    <div 
      className={`transition-all duration-500 ease-out ${className} ${
        isVisible 
          ? 'opacity-100 transform translate-y-0' 
          : 'opacity-0 transform translate-y-5'
      }`}
    >
      {children}
    </div>
  );
};

export default TransitionWrapper;
