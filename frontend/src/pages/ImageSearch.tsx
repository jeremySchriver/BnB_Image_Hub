import React, { useState, useEffect } from 'react';
import { Search as SearchIcon, Tag, Filter, X, HelpCircle, User } from 'lucide-react';
import { toast } from 'sonner';
import TransitionWrapper from '@/components/TransitionWrapper';
import Button from '@/components/Button';
import Navbar from '@/components/Navbar';
import ImageCard from '@/components/ImageCard';
import TagInput from '@/components/TagInput';
import AuthorInput from '@/components/AuthorInput';
import { cn } from '@/lib/utils';
import { searchImages, getPreviewUrl } from '@/utils/api';
import type { ImageMetadata } from '@/utils/api';

const ImageSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);
  
  // Filter states
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterAuthor, setFilterAuthor] = useState('');

  // Initial load
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

  // Fetch images when filters change - only after initial load
  useEffect(() => {
    if (hasInitialized) {
      fetchImages();
    }
  }, [filterTags, filterAuthor, hasInitialized]);

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
      // Only show error toast if component is mounted and initialized
      if (hasInitialized) {
        console.error('Failed to fetch images:', error);
        toast.error('Failed to load images');
      }
      setImages([]);
    } finally {
      setIsLoading(false);
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

  return (
    <div className="min-h-screen pb-16 sm:pb-0 sm:pt-16 bg-background">
      <Navbar />
      
      <TransitionWrapper className="container max-w-6xl py-6 sm:py-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Image Gallery</h1>
          <p className="text-muted-foreground mt-2">
            Browse and filter your image collection
          </p>
        </div>
        
        {/* Filters Section */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </h2>
            {(filterTags.length > 0 || filterAuthor.trim().length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
              >
                Clear All
              </Button>
            )}
          </div>

          <div className="mt-4 space-y-4">
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

        {/* Image Grid */}
        <div className="mt-8">
          {isLoading ? (
            <div className="h-60 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="mt-4 text-muted-foreground">Loading images...</p>
            </div>
          ) : images.length > 0 ? (
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
            <div 
              className="bg-card border border-border rounded-xl shadow-elevation max-w-4xl w-full max-h-[90vh] flex flex-col animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="text-lg font-medium">Image Details</h3>
                <button
                  onClick={closeModal}
                  className="p-1 rounded-full hover:bg-secondary transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                <div className="md:w-2/3 p-4 flex items-center justify-center bg-secondary/30">
                  <img
                    src={getPreviewUrl(selectedImage.id, 'preview')}
                    alt={`Image ${selectedImage.id}`}
                    className="max-h-[60vh] max-w-full object-contain"
                  />
                </div>
                
                <div className="md:w-1/3 p-4 border-t md:border-t-0 md:border-l border-border overflow-y-auto">
                  <div className="space-y-4">
                    {selectedImage.author && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <User className="h-3.5 w-3.5" />
                          Author
                        </h4>
                        <p className="mt-1 font-medium">{selectedImage.author}</p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                        <Tag className="h-3.5 w-3.5" />
                        Tags
                      </h4>
                      {selectedImage.tags && selectedImage.tags.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {selectedImage.tags.map((tag, index) => (
                            <span 
                              key={index} 
                              className="px-2 py-0.5 bg-secondary text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-sm text-muted-foreground">No tags</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-border flex justify-end">
                <Button
                  variant="outline"
                  onClick={closeModal}
                >
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