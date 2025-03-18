
import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Image as ImageIcon } from 'lucide-react';

interface ImageCardProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: string;
  onClick?: () => void;
  tags?: string[];
  author?: string;
}

const ImageCard: React.FC<ImageCardProps> = ({
  src,
  alt,
  className,
  aspectRatio = "4/3",
  onClick,
  tags,
  author
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  return (
    <div 
      className={cn(
        "group overflow-hidden rounded-xl bg-secondary/30 border border-border/50 transition-all duration-300",
        onClick && "cursor-pointer hover:shadow-elevation",
        className
      )}
      onClick={onClick}
    >
      <div 
        className="relative overflow-hidden" 
        style={{ aspectRatio }}
      >
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-secondary animate-pulse">
            <ImageIcon className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
        
        {hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary">
            <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground mt-2">Failed to load image</p>
          </div>
        )}
        
        <img
          src={src}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            isLoading ? "opacity-0 scale-[1.02]" : "opacity-100 scale-100",
            hasError && "hidden"
          )}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      {(tags || author) && (
        <div className="p-3">
          {author && (
            <p className="text-sm font-medium truncate">{author}</p>
          )}
          
          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.slice(0, 3).map((tag, index) => (
                <span 
                  key={index} 
                  className="px-2 py-0.5 bg-secondary text-xs rounded-full text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="px-2 py-0.5 bg-secondary text-xs rounded-full text-muted-foreground">
                  +{tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageCard;
