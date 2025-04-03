
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Upload, Tag, Search, LogOut, UserRoundMinus, UserRoundCog, UserXIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { getCurrentUser } from '@/utils/api';
import type { User } from '@/utils/types';

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const Navbar = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        setCurrentUser(user as User);
      } catch (error) {
        console.error('Failed to fetch user data');
      }
    };
    
    fetchUser();
  }, []);

  const handleLogout = () => {
    // Clear any tokens/state
    localStorage.removeItem('auth_token');
    // Redirect to login
    window.location.href = '/login';
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 sm:top-0 sm:bottom-auto bg-background/80 backdrop-blur-xl border-t sm:border-b border-border/50 py-2 sm:py-4 px-6">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="hidden sm:block">
          <h1 className="text-lg font-medium tracking-tight">
            <span className="text-primary font-semibold">B&B</span> Image Hub
          </h1>
        </div>
        
        <div className="flex items-center justify-center w-full sm:w-auto space-x-1 sm:space-x-2">
          <NavItem 
            to="/upload" 
            icon={<Upload className="h-5 w-5" />} 
            label="Upload" 
            isActive={isActive('/upload')} 
          />
          <NavItem 
            to="/tagging" 
            icon={<Tag className="h-5 w-5" />} 
            label="Tag" 
            isActive={isActive('/tagging')} 
          />
          <NavItem 
            to="/search" 
            icon={<Search className="h-5 w-5" />} 
            label="Search" 
            isActive={isActive('/search')} 
          />
          <NavItem 
            to="/account" 
            icon={<UserRoundCog className="h-5 w-5" />} 
            label="My Account" 
            isActive={isActive('/account')} 
          />
          {(currentUser?.is_superuser || currentUser?.is_admin) && (
            <NavItem 
              to="/authors" 
              icon={<UserRoundMinus className="h-5 w-5" />} 
              label="Authors" 
              isActive={isActive('/authors')} 
            />
          )}
          {currentUser?.is_superuser && (
            <NavItem 
              to="/users" 
              icon={<UserXIcon className="h-5 w-5" />} 
              label="User Management" 
              isActive={isActive('/users')} 
            />
          )}
        </div>
        
        <div className="hidden sm:flex items-center">
          <button 
            onClick={handleLogout}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors duration-200 space-x-1 px-3 py-1 rounded-md hover:bg-secondary"
          >
            <LogOut className="h-4 w-4 mr-1" />
            <span>Log out</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

interface NavItemProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isActive }) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => cn(
        "relative flex flex-col sm:flex-row items-center justify-center sm:space-x-1.5 px-5 py-2 rounded-lg transition-all duration-200",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
      )}
    >
      {({ isActive }) => (
        <>
          <span className="relative">
            {icon}
            {isActive && (
              <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full sm:hidden" />
            )}
          </span>
          <span className="text-xs sm:text-sm font-medium pt-1 sm:pt-0">{label}</span>
          {isActive && (
            <span className="hidden sm:block absolute -bottom-[18px] left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
          )}
        </>
      )}
    </NavLink>
  );
};

export default Navbar;