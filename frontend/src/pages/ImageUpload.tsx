import React, { useState, useRef } from 'react';
import { Upload, FolderOpen, File, X, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import TransitionWrapper from '@/components/TransitionWrapper';
import Button from '@/components/Button';
import Navbar from '@/components/Navbar';
import { uploadImages } from '@/utils/api';
import { formatFileSize } from '@/lib/utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { DirectoryInputProps } from '@/utils/types';

interface FileUploadItem {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  previewUrl?: string;
}

const ImageUpload = () => {
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = (selectedFiles: FileList | null, source: 'file' | 'folder') => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    const newFiles = Array.from(selectedFiles)
      .filter(file => file.type.startsWith('image/'))
      .map(file => {
        // Create an object URL for preview
        const previewUrl = URL.createObjectURL(file);
        
        return {
          file,
          id: `${file.name}-${Date.now()}`,
          status: 'pending' as const,
          progress: 0,
          previewUrl
        };
      });
    
    if (newFiles.length === 0) {
      toast.error('No valid image files selected');
      return;
    }
    
    setFiles(prev => [...prev, ...newFiles]);
    
    const nonImageCount = Array.from(selectedFiles).length - newFiles.length;
    if (nonImageCount > 0) {
      toast.warning(`${nonImageCount} non-image files were ignored`);
    }
  };

  // Clean up object URLs when removing files
  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(file => file.id === id);
      if (fileToRemove?.previewUrl) {
        URL.revokeObjectURL(fileToRemove.previewUrl);
      }
      return prev.filter(file => file.id !== id);
    });
  };

  // Clear all files
  const clearFiles = () => {
    if (isUploading) return;
    
    // Clean up all preview URLs
    files.forEach(file => {
      if (file.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
    });
    
    setFiles([]);
  };

  // Clean up object URLs when component unmounts
  React.useEffect(() => {
    return () => {
      files.forEach(file => {
        if (file.previewUrl) {
          URL.revokeObjectURL(file.previewUrl);
        }
      });
    };
  }, []);

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = e.dataTransfer.files;
    handleFileSelect(droppedFiles, 'file');
  };

  // Upload files to the server
  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }
    
    setIsUploading(true);
    
    // Update all files to uploading status
    setFiles(prev => 
      prev.map(file => ({
        ...file,
        status: 'uploading',
        progress: 0
      }))
    );
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setFiles(prev => 
          prev.map(file => {
            if (file.status === 'uploading' && file.progress < 90) {
              return {
                ...file,
                progress: file.progress + (10 * Math.random())
              };
            }
            return file;
          })
        );
      }, 300);
      
      // Actual upload
      const filesToUpload = files.map(item => item.file);
      const response = await uploadImages(filesToUpload);
      
      clearInterval(progressInterval);
      
      if (response.success) {
        const failedCount = response.failed?.length || 0;
        const successCount = files.length - failedCount;
        
        // Update file statuses
        setFiles(prev => 
          prev.map(file => ({
            ...file,
            status: response.failed?.includes(file.file.name) ? 'error' : 'success',
            progress: 100,
            error: response.failed?.includes(file.file.name) ? 'Failed to process image' : undefined
          }))
        );
        
        // Show appropriate toast
        if (failedCount > 0) {
          toast.error(`${failedCount} files failed to upload`);
          toast.success(`${successCount} files uploaded successfully`);
        } else {
          toast.success(response.message);
          // Clear files after success
          setTimeout(() => setFiles([]), 2000);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      setFiles(prev => 
        prev.map(file => ({
          ...file,
          status: 'error',
          progress: 100,
          error: error instanceof Error ? error.message : 'Upload failed'
        }))
      );
      toast.error('Failed to upload images. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen pb-16 sm:pb-0 sm:pt-16 bg-background">
      <Navbar />
      
      <TransitionWrapper className="container max-w-5xl py-6 sm:py-10">
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Image Upload</h1>
          <p className="text-muted-foreground mt-2">
            Select images to upload to your collection
          </p>
        </div>
        
        {/* Upload Area */}
        <div 
          className={`mt-6 border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
            isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50 hover:bg-secondary/30'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="text-center">
            <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Drag and drop your images</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Or select files using the buttons below
            </p>
            
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files, 'file')}
              />
              
              <input
                ref={folderInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files, 'folder')}
                {...{webkitdirectory: "", directory: ""} as DirectoryInputProps}
              />
              
              <Button
                icon={<File className="h-4 w-4" />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                Select Files
              </Button>
              
              <Button
                variant="secondary"
                icon={<FolderOpen className="h-4 w-4" />}
                onClick={() => folderInputRef.current?.click()}
                disabled={isUploading}
              >
                Select Folder
              </Button>
            </div>
          </div>
        </div>
        
        {/* File List */}
        {files.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Selected Files ({files.length})</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFiles}
                disabled={isUploading}
              >
                Clear All
              </Button>
            </div>
            
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="max-h-[350px] overflow-y-auto">
                <ul className="divide-y divide-border">
                  {files.map((file) => (
                    <li key={file.id} className="p-3 sm:p-4 flex items-center">
                      <div className="w-14 h-14 mr-3 flex-shrink-0 bg-secondary rounded overflow-hidden">
                        {file.previewUrl ? (
                          <AspectRatio ratio={1} className="w-full h-full">
                            <img 
                              src={file.previewUrl} 
                              alt={file.file.name}
                              className="w-full h-full object-cover"
                            />
                          </AspectRatio>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {file.status === 'success' ? (
                              <Check className="h-5 w-5 text-primary" />
                            ) : file.status === 'error' ? (
                              <AlertCircle className="h-5 w-5 text-destructive" />
                            ) : (
                              <File className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.file.name}</p>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <span>{formatFileSize(file.file.size)}</span>
                          {file.error && (
                            <span className="ml-2 text-destructive flex items-center">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              {file.error}
                            </span>
                          )}
                        </div>
                        
                        {file.status === 'uploading' && (
                          <div className="w-full bg-secondary h-1.5 rounded-full mt-2 overflow-hidden">
                            <div 
                              className="bg-primary h-full transition-all duration-300 ease-out"
                              style={{ width: `${file.progress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        disabled={isUploading}
                        className="ml-2 p-1 text-muted-foreground hover:text-foreground rounded-full disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button
                onClick={handleUpload}
                isLoading={isUploading}
                icon={<Upload className="h-4 w-4" />}
                size="lg"
              >
                {isUploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </div>
          </div>
        )}
      </TransitionWrapper>
    </div>
  );
};

export default ImageUpload;
