import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Save, Tag as TagIcon } from 'lucide-react';
import { toast } from 'sonner';
import TransitionWrapper from '@/components/TransitionWrapper';
import Button from '@/components/Button';
import Navbar from '@/components/Navbar';
import TagInput from '@/components/TagInput';
import { updateImageTags, getNextUntaggedImage } from '@/utils/api';
import type { ImageMetadata } from '@/utils/api';
import AuthorInput from '@/components/AuthorInput';
import { getUntaggedPreviewUrl } from '@/utils/api';


const ImageTagging = () => {
  const [currentImage, setCurrentImage] = useState<ImageMetadata | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [author, setAuthor] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    fetchNextImage();
  }, []);

  const fetchNextImage = async () => {
    setLoading(true);
    try {
      const data = await getNextUntaggedImage();
      if (data && data.length > 0) {
        setCurrentImage(data[0]);
        resetFormState();
      } else {
        setCurrentImage(null);
        resetFormState();
        // Show informative toast instead of error
        toast.info('No untagged images available');
      }
    } catch (error) {
      console.error('Error fetching next untagged image:', error);
      // Only show error toast for actual API failures
      if (error instanceof Error && error.message !== 'No images found') {
        toast.error('Failed to connect to image service');
      } else {
        toast.info('No untagged images available');
      }
      setCurrentImage(null);
    } finally {
      setLoading(false);
    }
  };

  const resetFormState = () => {
    setAuthor('');
    setTags([]);
  };

  const handleSave = async () => {
    if (!currentImage) return;
    
    setSaving(true);
    setLoading(true); // Add loading state immediately
    
    try {
      const imageId = parseInt(currentImage.id);
      if (isNaN(imageId)) {
        throw new Error('Invalid image ID');
      }
  
      const updateData = {
        tags,
        author: author || undefined
      };
  
      await updateImageTags(imageId, updateData);
      toast.success('Image tags saved successfully');
      
      // Get next image immediately after successful save
      const nextImageData = await getNextUntaggedImage();
      if (nextImageData && nextImageData.length > 0) {
        setCurrentImage(nextImageData[0]);
        resetFormState();
      } else {
        setCurrentImage(null);
        resetFormState();
      }
      
    } catch (error) {
      console.error('Error saving image tags:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to save tags';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <TransitionWrapper className="max-w-screen-2xl mx-auto">
        {loading ? (
          <div className="text-center py-12 mt-[72px]">Loading image...</div>
        ) : !currentImage ? (
          <div className="text-center py-12 mt-[72px]">
            <h3 className="text-xl font-semibold mb-4">No untagged images found</h3>
            <Button onClick={fetchNextImage}>Refresh</Button>
          </div>
        ) : (
          <div className="space-y-4 mt-[72px]">
            {/* Image preview */}
            <div className="h-[calc(100vh-280px)] flex items-center justify-center bg-secondary/30">
              <img
                src={getUntaggedPreviewUrl(currentImage.id)}
                alt={currentImage.filename}
                className="max-h-full max-w-full object-contain rounded-lg"
                loading="lazy"
                onError={(e) => {
                  console.error('Error loading image:', e);
                  toast.error('Failed to load image preview');
                }}
              />
            </div>

            {/* Form section */}
            <div className="space-y-4 px-4 pb-4 max-w-4xl mx-auto">
              <AuthorInput
                value={author}
                onChange={setAuthor}
                placeholder="Enter author name..."
                className="w-full"
              />
              
              <TagInput
                value={tags}
                onChange={setTags}
                placeholder="Add tags..."
              />

              <div className="flex justify-between">
                <Button onClick={fetchNextImage}>Skip</Button>
                <Button onClick={handleSave} disabled={saving}>Save Tags</Button>
              </div>
            </div>
          </div>
        )}
      </TransitionWrapper>
    </div>
  );
};

export default ImageTagging;