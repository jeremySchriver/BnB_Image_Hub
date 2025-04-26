import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserRoundMinus,
  TagsIcon,
  UserXIcon,
  Settings,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { User } from '@/utils/types';

interface ManagementMenuProps {
  currentUser: User | null;
  isActive: boolean;
}

const ManagementMenu: React.FC<ManagementMenuProps> = ({ currentUser, isActive }) => {
  const navigate = useNavigate();

  if (!currentUser?.is_admin && !currentUser?.is_superuser) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className={`flex items-center gap-2 ${isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Settings className="h-5 w-5" />
          <span className="text-xs sm:text-sm">Manage</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {(currentUser?.is_superuser || currentUser?.is_admin) && (
          <>
            <DropdownMenuItem onClick={() => navigate('/authors')}>
              <UserRoundMinus className="h-4 w-4 mr-2" />
              Author Management
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/tagmgmt')}>
              <TagsIcon className="h-4 w-4 mr-2" />
              Tag Management
            </DropdownMenuItem>
          </>
        )}
        {currentUser?.is_superuser && (
          <DropdownMenuItem onClick={() => navigate('/users')}>
            <UserXIcon className="h-4 w-4 mr-2" />
            User Management
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ManagementMenu;