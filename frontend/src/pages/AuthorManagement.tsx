import React, { useState, useEffect } from "react";
import { UsersRound, PlusCircle, UserRound, AlertCircle, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import TransitionWrapper from '@/components/TransitionWrapper';
import Button from '@/components/Button';
import Navbar from '@/components/Navbar';
import { Input } from "@/components/ui/input";
import AuthorDeleteDialog from '@/components/AuthorDeleteDialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  getAuthorsData, 
  createAuthor, 
  updateAuthorData, 
  deleteAuthorData, 
  getCurrentUser 
} from '@/utils/api';
import type { User } from '@/utils/types';

interface Author {
  id: number;
  name: string;
  email: string;
  date_added: string;
}

interface AuthorForm {
  name: string;
  email: string;
}

const AuthorManagement = () => {
  const navigate = useNavigate();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [formData, setFormData] = useState<AuthorForm>({ name: "", email: "" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authorToDelete, setAuthorToDelete] = useState<Author | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    fetchAuthors();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const userData = await getCurrentUser();
      
      if (!userData.is_admin && !userData.is_superuser) {
        toast.error("Admin access required");
        navigate('/');
        return;
      }
      fetchAuthors();
    } catch (error) {
      toast.error("Authentication failed");
      navigate('/login');
    }
  };

  const fetchAuthors = async () => {
    setIsLoading(true);
    try {
      const data = await getAuthorsData();
      setAuthors(data);
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        toast.error("Session expired. Please login again");
        navigate('/login');
        return;
      }
      toast.error("Failed to fetch authors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateAuthorData(editingId, {
          id: editingId,
          name: formData.name,
          email: formData.email,
          date_added: new Date().toISOString()
        });
        toast.success("Author updated successfully");
      } else {
        await createAuthor({
          id: 0,
          name: formData.name,
          email: formData.email,
          date_added: new Date().toISOString()
        });
        toast.success("Author created successfully");
      }
      setFormData({ name: "", email: "" });
      setEditingId(null);
      fetchAuthors();
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        toast.error("Session expired. Please login again");
        navigate('/login');
        return;
      }
      toast.error(`Failed to ${editingId ? "update" : "create"} author`);
    }
  };

  const confirmDelete = (author: Author) => {
    setAuthorToDelete(author);
  };

  const handleDelete = async () => {
    if (!authorToDelete) return;

    try {
      await deleteAuthorData(authorToDelete.id);
      toast.success("Author deleted successfully");
      fetchAuthors();
      setAuthorToDelete(null);
    } catch (error) {
      if (error instanceof Error && error.message.includes('401')) {
        toast.error("Session expired. Please login again");
        navigate('/login');
        return;
      }
      toast.error("Failed to delete author");
    }
  };

  const handleEdit = (author: Author) => {
    setFormData({ name: author.name, email: author.email });
    setEditingId(author.id);
  };

  return (
    <div className="min-h-screen pb-16 sm:pb-0 sm:pt-16 bg-background">
      <Navbar />
      
      <TransitionWrapper className="container max-w-6xl py-6 sm:py-10">
        {/* Page Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Author Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage authors in your image collection
          </p>
        </div>

        {/* Author Form Card */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-8">
          <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
            <UserRound className="h-5 w-5" />
            {editingId ? "Edit Author" : "Add New Author"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name</label>
                <Input
                  placeholder="Enter author name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Email</label>
                <Input
                  type="email"
                  placeholder="Enter author email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex items-center gap-2">
                <PlusCircle className="h-4 w-4" />
                {editingId ? "Update Author" : "Add Author"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormData({ name: "", email: "" });
                }}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                Clear
              </Button>
              {editingId && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({ name: "", email: "" });
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* Authors Table Card */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-medium flex items-center gap-2 mb-4">
            <UsersRound className="h-5 w-5" />
            Author List
          </h2>

          {isLoading ? (
            <div className="h-60 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="mt-4 text-muted-foreground">Loading authors...</p>
            </div>
          ) : authors.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date Added</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {authors.map((author) => (
                    <TableRow key={author.id}>
                      <TableCell>{author.name}</TableCell>
                      <TableCell>{author.email}</TableCell>
                      <TableCell>
                        {new Date(author.date_added).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(author)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(author)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-center border border-border rounded-lg bg-card/50">
              <AlertCircle className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No authors found</h3>
              <p className="mt-2 text-muted-foreground max-w-md">
                Add your first author using the form above
              </p>
            </div>
          )}
        </div>

        {authorToDelete && (
          <AuthorDeleteDialog
            onConfirm={handleDelete}
            onCancel={() => setAuthorToDelete(null)}
            authorName={authorToDelete.name}
          />
        )}
      </TransitionWrapper>
    </div>
  );
};

export default AuthorManagement;