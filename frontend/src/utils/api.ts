
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
  file_size: number;
  file_type: string;
  upload_date: string;
  author?: string;
  tags: string[];
}

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

// Mock data for demo mode
const MOCK_IMAGES = [
  {
    id: 'img1',
    filename: 'mountain.jpg',
    file_size: 1024000,
    file_type: 'image/jpeg',
    upload_date: new Date().toISOString(),
    author: '',
    tags: []
  },
  {
    id: 'img2',
    filename: 'beach.jpg',
    file_size: 2048000,
    file_type: 'image/jpeg',
    upload_date: new Date().toISOString(),
    author: '',
    tags: []
  },
  {
    id: 'img3',
    filename: 'forest.png',
    file_size: 3072000,
    file_type: 'image/png',
    upload_date: new Date().toISOString(),
    author: '',
    tags: []
  }
];

// Image upload functions
export const uploadImages = async (files: File[]): Promise<{ success: boolean, message: string, failed?: string[] }> => {
  // If in demo mode, return a mock success response
  if (isDemoMode()) {
    return new Promise(resolve => 
      setTimeout(() => {
        resolve({ success: true, message: 'Demo: Images uploaded successfully' });
      }, 1500)
    );
  }
  
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  const response = await fetch(`${BASE_URL}/images/upload`, {
    method: 'POST',
    headers: {
      ...authHeader()
    },
    body: formData
  });
  
  return handleResponse(response);
};

// Get untagged images
export const getUntaggedImages = async (limit: number = 10): Promise<ImageMetadata[]> => {
  const response = await fetch(`${BASE_URL}/images/untagged?limit=${limit}`, {
    headers: {
      ...authHeader()
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch untagged images');
  }
  
  const data = await response.json();
  return data;
};

// Update image tags
export const updateImageTags = async (
  imageId: string, 
  author: string, 
  tags: string[]
): Promise<{ success: boolean }> => {
  // If in demo mode, return a mock success response
  if (isDemoMode()) {
    return new Promise(resolve => 
      setTimeout(() => {
        resolve({ success: true });
      }, 800)
    );
  }
  
  const response = await fetch(`${BASE_URL}/images/${imageId}/tags`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...authHeader()
    },
    body: JSON.stringify({
      author,
      tags
    })
  });
  
  return handleResponse(response);
};

// Search images
export const searchImages = async (query: string): Promise<ImageMetadata[]> => {
  // If in demo mode, return filtered mock images
  if (isDemoMode()) {
    return new Promise(resolve => 
      setTimeout(() => {
        // Simple mock filtering based on filename
        const filtered = MOCK_IMAGES.filter(img => 
          img.filename.toLowerCase().includes(query.toLowerCase()) ||
          (img.tags && img.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
        );
        resolve(filtered.length > 0 ? filtered : MOCK_IMAGES);
      }, 800)
    );
  }
  
  const response = await fetch(`${BASE_URL}/images/search?q=${encodeURIComponent(query)}`, {
    headers: {
      ...authHeader()
    }
  });
  
  return handleResponse(response);
};

// Get image by ID
export const getImageById = async (imageId: string): Promise<ImageMetadata> => {
  // If in demo mode, return a mock image
  if (isDemoMode()) {
    return new Promise(resolve => 
      setTimeout(() => {
        const mockImage = MOCK_IMAGES.find(img => img.id === imageId) || MOCK_IMAGES[0];
        resolve(mockImage);
      }, 800)
    );
  }
  
  const response = await fetch(`${BASE_URL}/images/${imageId}`, {
    headers: {
      ...authHeader()
    }
  });
  
  return handleResponse(response);
};

// Get image URL
export const getImageUrl = (imageId: string): string => {
  return `${BASE_URL}/images/${imageId}/content`;
};
