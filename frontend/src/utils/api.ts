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
  is_admin: boolean;
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

export interface ApiClient {
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ message: string }>;
}

interface SearchFilters {
  tags?: string[];
  author?: string;
}

interface TagResponse {
  name: string;
}

interface TagData {
  name: string;
  date_added: string;
}

interface AdminStatusResponse {
  message: string;
  success: boolean;
}

interface PreviewOptions {
  maxSize?: number;
  size?: 'preview' | 'search';
}

interface RefreshResponse {
  access_token: string;
}

interface LogoutResponse {
  message: string;
}

// =============================================================================
// API Client Setup
// =============================================================================

export const createAPIClient = () => {
  let csrfToken: string | null = null;

  const ensureCsrfToken = async () => {
    if (!csrfToken) {
      try {
        const response = await fetch(`${BASE_URL}/auth/csrf-token`, {
          credentials: 'include'
        });
        const data = await response.json();
        csrfToken = data.csrf_token;
      } catch (error) {
        console.error('Failed to fetch CSRF token:', error);
      }
    }
    return csrfToken;
  };

  const baseRequest = async (url: string, options: RequestInit = {}, retryCount = 0) => {
    try {
      // Add CSRF token for mutating requests
      if (options.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(options.method)) {
        const token = await ensureCsrfToken();
        options.headers = {
          ...options.headers,
          'X-CSRF-Token': token || ''
        };
      }

      // Only set Content-Type if not FormData
      if (!(options.body instanceof FormData)) {
        options.headers = {
          'Content-Type': 'application/json',
          ...options.headers,
        };
      }
  
      const response = await fetchWithRefresh(url, {
        ...options,
        credentials: 'include',
      });
  
      // Handle CSRF failures with retry
      if (response.status === 403 && retryCount < 1) {
        csrfToken = null; // Clear invalid token
        return baseRequest(url, options, retryCount + 1);
      }
  
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.detail || `HTTP error! status: ${response.status}`);
      }
  
      return response;
    } catch (error) {
      throw error;
    }
  };

  return {
    get: async <T>(url: string) => {
      const response = await baseRequest(url);
      return response.json() as Promise<T>;
    },

    post: async <T>(url: string, data?: any) => {
      const response = await baseRequest(url, {
        method: 'POST',
        body: data instanceof FormData ? data : JSON.stringify(data),
        headers: data instanceof FormData ? {} : { 'Content-Type': 'application/json' }
      });
      return response.json() as Promise<T>;
    },

    put: async <T>(url: string, data: any) => {
      const response = await baseRequest(url, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return response.json() as Promise<T>;
    },

    delete: async <T>(url: string) => {
      const response = await baseRequest(url, {
        method: 'DELETE'
      });
      return response.status === 204 ? undefined : response.json() as Promise<T>;
    },

    forgotPassword: async (email: string) => {
      const response = await fetch(`${BASE_URL}/auth/forgot-password`, {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
          throw new Error('Failed to send password reset email');
      }
      
      return response.json();
    },
    
    resetPassword: async (token: string, newPassword: string) => {
      const response = await fetch(`${BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          token,
          new_password: newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to reset password');
      }

      return response.json();
    },

    clearCsrfToken: () => {
      csrfToken = null;
    }
  };
};

// Create a singleton instance
export const apiClient = createAPIClient();

// =============================================================================
// Authentication
// =============================================================================

export const login = async (username: string, password: string): Promise<void> => {
  const formData = new URLSearchParams();
  formData.append('username', username);
  formData.append('password', password);

  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    credentials: 'include',
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || '60';
      throw new Error(`429: Too many attempts. Try again in ${retryAfter} seconds.`);
    }
    else {
      throw new Error(error.detail || 'Invalid credentials');
    }
  }

  const data = await response.json();
  
  // Force a refresh of the CSRF token after login
  await apiClient.get(`${BASE_URL}/auth/csrf-token`);
};

export const logout = async (): Promise<void> => {
  try {
    await fetch(`${BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
    // Clear CSRF token on logout
    apiClient.clearCsrfToken();
  } catch (error) {
    console.error('Logout failed:', error);
  }
  window.location.href = '/login';
};

async function refreshAccessToken() {
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }
    
    return true;
  } catch (error) {
    return false;
  }
}

// Add axios interceptor or fetch wrapper
export async function fetchWithRefresh(url: string, options: RequestInit = {}) {
  let response = await fetch(url, { ...options, credentials: 'include' });
  
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry original request
      response = await fetch(url, { ...options, credentials: 'include' });
    } else {
      // Redirect to login if refresh fails
      window.location.href = '/login';
    }
  }
  
  return response;
}

// Check if user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  return apiClient.get(`${BASE_URL}/auth/me`)
};

// =============================================================================
// User Management
// =============================================================================

// Get current user profile
export const getCurrentUser = async (): Promise<User> => {
    return apiClient.get(`${BASE_URL}/auth/me`);
};

export const getAllUsers = async (): Promise<User[]> => {
  return apiClient.get(`${BASE_URL}/users/all`);
};

export const sendResetPasswordEmail = async (email: string) => {
  return apiClient.post(`${BASE_URL}/auth/forgot-password`, { email });
}

// Create user profile
export const createUser = async (userData: { 
  email: string; 
  username: string; 
  password: string; 
}): Promise<User> => {
  return apiClient.post<User>(`${BASE_URL}/users`, userData);
};

// Update user profile
export const updateUserProfile = async (userData: {
  email?: string;
  username?: string;
  password?: string;
  currentPassword?: string;
}): Promise<User> => {
  return apiClient.put<User>(`${BASE_URL}/users/me`, userData);
};

export const setUserAdminStatus = async (email: string, isAdmin: boolean): Promise<AdminStatusResponse> => {
  const method = isAdmin ? 'post' : 'delete';
  return apiClient[method]<AdminStatusResponse>(`${BASE_URL}/users/${email}/admin`);
};

export const deleteUser = async (email: string): Promise<void> => {
  return apiClient.delete(`${BASE_URL}/users/${email}`);
};

// =============================================================================
// Image Management
// =============================================================================

export const getImageById = async (imageId: number): Promise<ImageMetadata> => {
  return apiClient.get(`${BASE_URL}/images/search/${imageId}`);
};

// Image upload function
export const uploadImages = async (files: File[]): Promise<{ 
  success: boolean, 
  message: string, 
  failed?: string[] 
}> => {
  const formData = new FormData();
  files.forEach(file => {
    formData.append('files', file);
  });
  
  return apiClient.post<{
    success: boolean,
    message: string,
    failed?: string[]
  }>(`${BASE_URL}/images/upload/batch`, formData);
};

export const updateImageMetadata = async (
  imageId: number,
  updateData: UpdateImageTagsData
): Promise<ImageMetadata> => {
  return apiClient.put<ImageMetadata>(
    `${BASE_URL}/images/metadata/${imageId}`,
    updateData
  );
};

export const deleteImage = async (imageId: string | number): Promise<void> => {
  return apiClient.delete(`${BASE_URL}/images/images/${imageId}`);
};

// =============================================================================
// Image URLs & Previews
// =============================================================================

export const imageUrls = {
  // Get full image content
  getContent: (imageId: string | number): string => 
    `${BASE_URL}/images/${imageId}/content`,

  // Get untagged image
  getUntagged: (image: ImageMetadata): string => 
    `${BASE_URL}${image.untagged_full_path}`,

  // Get preview for untagged image
  getUntaggedPreview: (imageId: string | number, maxSize: number = 800): string => 
    `${BASE_URL}/preview/untagged/preview/${imageId}?max_size=${maxSize}`,

  // Get preview based on size type
  getPreview: (imageId: string | number, size: 'preview' | 'search'): string => 
    `${BASE_URL}/images/preview/${size}/${imageId}`,

  // Get actual full-resolution image
  getActual: (imageId: string | number): string => 
    `${BASE_URL}/images/content/${imageId}`
};

// Create a method to fetch preview metadata if needed
export const fetchPreviewMetadata = async (imageId: string | number): Promise<ImageMetadata> => {
  return apiClient.get<ImageMetadata>(`${BASE_URL}/images/preview/metadata/${imageId}`);
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
  
  return apiClient.get(`${BASE_URL}/images/search?${params.toString()}`)
};

// Get untagged images
export const getUntaggedImages = async (limit: number = 10): Promise<ImageMetadata[]> => {
  return apiClient.get(`${BASE_URL}/images/untagged?limit=${limit}`);
};

export const getNextUntaggedImage = async (): Promise<ImageMetadata[]> => {
  return apiClient.get(`${BASE_URL}/images/untagged/next`);
};

// Update image tags
export const updateImageTags = async (
  imageId: number,
  updateData: UpdateImageTagsData
): Promise<ImageMetadata> => {
  return apiClient.put<ImageMetadata>(
    `${BASE_URL}/images/tags/${imageId}`,
    updateData
  );
};

export const searchTags = async (query: string): Promise<string[]> => {
  const tags = await apiClient.get<TagResponse[]>(`${BASE_URL}/tags/search?query=${encodeURIComponent(query)}`);
  return tags.map(tag => tag.name);
};

export const getAllTags = async (): Promise<TagData[]> => {
  return apiClient.get(`${BASE_URL}/tags`);
};

export const createTag = async (name: string): Promise<TagData> => {
  return apiClient.post(`${BASE_URL}/tags`, { name });
};

export const deleteTag = async (name: string): Promise<void> => {
  return apiClient.delete(`${BASE_URL}/tags/${encodeURIComponent(name)}`);
};

// =============================================================================
// Author Management
// =============================================================================

export const getAuthorsData = async (): Promise<Author[]> => {
  return apiClient.get(`${BASE_URL}/authors/`);
};

export const getAuthorById = async (author_id: number): Promise<Author> => {
  return apiClient.get(`${BASE_URL}/authors/${author_id}`);
};

export const searchAuthors = async (query: string): Promise<Author[]> => {
  return apiClient.get(`${BASE_URL}/authors/search?query=${encodeURIComponent(query)}`);
};

export const updateAuthorData = async (
  author_id: number,
  updateData: Author
): Promise<Author> => {
  return apiClient.put<Author>(
    `${BASE_URL}/authors/${author_id}`,
    updateData
  );
};

export const createAuthor = async (author: Author): Promise<Author> => {
  return apiClient.post<Author>(`${BASE_URL}/authors`, author);
}

export const deleteAuthorData = async (author_id: number): Promise<void> => {
  return apiClient.delete(`${BASE_URL}/authors/${author_id}`);
};