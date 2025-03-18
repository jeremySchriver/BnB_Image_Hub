
import React, { useState, useRef, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  maxTags?: number;
}

const TagInput: React.FC<TagInputProps> = ({
  value = [],
  onChange,
  placeholder = 'Add tag...',
  className,
  maxTags = 20
}) => {
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    
    if (!trimmedTag) return;
    if (value.includes(trimmedTag)) return;
    if (value.length >= maxTags) return;
    
    onChange([...value, trimmedTag]);
    setInputValue('');
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const trimmedInput = inputValue.trim();
    
    if (e.key === 'Enter' && trimmedInput) {
      e.preventDefault();
      addTag(trimmedInput);
    } else if (e.key === 'Backspace' && !trimmedInput && value.length > 0) {
      removeTag(value.length - 1);
    } else if (e.key === ',' && trimmedInput) {
      e.preventDefault();
      addTag(trimmedInput.replace(',', ''));
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  return (
    <div 
      className={cn(
        "flex flex-wrap items-center gap-1.5 p-2 border border-input rounded-lg bg-background focus-within:ring-2 focus-within:ring-primary/30 focus-within:ring-offset-1 focus-within:ring-offset-background transition-all duration-200 min-h-[38px]",
        className
      )}
      onClick={handleContainerClick}
    >
      {value.map((tag, index) => (
        <div 
          key={index}
          className="inline-flex items-center bg-secondary text-secondary-foreground text-sm px-2.5 py-0.5 rounded-full gap-1.5 group"
        >
          <span>{tag}</span>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(index);
            }}
            className="text-muted-foreground hover:text-foreground focus:outline-none rounded-full"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ''}
        className="outline-none bg-transparent flex-1 min-w-[120px] text-sm py-1"
        disabled={value.length >= maxTags}
      />
      
      {value.length >= maxTags && (
        <span className="text-xs text-muted-foreground ml-2">
          Max {maxTags} tags
        </span>
      )}
    </div>
  );
};

export default TagInput;
