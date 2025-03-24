import React, { useState, useRef, KeyboardEvent, useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { searchTags } from '@/utils/api';
import { useDebounce } from '@/hooks/useDebounce';

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
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedInput = useDebounce(inputValue, 300);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedInput.trim().length > 0) {
        try {
          const tagSuggestions = await searchTags(debouncedInput);
          // Filter out tags that are already selected
          const filteredSuggestions = tagSuggestions.filter(tag => !value.includes(tag));
          setSuggestions(filteredSuggestions);
          setShowSuggestions(filteredSuggestions.length > 0);
        } catch (error) {
          console.error('Failed to fetch tag suggestions:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedInput, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setSelectedIndex(-1);
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim().toLowerCase();
    if (!trimmedTag || value.includes(trimmedTag) || value.length >= maxTags) return;
    
    onChange([...value, trimmedTag]);
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        addTag(suggestions[selectedIndex]);
      } else if (inputValue) {
        addTag(inputValue);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 p-2 border border-input rounded-lg bg-background focus-within:ring-2 focus-within:ring-primary/30 focus-within:ring-offset-1 focus-within:ring-offset-background transition-all duration-200 min-h-[38px]">
        {/* Existing tag chips */}
        {value.map((tag, index) => (
          <div key={index} className="inline-flex items-center bg-secondary text-secondary-foreground text-sm px-2.5 py-0.5 rounded-full gap-1.5">
            <span>{tag}</span>
            <button 
              type="button"
              onClick={() => onChange(value.filter((_, i) => i !== index))}
              className="text-muted-foreground hover:text-foreground"
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
          onFocus={() => inputValue.trim().length > 0 && setShowSuggestions(true)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-sm py-1"
          disabled={value.length >= maxTags}
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-[200px] overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              onClick={() => addTag(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors",
                index === selectedIndex && "bg-secondary"
              )}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TagInput;