// src/utils/api.ts - Full MongoDB Integration (No localStorage for data)

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Type definitions
export interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'customer' | 'admin';
  loyaltyPoints: number;
  loyaltyCard: {
    stamps: number;
    totalFreeDrinks: number;
  };
}

export interface Order {
  _id: string;
  orderId: string;
  customerCode: string;
  cupSize: 'S' | 'M' | 'L';
  shavedIce: {
    flavor: string;
    points: number;
  };
  toppings: Array<{
    name: string;
    points: number;
  }>;
  pricing: {
    basePrice: number;
    total: number;
  };
  status: string;
  createdAt: string;
}

export interface Review {
  _id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpfulVotes: number;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleApiError = async (response: Response) => {
  if (!response.ok) {
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    } catch (e) {
      if (e instanceof Error && e.message.includes('HTTP')) {
        throw e;
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }
  return response;
};

// API class for all backend calls
class BingsuAPI {
  // Auth endpoints
  async register(data: { fullName: string; email: string; password: string; confirmPassword: string }) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    await handleApiError(response);
    const result = await response.json();
    
    if (result.token) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    
    return result;
  }

  async login(email: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    await handleApiError(response);
    const result = await response.json();
    
    if (result.token) {
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    
    return result;
  }

  async logout() {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }

  async getProfile() {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getAuthHeaders()
    });
    
    await handleApiError(response);
    return response.json();
  }

  // User Management endpoints
  async getAllUsers(filters?: { role?: string; isActive?: string; search?: string }) {
    const params = new URLSearchParams(filters as any);
    const response = await fetch(`${API_BASE_URL}/users/admin/all?${params}`, {
      headers: getAuthHeaders()
    });
    
    await handleApiError(response);
    return response.json();
  }

  async updateUser(userId: string, updates: any) {
    const response = await fetch(`${API_BASE_URL}/users/admin/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(updates)
    });
    
    await handleApiError(response);
    return response.json();
  }

  async deleteUser(userId: string) {
    const response = await fetch(`${API_BASE_URL}/users/admin/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    await handleApiError(response);
    return response.json();
  }

  async toggleUserStatus(userId: string) {
    const response = await fetch(`${API_BASE_URL}/users/admin/${userId}/toggle-status`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    await handleApiError(response);
    return response.json();
  }

  // Menu code endpoints
  async generateMenuCode(cupSize: string) {
    const response = await fetch(`${API_BASE_URL}/menu-codes/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ cupSize })
    });
    
    await handleApiError(response);
    return response.json();
  }

  async validateMenuCode(code: string) {
    const response = await fetch(`${API_BASE_URL}/menu-codes/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    });
    
    await handleApiError(response);
    return response.json();
  }

  async getAllMenuCodes(filters?: { status?: string; cupSize?: string }) {
    const params = new URLSearchParams(filters as any);
    const response = await fetch(`${API_BASE_URL}/menu-codes/admin/all?${params}`, {
      headers: getAuthHeaders()
    });
    
    await handleApiError(response);
    return response.json();
  }

  // Order endpoints
  async createOrder(orderData: {
    menuCode: string;
    shavedIce: { flavor: string; points: number };
    toppings: Array<{ name: string; points: number }>;
    specialInstructions?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/orders/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(orderData)
    });
    
    await handleApiError(response);
    return response.json();
  }

  async trackOrder(customerCode: string) {
    const response = await fetch(`${API_BASE_URL}/orders/track/${customerCode}`, {
      headers: getAuthHeaders()
    });
    
    await handleApiError(response);
    return response.json();
  }

  async getMyOrders() {
    const response = await fetch(`${API_BASE_URL}/orders/my-orders`, {
      headers: getAuthHeaders()
    });
    
    await handleApiError(response);
    return response.json();
  }

  async getAllOrders(filters?: { status?: string; date?: string }) {
    const params = new URLSearchParams(filters as any);
    const response = await fetch(`${API_BASE_URL}/orders/admin/all?${params}`, {
      headers: getAuthHeaders()
    });
    
    await handleApiError(response);
    return response.json();
  }

  async updateOrderStatus(orderId: string, status: string) {
    const response = await fetch(`${API_BASE_URL}/orders/admin/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ status })
    });
    
    await handleApiError(response);
    return response.json();
  }

  async getOrderStats() {
    const response = await fetch(`${API_BASE_URL}/orders/admin/stats`, {
      headers: getAuthHeaders()
    });
    
    await handleApiError(response);
    return response.json();
  }

  // Review endpoints
  async createReview(reviewData: {
    rating: number;
    comment: string;
    orderId?: string;
    shavedIceFlavor?: string;
    toppings?: string[];
  }) {
    const response = await fetch(`${API_BASE_URL}/reviews/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify(reviewData)
    });
    
    await handleApiError(response);
    return response.json();
  }

  async getReviews(page = 1, limit = 10) {
    const response = await fetch(`${API_BASE_URL}/reviews?page=${page}&limit=${limit}`);
    
    await handleApiError(response);
    return response.json();
  }

  async voteHelpful(reviewId: string) {
    const response = await fetch(`${API_BASE_URL}/reviews/${reviewId}/helpful`, {
      method: 'POST',
      headers: getAuthHeaders()
    });
    
    await handleApiError(response);
    return response.json();
  }

  async getAllReviews(filters?: { isVisible?: boolean; isVerified?: boolean }) {
    const params = new URLSearchParams(filters as any);
    const response = await fetch(`${API_BASE_URL}/reviews/admin/all?${params}`, {
      headers: getAuthHeaders()
    });
    
    await handleApiError(response);
    return response.json();
  }

  async updateReviewVisibility(reviewId: string, isVisible: boolean) {
    const response = await fetch(`${API_BASE_URL}/reviews/admin/${reviewId}/visibility`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      },
      body: JSON.stringify({ isVisible })
    });
    
    await handleApiError(response);
    return response.json();
  }

  async deleteReview(reviewId: string) {
    const response = await fetch(`${API_BASE_URL}/reviews/admin/${reviewId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    await handleApiError(response);
    return response.json();
  }
}

export const api = new BingsuAPI();

// Utility functions for auth state (localStorage only for session)
export const isAuthenticated = () => {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('token');
};

export const getCurrentUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const isAdmin = () => {
  const user = getCurrentUser();
  return user?.role === 'admin';
};