
import React, { useState, useEffect, useCallback } from 'react';
import { Search as SearchIcon, Tag, Filter, X, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import TransitionWrapper from '@/components/TransitionWrapper';
import Button from '@/components/Button';
import Navbar from '@/components/Navbar';
import ImageCard from '@/components/ImageCard';
import TagInput from '@/components/TagInput';
import { cn, debounce } from '@/lib/utils';
import { searchImages, getImageUrl } from '@/utils/api';
import type { ImageMetadata } from '@/utils/api';

const ImageSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ImageMetadata[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageMetadata | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filterTags, setFilterTags] = useState<string[]>([]);
  
  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      performSearch(query);
    }, 300),
    []
  );
  
  useEffect(() => {
    if (searchQuery) {
      debouncedSearch(searchQuery);
    } else if (searchQuery === '') {
      setSearchResults([]);
    }
  }, [searchQuery, debouncedSearch]);
  
  useEffect(() => {
    if (filterTags.length > 0) {
      performSearch(searchQuery || '*');
    }
  }, [filterTags]);
  
  const performSearch = async (query: string) => {
    if (!query && filterTags.length === 0) return;
    
    setIsSearching(true);
    
    try {
      // Combine search query with tags filter
      let finalQuery = query;
      if (filterTags.length > 0) {
        const tagsQuery = filterTags.join(',');
        finalQuery = `${finalQuery || '*'} tags:${tagsQuery}`;
      }
      
      const results = await searchImages(finalQuery);
      setSearchResults(results);
      
      if (results.length === 0) {
        toast.info('No images found matching your search', {
          id: 'no-results'
        });
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to search images');
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      performSearch(searchQuery);
    }
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    setFilterTags([]);
    setSearchResults([]);
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
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Image Search</h1>
          <p className="text-muted-foreground mt-2">
            Find images in your collection by tags and attributes
          </p>
        </div>
        
        {/* Search Bar */}
        <div className="bg-card border border-border rounded-xl p-4 sm:p-6 mt-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <input
              type="text"
              placeholder="Search for images..."
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              className="w-full pl-10 pr-16 py-3 border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 focus:ring-offset-background transition-all duration-200"
            />
            
            {(searchQuery || filterTags.length > 0) && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute inset-y-0 right-12 flex items-center px-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground",
                showFilters && "text-primary"
              )}
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
          
          {showFilters && (
            <div className="mt-4 p-4 border border-border rounded-lg bg-secondary/30 animate-fade-in">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Filter by Tags</label>
                  <TagInput
                    value={filterTags}
                    onChange={setFilterTags}
                    placeholder="Add tags to filter by..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Search Results */}
        <div className="mt-8">
          {isSearching ? (
            <div className="h-60 flex flex-col items-center justify-center">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <p className="mt-4 text-muted-foreground">Searching images...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <>
              <h2 className="text-lg font-medium mb-4">
                Results <span className="text-muted-foreground">({searchResults.length} images)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map((image) => (
                  <ImageCard
                    key={image.id}
                    src={getImageUrl(image.id)}
                    alt={image.filename}
                    tags={image.tags}
                    author={image.author}
                    onClick={() => handleImageSelect(image)}
                  />
                ))}
              </div>
            </>
          ) : searchQuery || filterTags.length > 0 ? (
            <div className="h-60 flex flex-col items-center justify-center text-center border border-border rounded-lg bg-card">
              <HelpCircle className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">No images found</h3>
              <p className="mt-2 text-muted-foreground max-w-md">
                Try using different search terms or filters
              </p>
            </div>
          ) : (
            <div className="h-60 flex flex-col items-center justify-center text-center border border-dashed border-border rounded-lg">
              <SearchIcon className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Search for images</h3>
              <p className="mt-2 text-muted-foreground max-w-md">
                Enter search terms above to find images in your collection
              </p>
              <div className="mt-6 flex items-center justify-center text-sm space-x-2">
                <span className="text-muted-foreground">Try searching for:</span>
                {['nature', 'architecture', 'portrait'].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setSearchQuery(suggestion)}
                    className="px-3 py-1 bg-secondary rounded-full hover:bg-secondary/80 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
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
                <h3 className="text-lg font-medium truncate">{selectedImage.filename}</h3>
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
                    src={getImageUrl(selectedImage.id)}
                    alt={selectedImage.filename}
                    className="max-h-[60vh] max-w-full object-contain"
                  />
                </div>
                
                <div className="md:w-1/3 p-4 border-t md:border-t-0 md:border-l border-border overflow-y-auto">
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground">File Information</h4>
                      <ul className="mt-2 space-y-1">
                        <li className="flex justify-between text-sm">
                          <span>Name:</span>
                          <span className="font-medium truncate max-w-[150px]">{selectedImage.filename}</span>
                        </li>
                        <li className="flex justify-between text-sm">
                          <span>Type:</span>
                          <span className="font-medium">{selectedImage.file_type}</span>
                        </li>
                        <li className="flex justify-between text-sm">
                          <span>Size:</span>
                          <span className="font-medium">{(selectedImage.file_size / 1024).toFixed(2)} KB</span>
                        </li>
                        <li className="flex justify-between text-sm">
                          <span>Date:</span>
                          <span className="font-medium">{new Date(selectedImage.upload_date).toLocaleDateString()}</span>
                        </li>
                      </ul>
                    </div>
                    
                    {selectedImage.author && (
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground">Author</h4>
                        <p className="mt-1 font-medium">{selectedImage.author}</p>
                      </div>
                    )}
                    
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                        <Tag className="h-3.5 w-3.5 mr-1" />
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
