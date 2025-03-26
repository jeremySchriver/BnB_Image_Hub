
// API Connection Layer - Connects to FAST API instance

const BASE_URL = 'http://localhost:8000'; // Change this to the actual FAST API endpoint

// Types for API responses
export interface LoginResponse {
  access_token: string;
  token_type: string;
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

// Helper for handling HTTP errors
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Error: ${response.status}`);
  }
  
  return response.json();
};

// Authentication functions
export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${BASE_URL}/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      username: email, // FastAPI uses username field for the identifier
      password
    })
  });
  
  return handleResponse(response);
};

// Get the authentication token
export const getToken = (): string | null => {
  return localStorage.getItem('auth_token');
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = getToken();
  // Also check for our demo token
  return !!token || token === 'demo_token_for_preview_only';
};

// Add auth header to requests
const authHeader = () => {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Check if we're in demo mode
export const isDemoMode = (): boolean => {
  return getToken() === 'demo_token_for_preview_only';
};

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

// Get image URL
export const getImageUrl = (imageId: string): string => {
  return `${BASE_URL}/images/${imageId}/content`;
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

// Get image URL
export const getUntaggedImageUrl = (image: ImageMetadata): string => {
  // Use the URL provided by the API
  return `${BASE_URL}${image.untagged_full_path}`;
};

export const searchTags = async (query: string): Promise<string[]> => {
  const response = await fetch(`${BASE_URL}/tags/search?query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch tag suggestions');
  }
  const tags = await response.json();
  return tags.map((tag: { name: string }) => tag.name);
};

export const searchAuthors = async (query: string): Promise<Author[]> => {
  const response = await fetch(`${BASE_URL}/authors/search?query=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error('Failed to fetch author suggestions');
  }
  return response.json();
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