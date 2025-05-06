import React, { useState, useEffect } from 'react';
import { Search as Tag, Filter, HelpCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import TransitionWrapper from '@/components/TransitionWrapper';
import Button from '@/components/Button';
import Navbar from '@/components/Navbar';
import ImageCard from '@/components/ImageCard';
import TagInput from '@/components/TagInput';
import AuthorInput from '@/components/AuthorInput';
import { 
  searchImages, 
  imageUrls, 
  deleteImage,
  getCurrentUser
} from '@/utils/api';
import type { ImageMetadata } from '@/utils/api';
import ImageDetailModal from '@/components/ImageDetailModal';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';

const ImageSearch = () => {
  // ===============================
  // State Definitions
  // ===============================
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Modal edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editAuthor, setEditAuthor] = useState('');
  
  // Filter states
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterAuthor, setFilterAuthor] = useState('');

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ===============================
  // Effects
  // ===============================
  // Initial load effect
  useEffect(() => {
    const initializeSearch = async () => {
      try {
        await fetchImages();
      } catch (error) {
      } finally {
        setHasInitialized(true);
      }
    };

    initializeSearch();
  }, []);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  // Filter change effect
  useEffect(() => {
    if (hasInitialized) {
      fetchImages();
    }
  }, [filterTags, filterAuthor, hasInitialized]);

  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedImage]);

  // ===============================
  // Data Fetching Functions
  // ===============================
  const fetchImages = async () => {
    setIsLoading(true);
    try {
      const filters = {
        tags: filterTags,
        author: filterAuthor
      };
      
      const results = await searchImages(filters);
      console.log('Search results:', results);
      setImages(results);
    } catch (error) {
      if (hasInitialized) {
        toast.error('Failed to load images');
      }
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const checkAdminAccess = async () => {
    try {
      const userData = await getCurrentUser();
      setIsAdmin(userData.is_admin || userData.is_superuser);
    } catch (error) {
      console.error('Failed to check admin status');
      setIsAdmin(false);
    }
  };
  

  // ===============================
  // Event Handlers
  // ===============================
  const handleImageUpdate = (updatedImage: ImageMetadata) => {
    setImages(prev => 
      prev.map(img => 
        img.id === updatedImage.id ? updatedImage : img
      )
    );
    setSelectedImage(updatedImage);
  };

  const handleDelete = async () => {
    if (!selectedImage || !isAdmin) return;
    
    try {
      await deleteImage(selectedImage.id);
      setImages(prev => prev.filter(img => img.id !== selectedImage.id));
      setShowDeleteConfirm(false);
      setSelectedImage(null);
      toast.success('Image deleted successfully');
    } catch (error) {
      if (error instanceof Error && error.message.includes('403')) {
        toast.error('You do not have permission to delete images');
      } else {
        toast.error('Failed to delete image');
      }
    }
  };

  const clearFilters = () => {
    setFilterTags([]);
    setFilterAuthor('');
  };

  const handleImageSelect = (image: ImageMetadata) => {
    setSelectedImage(image);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  // ===============================
  // Render Method
  // ===============================
  return (
    <div className="min-h-screen pb-16 sm:pb-0 sm:pt-16 bg-background">
      {/* Navigation Bar */}
      <Navbar />
      
      <TransitionWrapper className="container max-w-6xl py-6 sm:py-10">
        {/* Page Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Image Gallery</h1>
          <p className="text-muted-foreground mt-2">
            Browse and filter your image collection
          </p>
        </div>
        
        {/* Filters Section */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          {/* Filter Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </h2>
            {(filterTags.length > 0 || filterAuthor.trim().length > 0) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Clear All
              </Button>
            )}
          </div>

          {/* Filter Controls */}
          <div className="mt-4 space-y-4">
            {/* Tag Filter */}
            <div>
              <label className="text-sm font-medium mb-2 inline-flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Filter by Tags
              </label>
              <TagInput
                value={filterTags}
                onChange={setFilterTags}
                placeholder="Add tags to filter by..."
              />
            </div>

            {/* Author Filter */}
            <div>
              <label className="text-sm font-medium mb-2 inline-flex items-center gap-2">
                <User className="h-4 w-4" />
                Filter by Author
              </label>
              <AuthorInput
                value={filterAuthor}
                onChange={setFilterAuthor}
                placeholder="Enter author name..."
              />
            </div>
          </div>
        </div>

        {/* Image Grid Section */}
        <div className="mt-8">
          {isLoading ? (
            // Loading State
            <div className="h-60 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="mt-4 text-muted-foreground">Loading images...</p>
            </div>
          ) : images.length > 0 ? (
            // Image Grid
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {images.map((image) => (
                <ImageCard
                  key={image.id}
                  src={image.search_preview_path} // Use the search_preview_path directly
                  alt={`Image ${image.id}`}
                  tags={image.tags}
                  author={image.author}
                  onClick={() => handleImageSelect(image)}
                />
              ))}
            </div>
          ) : (
            // Empty State
            <div className="h-60 flex flex-col items-center justify-center text-center border border-border rounded-lg bg-card">
              <HelpCircle className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No images found</h3>
              <p className="mt-2 text-muted-foreground max-w-md">
                Try adjusting your filters to find more images
              </p>
            </div>
          )}
        </div>
      </TransitionWrapper>

      {/* Modals */}
      {selectedImage && (
        <ImageDetailModal
          image={selectedImage}
          onClose={() => setSelectedImage(null)}
          onDelete={() => setShowDeleteConfirm(true)}
          onUpdate={handleImageUpdate}
          isAdmin={isAdmin}
        />
      )}

      {showDeleteConfirm && (
        <DeleteConfirmationDialog
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </div>
  );
};

export default ImageSearch;