
// API Connection Layer - Connects to FAST API instance

const BASE_URL = 'http://localhost:8000';

// =============================================================================
// Type Definitions
// =============================================================================

// Types for API responses
export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  username: string;
  is_active: boolean;
  is_superuser: boolean;
  date_joined: string;
  last_login?: string;
}

export interface ImageMetadata {
  id: string;
  filename: string;
  tagged_full_path: string;
  tagged_thumb_path: string;
  untagged_full_path: string;
  untagged_thumb_path: string;
  tags: string[];
  date_added: string;
  author: string;
  file_size: number;
  file_type: string;
  width: number;
  height: number;
}

export interface UpdateImageTagsData {
  tags: string[];
  author?: string;
  filename?: string;
}

export interface Author {
  id: number;
  name: string;
  email: string;
  date_added: string;
}

interface SearchFilters {
  tags?: string[];
  author?: string;
}

// =============================================================================
// Authentication & User Management
// =============================================================================

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  try {
    const response = await fetch(`${BASE_URL}/auth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        username: email, // FastAPI OAuth2 expects 'username' even for email
        password: password,
        grant_type: 'password'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Login failed');
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error('Login failed. Please check your credentials.');
  }
};

export const logout = (): void => {
  localStorage.removeItem('auth_token');
  window.location.href = '/login';
};

// Get current user profile
export const getCurrentUser = async (): Promise<User> => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    throw new Error('No authentication token found');
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      if (response.status === 401) {
        // Clear token and redirect to login if unauthorized
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
        throw new Error('Session expired. Please login again.');
      }
      throw new Error(errorData.detail || `Failed to fetch user data (${response.status})`);
    }

    return await response.json();
  } catch (error) {
    console.error('getCurrentUser error:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (userData: {
  email?: string;
  username?: string;
  password?: string;
  currentPassword?: string;
}): Promise<User> => {
  try {
    const response = await fetch(`${BASE_URL}/users/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...authHeader()
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Update profile error details:', errorData);
      throw new Error(errorData.detail || 'Failed to update profile');
    }

    const updatedUser = await response.json();
    return updatedUser;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

export const testAuth = async (): Promise<any> => {
  const response = await fetch(`${BASE_URL}/auth/test-token`, {
    headers: {
      ...authHeader()
    }
  });
  return handleResponse(response);
};

// =============================================================================
// Authentication Helpers
// =============================================================================

// Get the authentication token
export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

export const getAuthToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('auth_token');
  return !!token; // Returns true if token exists, false otherwise
};

// Add auth header to requests
export const authHeader = () => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  return {
    'Content-Type': 'application/json'
  };
};

// Helper to inspect the token
export const debugToken = () => {
  const token = localStorage.getItem('auth_token');
  console.log('Stored token:', token);
  if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    console.log('Token payload:', payload);
  }
};

// =============================================================================
// Image Management
// =============================================================================

// Image upload functions
export const uploadImages = async (files: File[]): Promise<{ 
  success: boolean, 
  message: string, 
  failed?: string[] 
}> => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  const response = await fetch(`${BASE_URL}/images/upload/batch`, {
    method: 'POST',
    headers: {
      ...authHeader()
    },
    body: formData
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to upload images');
  }

  return response.json();
};

export const getImageById = async (imageId: number): Promise<ImageMetadata> => {
  const response = await fetch(`${BASE_URL}/images/search/${imageId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch image');
  }
  return response.json();
};

export const updateImageMetadata = async (
  imageId: number,
  updateData: UpdateImageTagsData
): Promise<ImageMetadata> => {
  const response = await fetch(`${BASE_URL}/images/metadata/${imageId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader()
    },
    body: JSON.stringify(updateData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update image metadata');
  }

  return response.json();
};

export const deleteImage = async (imageId: string | number): Promise<void> => {
  const url = `${BASE_URL}/images/images/${imageId}`;
  console.log('Delete URL:', url); // Add this line to debug
  
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      ...authHeader()
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete image: ${error}`);
  }
};

// =============================================================================
// Image URLs & Previews
// =============================================================================

// Get image URL
export const getImageUrl = (imageId: string): string => {
  return `${BASE_URL}/images/${imageId}/content`;
};

// Get image URL
export const getUntaggedImageUrl = (image: ImageMetadata): string => {
  // Use the URL provided by the API
  return `${BASE_URL}${image.untagged_full_path}`;
};

export const getUntaggedPreviewUrl = (imageId: string, maxSize: number = 800): string => {
  return `${BASE_URL}/preview/untagged/preview/${imageId}?max_size=${maxSize}`;
};

export const getPreviewUrl = (imageId: string, size: 'preview' | 'search'): string => {
  return `${BASE_URL}/images/preview/${size}/${imageId}`;
};

export const getActualImage = (imageId: string): string => {
  return `${BASE_URL}/images/content/${imageId}`;
};

// =============================================================================
// Image Tagging & Search
// =============================================================================

export const searchImages = async (filters: SearchFilters): Promise<ImageMetadata[]> => {
  const params = new URLSearchParams();
  
  if (filters.tags && filters.tags.length > 0) {
    params.append('tags', filters.tags.join(','));
  }
  
  if (filters.author) {
    params.append('author', filters.author);
  }
  
  const response = await fetch(`${BASE_URL}/images/search?${params.toString()}`, {
    headers: {
      ...authHeader()
    }
  });

  if (!response.ok) {
    throw new Error('Failed to search images');
  }
  
  return response.json();
};

// Get untagged images
export const getUntaggedImages = async (limit: number = 10): Promise<ImageMetadata[]> => {
  const response = await fetch(`/images/untagged?limit=${limit}`);
  if (!response.ok) {
    throw new Error('Failed to fetch untagged images');
  }
  return response.json();
};

export const getNextUntaggedImage = async (): Promise<ImageMetadata[]> => {
  const response = await fetch(`${BASE_URL}/images/untagged/next`);
  if (!response.ok) {
    throw new Error('Failed to fetch untagged images');
  }
  return response.json();
};

// Update image tags
export const updateImageTags = async (
  imageId: number,
  updateData: UpdateImageTagsData
): Promise<ImageMetadata> => {
  const response = await fetch(`${BASE_URL}/images/tags/${imageId}`, {
      method: 'PUT',
      headers: {
          'Content-Type': 'application/json',
          ...authHeader()
      },
      body: JSON.stringify(updateData)
  });

  if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to update image tags');
  }

  return response.json();
};

export const searchTags = async (query: string): Promise<string[]> => {
  const response = await fetch(`${BASE_URL}/tags/search?query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch tag suggestions');
  }
  const tags = await response.json();
  return tags.map((tag: { name: string }) => tag.name);
};

// =============================================================================
// Author Management
// =============================================================================

export const getAuthorsData = async (): Promise<Author[]> => {
  const response = await fetch(`${BASE_URL}/authors/`);
  return response.json();
};

export const getAuthorById = async (author_id: number): Promise<Author> => {
  const response = await fetch(`${BASE_URL}/authors/${author_id}`);
  return response.json();
};

export const searchAuthors = async (query: string): Promise<Author[]> => {
  const response = await fetch(`${BASE_URL}/authors/search?query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch author suggestions');
  }
  return response.json();
};

export const updateAuthorData = async (
  author_id: number,
  updateData: Author
): Promise<Author> => {
  const response = await fetch(`${BASE_URL}/authors/${author_id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader()
    },
    body: JSON.stringify(updateData)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to update image metadata');
  }

  return response.json();
};

export const createAuthor = async (author: Author): Promise<Author> => {
  const response = await fetch(`${BASE_URL}/authors/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader()
    },
    body: JSON.stringify(author)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || 'Failed to create author');
  }

  return response.json();
}

export const deleteAuthorData = async (author_id: number): Promise<void> => {
  const response = await fetch(`${BASE_URL}/authors/${author_id}`, {
    method: 'DELETE',
    headers: {
      ...authHeader()
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to delete author: ${error}`);
  }
};

// =============================================================================
// Error Handling
// =============================================================================

// Helper for handling HTTP errors
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Error: ${response.status}`);
  }
  
  return response.json();
};

const handleApiError = (error: any) => {
  if (error.response?.status === 401) {
    // Unauthorized - clear token and redirect to login
    logout();
    throw new Error('Session expired. Please sign in again.');
  }
  throw error;
};