import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserRoundCog,
  LogOut,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { User as UserType } from '@/utils/types';

interface ProfileMenuProps {
  currentUser: UserType | null;
  isActive: boolean;
  onLogout: () => void;
}

const ProfileMenu: React.FC<ProfileMenuProps> = ({ currentUser, isActive, onLogout }) => {
  const navigate = useNavigate();

  if (!currentUser) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={`flex items-center gap-2 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <User className="h-5 w-5" />
          <span className="text-xs sm:text-sm">Profile</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => navigate('/account')}>
          <UserRoundCog className="h-4 w-4 mr-2" />
          My Account
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={onLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileMenu;