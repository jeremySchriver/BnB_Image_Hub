
// Core type definitions for the application

export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface Image {
  id: string;
  filename: string;
  fileSize: number;
  fileType: string;
  uploadDate: string;
  url: string;
  author?: string;
  tags: string[];
  file_size: number,
  file_type: string,
  width: number,
  height: number
}

export interface ImageUploadProgress {
  filename: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface SearchFilters {
  tags?: string[];
  author?: string;
  fileType?: string;
  dateRange?: {
    start: Date | null;
    end: Date | null;
  };
}

// Extended HTML input props to support directory selection
export interface DirectoryInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  webkitdirectory?: string;
  directory?: string;
}
