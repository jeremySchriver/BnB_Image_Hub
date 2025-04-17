import React, { useState, useEffect } from "react";
import { Tag, PlusCircle, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import TransitionWrapper from '@/components/TransitionWrapper';
import Button from '@/components/Button';
import Navbar from '@/components/Navbar';
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getCurrentUser, getAllTags, createTag, deleteTag } from '@/utils/api';
import DeleteTagConfirmationDialog from '@/components/DeleteTagConfirmationDialog';

interface TagData {
  name: string;
  date_added: string;
}

const TagManagement = () => {
  const navigate = useNavigate();
  const [tags, setTags] = useState<TagData[]>([]);
  const [newTag, setNewTag] = useState('');
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const userData = await getCurrentUser();
      
      if (!userData.is_admin && !userData.is_superuser) {
        toast.error("Admin access required");
        navigate('/');
        return;
      }
      fetchTags();
    } catch (error) {
      toast.error("Authentication failed");
      navigate('/login');
    }
  };

  const fetchTags = async () => {
    setIsLoading(true);
    try {
      const data = await getAllTags()
      setTags(data);
    } catch (error) {
      toast.error("Failed to fetch tags");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTag.trim()) {
      toast.error("Tag name cannot be empty");
      return;
    }

    try {
      await (createTag(newTag.trim()));
      toast.success("Tag created successfully");
      setNewTag('');
      fetchTags();
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        toast.error('Session expired. Please sign in again.');
        navigate('/login');
        return;
      }
      else {
        toast.error("Failed to create tag");
      }
    }
  };

  const handleDeleteClick = (tagName: string) => {
    setTagToDelete(tagName);
  };

  const handleDeleteCancel = () => {
    setTagToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (!tagToDelete) return;
    
    try {
      await deleteTag(tagToDelete);
      toast.success('Tag deleted successfully');
      fetchTags(); // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete tag');
    } finally {
      setTagToDelete(null);
    }
  };

  return (
    <div className="min-h-screen pb-16 sm:pb-0 sm:pt-16 bg-background">
      <Navbar />
      
      <TransitionWrapper className="container max-w-6xl py-6 sm:py-10">
        {/* Page Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Tag Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage tags in your image collection
          </p>
        </div>

        {/* Tag Form Card */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-8">
          <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
            <Tag className="h-5 w-5" />
            Add New Tag
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Enter tag name"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                required
              />
              <Button type="submit" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                Add Tag
              </Button>
            </div>
          </form>
        </div>

        {/* Tags Table Card */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
            <Tag className="h-5 w-5" />
            Tag List
          </h2>

          {isLoading ? (
            <div className="h-60 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="mt-4 text-muted-foreground">Loading tags...</p>
            </div>
          ) : tags.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tag Name</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tags.map((tag) => (
                    <TableRow key={tag.name}>
                      <TableCell>{tag.name}</TableCell>
                      <TableCell>
                        {new Date(tag.date_added).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(tag.name)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-center border border-border rounded-lg bg-card/50">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No tags found</h3>
              <p className="mt-2 text-muted-foreground max-w-md">
                Add tags using the form above
              </p>
            </div>
          )}
        </div>
      </TransitionWrapper>
      {/* Add the confirmation dialog */}
      {tagToDelete && (
        <DeleteTagConfirmationDialog
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      )}
    </div>
  );
};

export default TagManagement;