import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { searchAuthors } from '@/utils/api';

interface AuthorInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const AuthorInput: React.FC<AuthorInputProps> = ({
  value,
  onChange,
  placeholder = 'Add author...',
  className
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const debouncedInput = useDebounce(inputValue, 300);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      // Only fetch suggestions if we're not displaying a selected value
      if (debouncedInput.trim().length > 0 && debouncedInput !== value) {
        try {
          const authorSuggestions = await searchAuthors(debouncedInput);
          setSuggestions(authorSuggestions.map(author => author.name));
          setShowSuggestions(true);
        } catch (error) {
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

  const handleSelection = (selectedValue: string) => {
    setInputValue(selectedValue);
    onChange(selectedValue);
    setSuggestions([]); // Clear suggestions immediately
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (!newValue.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      onChange('');
    }
    setSelectedIndex(-1);
  };
  
  // Update the keydown handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        onChange(suggestions[selectedIndex]);
      } else if (inputValue) {
        onChange(inputValue);
      }
      setInputValue('');
      setSuggestions([]);
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => inputValue.trim().length > 0 && setShowSuggestions(true)}
        placeholder={placeholder}
        className={cn(
          "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-background border border-border rounded-lg shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              onClick={() => handleSelection(suggestion)}
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

export default AuthorInput;