import React, { useState } from 'react';
import { X, User, Tag, Download, Trash2 } from 'lucide-react';
import Button from './Button';
import TagInput from './TagInput';
import AuthorInput from './AuthorInput';
import { formatFileSize } from '@/lib/utils';
import { getPreviewUrl, updateImageMetadata, updateImageTags, getActualImage } from '@/utils/api';
import type { ImageMetadata } from '@/utils/api';
import { toast } from 'sonner';

interface ImageDetailModalProps {
  image: ImageMetadata;
  onClose: () => void;
  onDelete: () => void;
  onUpdate: (updatedImage: ImageMetadata) => void;
  isAdmin?: boolean;
}

const ImageDetailModal: React.FC<ImageDetailModalProps> = ({
  image,
  onClose,
  onDelete,
  onUpdate,
  isAdmin = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTags, setEditTags] = useState<string[]>(image.tags);
  const [editAuthor, setEditAuthor] = useState(image.author);

  const handleDownload = async () => {
    try {
      const response = await fetch(getActualImage(image.id));
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const contentType = response.headers.get('content-type');
      const extension = contentType ? `.${contentType.split('/')[1]}` : '';
      a.download = `image-${image.id}${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to download image');
    }
  };

  const handleSaveEdit = async () => {
    try {
      const imageId = parseInt(image.id);
      const updateData = {
        tags: editTags,
        author: editAuthor
      };
  
      if (image.untagged_full_path) {
        await updateImageTags(imageId, updateData);
      } else {
        await updateImageMetadata(imageId, updateData);
      }
  
      const updatedImage = {
        ...image,
        tags: editTags,
        author: editAuthor
      };
      
      onUpdate(updatedImage);
      setIsEditing(false);
      toast.success('Changes saved successfully');
    } catch (error) {
      toast.error('Failed to save changes');
    }
  };

  // CSS Classes
  const styles = {
    overlay: "fixed inset-0 z-50",
    backdrop: "fixed inset-0 bg-background/80 backdrop-blur-sm",
    modalContainer: "fixed top-16 left-0 right-0 bottom-0 flex items-start justify-center overflow-y-auto",
    modalContent: "w-full max-w-4xl m-4 bg-card border border-border rounded-xl shadow-elevation",
    header: "sticky top-0 p-4 border-b border-border flex items-center justify-between bg-card z-10",
    closeButton: "p-1 rounded-full hover:bg-secondary transition-colors",
    body: "flex flex-col md:flex-row",
    imageSection: "md:w-2/3 p-4 bg-secondary/30 flex items-center justify-center",
    image: "max-h-[calc(100vh-16rem)] w-auto object-contain",
    detailsSection: "md:w-1/3 p-4 border-t md:border-t-0 md:border-l border-border",
    footer: "sticky bottom-0 p-4 border-t border-border flex justify-end gap-2 bg-card",
    tag: "px-2 py-0.5 bg-secondary text-xs rounded-full",
    infoRow: "flex justify-between items-center text-sm py-1",
    infoLabel: "text-muted-foreground",
    infoValue: "text-right",
  };

  return (
    <div className={styles.overlay}>
        <div className={styles.backdrop} />
        <div className={styles.modalContainer}>
            <div className={styles.modalContent}>
            {/* Header */}
            <div className={styles.header}>
              <h3 className="text-lg font-medium">Image Details</h3>
              <button onClick={onClose} className={styles.closeButton}>
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className={styles.body}>
              {/* Image Preview */}
              <div className={styles.imageSection}>
                <img
                  src={getPreviewUrl(image.id, 'preview')}
                  alt={`Image ${image.id}`}
                  className={styles.image}
                />
              </div>

              {/* Details Panel */}
              <div className={styles.detailsSection}>
                {!isEditing ? (
                  <div className="space-y-4">
                    {/* Author */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          <User className="h-3.5 w-3.5" />
                          Author
                        </h4>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsEditing(true)}
                          className="text-xs"
                        >
                          Edit Details
                        </Button>
                      </div>
                      <p className="font-medium">{image.author || 'No author'}</p>
                    </div>

                    {/* Tags */}
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                        <Tag className="h-3.5 w-3.5" />
                        Tags
                      </h4>
                      {image.tags && image.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {image.tags.map((tag, index) => (
                            <span key={index} className={styles.tag}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No tags</p>
                      )}
                    </div>

                    {/* File Information */}
                    <div>
                      <h4 className="text-sm font-medium mb-2">File Information</h4>
                      <div className="space-y-1">
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Filename:</span>
                          <span className={styles.infoValue}>{image.filename}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Date Added:</span>
                          <span className={styles.infoValue}>
                            {new Date(image.date_added).toLocaleDateString()}
                          </span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>File Size:</span>
                          <span className={styles.infoValue}>{formatFileSize(image.file_size)}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>File Type:</span>
                          <span className={styles.infoValue}>{image.file_type}</span>
                        </div>
                        <div className={styles.infoRow}>
                          <span className={styles.infoLabel}>Dimensions:</span>
                          <span className={styles.infoValue}>{image.width} × {image.height}</span>
                        </div>
                      </div>
                    </div>
                  </div>
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

            {/* Footer */}
            <div className={styles.footer}>
              {!isEditing && (
                <>
                  <Button
                    variant="outline"
                    onClick={handleDownload}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                  {isAdmin && (
                    <Button
                      variant="destructive"
                      onClick={onDelete}
                      className="flex items-center gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </>
              )}
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </div>
  );
};

export default ImageDetailModal;