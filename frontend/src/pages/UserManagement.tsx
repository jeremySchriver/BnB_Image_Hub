import React, { useState, useEffect } from "react";
import { Users, Shield, ShieldOff, Trash2, UserRoundPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import TransitionWrapper from '@/components/TransitionWrapper';
import { Button } from "@/components/ui/button";
import Navbar from '@/components/Navbar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllUsers, setUserAdminStatus, deleteUser, createUser, getCurrentUser } from '@/utils/api';
import type { User } from '@/utils/types';
import DeleteUserConfirmationDialog from '@/components/DeleteUserConfirmationDialog';
import AddUserDialog from '@/components/AddUserDialog';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showAddUser, setShowAddUser] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
      } catch (error) {
        if (error instanceof Error && error.message === 'Session expired. Please sign in again.') {
          toast.error(error.message);
          navigate('/login');
        } else {
          toast.error(error instanceof Error ? error.message : 'Failed to fetch users');
        }
      }
    };

    fetchUsers();
  }, [navigate]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllUsers();
      setUsers(data as User[]);
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        toast.error('Session expired. Please sign in again.');
        navigate('/login');
        return;
      }
      toast.error('Failed to fetch users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (email: string) => {
    setUserToDelete(email);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    try {
      await deleteUser(userToDelete);
      toast.success('User deleted successfully');
      fetchUsers(); // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setUserToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setUserToDelete(null);
  };

  const toggleAdminStatus = async (email: string, currentStatus: boolean) => {
    try {
      await setUserAdminStatus(email, !currentStatus);
      toast.success(`Admin status ${!currentStatus ? 'granted' : 'revoked'} successfully`);
      fetchUsers(); // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update admin status');
    }
  };

  const handleCreateUser = async (userData: { email: string; username: string; password: string }) => {
    try {
      await createUser(userData);
      toast.success('User created successfully');
      await fetchUsers();
      setShowAddUser(false);
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        toast.error('Session expired. Please sign in again.');
        navigate('/login');
        return;
      }
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    }
  };

  return (
    <div className="min-h-screen pb-16 sm:pb-0 sm:pt-16 bg-background">
      <Navbar />
      
      <TransitionWrapper className="container max-w-6xl py-6 sm:py-10">
        <div className="text-center mb-6 pointer-events-none">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage user roles and permissions
          </p>
        </div>
        <div className="flex justify-center mb-6 pointer-events-auto">
          <Button onClick={() => setShowAddUser(true)}>
            <UserRoundPlus className="h-4 w-4 mr-2" />
              Add User
          </Button>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 select-none">
          {/* Remove pointer-events-none and add proper overflow handling */}
          <div className="overflow-x-auto max-w-[calc(100vw-2rem)]">
            <div className="min-w-[800px]"> {/* Add minimum width to force scrolling */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {new Date(user.date_joined).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.last_login 
                          ? new Date(user.last_login).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        {user.is_superuser 
                          ? 'Superuser' 
                          : user.is_admin 
                          ? 'Admin' 
                          : 'User'}
                      </TableCell>
                      <TableCell>
                        <div className="pointer-events-auto flex items-center gap-2">
                          {!user.is_superuser && (
                              <>
                                  <Button
                                      variant={user.is_admin ? "destructive" : "default"}
                                      size="sm"
                                      onClick={() => toggleAdminStatus(user.email, user.is_admin)}
                                      >
                                      {user.is_admin ? (
                                      <>
                                          <ShieldOff className="h-4 w-4 mr-2" />
                                          Remove Admin
                                      </>
                                      ) : (
                                      <>
                                          <Shield className="h-4 w-4 mr-2" />
                                          Make Admin
                                      </>
                                      )}
                                  </Button>
                                  <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => handleDeleteClick(user.email)}
                                      >
                                      <Trash2 className="h-4 w-4" />
                                  </Button>
                              </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </TransitionWrapper>
      {/* Add the confirmation dialog */}
      {userToDelete && (
        <DeleteUserConfirmationDialog
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
      {showAddUser && (
        <AddUserDialog
          onConfirm={handleCreateUser}
          onCancel={() => setShowAddUser(false)}
        />
      )}
    </div>
  );
};

export default UserManagement;