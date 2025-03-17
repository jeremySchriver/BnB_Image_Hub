
import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Save, Tag as TagIcon, Info } from 'lucide-react';
import { toast } from 'sonner';
import TransitionWrapper from '@/components/TransitionWrapper';
import Button from '@/components/Button';
import Navbar from '@/components/Navbar';
import TagInput from '@/components/TagInput';
import { getUntaggedImages, updateImageTags, getImageUrl } from '@/utils/api';
import type { ImageMetadata } from '@/utils/api';
import { formatFileSize } from '@/lib/utils';

const ImageTagging = () => {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isInfoVisible, setIsInfoVisible] = useState(false);

  const currentImage = images[currentIndex];

  useEffect(() => {
    fetchUntaggedImages();
  }, []);

  const fetchUntaggedImages = async () => {
    setLoading(true);
    try {
      const data = await getUntaggedImages(10);
      setImages(data);
      setCurrentIndex(0);
      // Reset form state for the first image
      resetFormState();
    } catch (error) {
      console.error('Error fetching untagged images:', error);
      toast.error('Failed to load images');
    } finally {
      setLoading(false);
    }
  };

  const resetFormState = () => {
    setAuthor('');
    setTags([]);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      resetFormState();
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
      resetFormState();
    }
  };

  const handleSave = async () => {
    if (!currentImage) return;
    
    setSaving(true);
    
    try {
      await updateImageTags(currentImage.id, author, tags);
      
      toast.success('Image tags saved successfully');
      
      // Remove the tagged image from the list
      setImages(prev => prev.filter((_, index) => index !== currentIndex));
      
      // Adjust current index if needed
      if (currentIndex >= images.length - 1) {
        setCurrentIndex(Math.max(0, images.length - 2));
      }
      
      // Reset form state
      resetFormState();
      
      // If no more images, fetch new ones
      if (images.length <= 1) {
        fetchUntaggedImages();
      }
    } catch (error) {
      console.error('Error saving image tags:', error);
      toast.error('Failed to save tags');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-16 sm:pb-0 sm:pt-16 bg-background">
      <Navbar />
      
      <TransitionWrapper className="container max-w-4xl py-6 sm:py-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Image Tagging</h1>
          <p className="text-muted-foreground mt-2">
            Add author information and tags to your images
          </p>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
            <p className="mt-4 text-muted-foreground">Loading images...</p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 border border-border rounded-xl bg-card">
            <TagIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No untagged images found</h3>
            <p className="mt-2 text-muted-foreground">
              All images have been tagged or you need to upload new images
            </p>
            <Button
              className="mt-6"
              onClick={fetchUntaggedImages}
            >
              Refresh
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Image preview section */}
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <div className="relative aspect-[16/9] bg-secondary/50">
                {currentImage && (
                  <img
                    src={getImageUrl(currentImage.id)}
                    alt={currentImage.filename}
                    className="w-full h-full object-contain"
                  />
                )}
                
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <h3 className="text-white font-medium truncate">
                    {currentImage?.filename}
                  </h3>
                </div>
                
                <button
                  type="button"
                  className="absolute top-4 right-4 p-2 rounded-full bg-background/80 text-foreground hover:bg-background transition-colors"
                  onClick={() => setIsInfoVisible(!isInfoVisible)}
                >
                  <Info className="h-5 w-5" />
                </button>
              </div>
              
              {isInfoVisible && currentImage && (
                <div className="p-4 border-t border-border bg-secondary/30">
                  <h4 className="font-medium mb-2">Image Information</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">File name:</span>
                      <span>{currentImage.filename}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">File size:</span>
                      <span>{formatFileSize(currentImage.file_size)}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">File type:</span>
                      <span>{currentImage.file_type}</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Upload date:</span>
                      <span>{new Date(currentImage.upload_date).toLocaleDateString()}</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
            
            {/* Tagging form */}
            <div className="space-y-6 bg-card border border-border rounded-xl p-6">
              <div>
                <label htmlFor="author" className="block text-sm font-medium mb-2">
                  Author
                </label>
                <input
                  id="author"
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:ring-2 focus:ring-primary/30 focus:ring-offset-1 focus:ring-offset-background transition-all duration-200"
                  placeholder="Enter author name"
                />
              </div>
              
              <div>
                <label htmlFor="tags" className="block text-sm font-medium mb-2">
                  Tags
                </label>
                <TagInput
                  value={tags}
                  onChange={setTags}
                  placeholder="Add tags... (press Enter or comma to add)"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Add descriptive tags to make the image easier to find
                </p>
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<ChevronLeft className="h-4 w-4" />}
                    onClick={handlePrevious}
                    disabled={currentIndex === 0 || saving}
                  >
                    Previous
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    iconPosition="right"
                    icon={<ChevronRight className="h-4 w-4" />}
                    onClick={handleNext}
                    disabled={currentIndex >= images.length - 1 || saving}
                  >
                    Next
                  </Button>
                </div>
                
                <Button
                  icon={<Save className="h-4 w-4" />}
                  onClick={handleSave}
                  isLoading={saving}
                  disabled={tags.length === 0}
                >
                  Save Tags
                </Button>
              </div>
            </div>
            
            {/* Pagination indicator */}
            <div className="flex justify-center">
              <p className="text-sm text-muted-foreground">
                Image {currentIndex + 1} of {images.length}
              </p>
            </div>
          </div>
        )}
      </TransitionWrapper>
    </div>
  );
};

export default ImageTagging;
