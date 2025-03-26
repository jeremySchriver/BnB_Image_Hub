import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Tag, Filter, X, HelpCircle, User, Download } from 'lucide-react';
import { toast } from 'sonner';
import TransitionWrapper from '@/components/TransitionWrapper';
import Button from '@/components/Button';
import Navbar from '@/components/Navbar';
import ImageCard from '@/components/ImageCard';
import TagInput from '@/components/TagInput';
import AuthorInput from '@/components/AuthorInput';
import { cn } from '@/lib/utils';
import { 
  searchImages, 
  getPreviewUrl, 
  getActualImage, 
  updateImageMetadata, 
  getImageById 
} from '@/utils/api';
import type { ImageMetadata } from '@/utils/api';

const ImageSearch = () => {
  // ===============================
  // State Definitions
  // ===============================
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);

  // Modal edit states
  const [isEditing, setIsEditing] = useState(false);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editAuthor, setEditAuthor] = useState('');
  
  // Filter states
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterAuthor, setFilterAuthor] = useState('');

  // ===============================
  // Effects
  // ===============================
  // Initial load effect
  useEffect(() => {
    const initializeSearch = async () => {
      try {
        await fetchImages();
      } catch (error) {
        console.error('Failed to initialize search:', error);
      } finally {
        setHasInitialized(true);
      }
    };

    initializeSearch();
  }, []);

  // Filter change effect
  useEffect(() => {
    if (hasInitialized) {
      fetchImages();
    }
  }, [filterTags, filterAuthor, hasInitialized]);

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
      setImages(results);
    } catch (error) {
      if (hasInitialized) {
        console.error('Failed to fetch images:', error);
        toast.error('Failed to load images');
      }
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ===============================
  // Event Handlers
  // ===============================
  const handleDownload = async (imageId: string) => {
    try {
      const response = await fetch(getActualImage(imageId));
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentType = response.headers.get('content-type');
      const extension = contentType ? `.${contentType.split('/')[1]}` : '';
      a.download = `image-${imageId}${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download image:', error);
      toast.error('Failed to download image');
    }
  };

  const handleEditStart = () => {
    if (selectedImage) {
      setEditTags(selectedImage.tags);
      setEditAuthor(selectedImage.author);
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedImage) return;
    
    try {
      const imageId = parseInt(selectedImage.id);
      // First update the metadata
      await updateImageMetadata(imageId, {
        tags: editTags,
        author: editAuthor
      });
  
      // Then fetch fresh image data
      const filters = {
        tags: filterTags,
        author: filterAuthor
      };
      const updatedImages = await searchImages(filters);
      setImages(updatedImages);
      
      // Update the selected image with the fresh data
      const updatedSelectedImage = updatedImages.find(img => img.id === selectedImage.id);
      if (updatedSelectedImage) {
        setSelectedImage(updatedSelectedImage);
      }
      
      setIsEditing(false);
      toast.success('Changes saved successfully');
    } catch (error) {
      console.error('Failed to update metadata:', error);
      toast.error('Failed to save changes');
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image) => (
                <ImageCard
                  key={image.id}
                  src={getPreviewUrl(image.id, 'search')}
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

        {/* Image Detail Modal */}
        {selectedImage && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl shadow-elevation max-w-4xl w-full max-h-[90vh] flex flex-col animate-fade-in">
              {/* Modal Header */}
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-medium">Image Details</h3>
                <button
                  onClick={closeModal}
                  className="p-1 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Image Preview */}
                <div className="md:w-2/3 p-4 flex items-center justify-center bg-secondary/30">
                  <img
                    src={getPreviewUrl(selectedImage.id, 'preview')}
                    alt={`Image ${selectedImage.id}`}
                    className="max-h-[60vh] max-w-full object-contain"
                  />
                </div>
                
                {/* Image Details */}
                <div className="md:w-1/3 p-4 border-t md:border-t-0 md:border-l border-border overflow-y-auto">
                  <div className="space-y-4">
                    {!isEditing ? (
                      <>
                        {/* Author Information */}
                        <div>
                          <div className="flex justify-between items-center">
                            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                              <User className="h-3.5 w-3.5" />
                              Author
                            </h4>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={handleEditStart}
                              className="text-xs"
                            >
                              Edit Details
                            </Button>
                          </div>
                          <p className="mt-1 font-medium">
                            {selectedImage.author || 'No author'}
                          </p>
                        </div>
                        
                        {/* Tags Information */}
                        <div>
                          <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Tag className="h-3.5 w-3.5" />
                            Tags
                          </h4>
                          {selectedImage.tags && selectedImage.tags.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {selectedImage.tags.map((tag, index) => (
                                <span key={index} className="px-2 py-0.5 bg-secondary text-xs rounded-full">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-1 text-sm text-muted-foreground">No tags</p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium mb-2 inline-flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Author
                          </label>
                          <AuthorInput
                            value={editAuthor}
                            onChange={setEditAuthor}
                            placeholder="Enter author name..."
                          />
                        </div>
                        
                        <div>
                          <label className="text-sm font-medium mb-2 inline-flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            Tags
                          </label>
                          <TagInput
                            value={editTags}
                            onChange={setEditTags}
                            placeholder="Add tags..."
                          />
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setIsEditing(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm"
                            onClick={handleSaveEdit}
                          >
                            Save Changes
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="p-4 border-t border-border flex justify-end gap-2">
                {!isEditing && (
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(selectedImage.id)}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                )}
                <Button variant="outline" onClick={closeModal}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </TransitionWrapper>
    </div>
  );
};

export default ImageSearch;