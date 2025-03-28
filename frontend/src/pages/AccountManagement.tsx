import React, { useState, useEffect } from "react";
import { UserCog, Save } from 'lucide-react';
import { toast } from 'sonner';
import TransitionWrapper from '@/components/TransitionWrapper';
import Button from '@/components/Button';
import Navbar from '@/components/Navbar';
import { Input } from "@/components/ui/input";
import { getCurrentUser, updateUserProfile } from '@/utils/api';

interface AccountForm {
  email: string;
  username: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface UserData {
  email: string;
  username: string;
  id: number;
}

const AccountManagement = () => {
  const [formData, setFormData] = useState<AccountForm>({
    email: '',
    username: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw new Error('No authentication token found');
      }
  
      const receivedUserData = await getCurrentUser();
      console.log('User data received:', receivedUserData);
      
      // Store the user data
      setUserData(receivedUserData);
      
      setFormData(prev => ({
        ...prev,
        email: receivedUserData.email || '',
        username: receivedUserData.username || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      // ...existing error handling...
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
  
    try {
      const updateData: any = {};
  
      // Handle profile updates (email/username)
      if (formData.email && userData && formData.email !== userData.email) {
        updateData.email = formData.email;
      }
      if (formData.username && userData && formData.username !== userData.username) {
        updateData.username = formData.username;
      }
  
      // Handle password update
      if (formData.newPassword || formData.currentPassword) {
        if (!formData.currentPassword) {
          toast.error("Current password is required to change password");
          setIsLoading(false);
          return;
        }
  
        if (!formData.newPassword) {
          toast.error("New password is required");
          setIsLoading(false);
          return;
        }
  
        if (formData.newPassword !== formData.confirmPassword) {
          toast.error("New passwords don't match");
          setIsLoading(false);
          return;
        }
  
        updateData.password = formData.newPassword;
        updateData.currentPassword = formData.currentPassword;
      }
  
      if (Object.keys(updateData).length === 0) {
        toast.error("No changes to update");
        setIsLoading(false);
        return;
      }
  
      const updatedUser = await updateUserProfile(updateData);
      setUserData(updatedUser);
      toast.success("Account updated successfully");
  
      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      console.error('Update error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-16 sm:pb-0 sm:pt-16 bg-background">
      <Navbar />
      
      <TransitionWrapper className="container max-w-xl py-6 sm:py-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Account Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account information
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Username</label>
                <Input
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input
                  type="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="pt-4 border-t border-border">
                <h3 className="text-lg font-medium mb-4">Change Password</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Current Password</label>
                    <Input
                      type="password"
                      placeholder="Enter current password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">New Password</label>
                    <Input
                      type="password"
                      placeholder="Enter new password"
                      value={formData.newPassword}
                      onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Confirm New Password</label>
                    <Input
                      type="password"
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </form>
        </div>
      </TransitionWrapper>
    </div>
  );
};

export default AccountManagement;