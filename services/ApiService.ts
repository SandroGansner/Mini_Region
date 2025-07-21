// API service for Mini Region app

import axios, { AxiosResponse } from 'axios';
import { Restaurant, Event, FamilyActivity, SocialMeetup, ApiResponse } from '../types';

const API_BASE_URL = process.env.REACT_NATIVE_BACKEND_URL || 'http://localhost:5000';
const API_TIMEOUT = 10000; // 10 seconds

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export class ApiService {
  // Restaurant endpoints
  static async getRestaurants(query?: string, lat?: number, lng?: number): Promise<Restaurant[]> {
    try {
      const params: any = {};
      if (query) params.query = query;
      if (lat !== undefined && lng !== undefined) {
        params.lat = lat;
        params.lng = lng;
      }

      const response = await apiClient.get('/api/restaurants', { params });
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
      throw new Error('Failed to load restaurants');
    }
  }

  static async refreshRestaurants(): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get('/api/refresh-restaurants');
      return response.data;
    } catch (error) {
      console.error('Failed to refresh restaurants:', error);
      throw new Error('Failed to refresh restaurants');
    }
  }

  // Event endpoints
  static async getEvents(startDate?: string): Promise<Event[]> {
    try {
      const params = startDate ? { startDate } : {};
      const response = await apiClient.get('/api/events', { params });
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch events:', error);
      throw new Error('Failed to load events');
    }
  }

  // Family activities endpoints
  static async getFamilyActivities(): Promise<FamilyActivity[]> {
    try {
      const response = await apiClient.get('/api/family-activities');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch family activities:', error);
      throw new Error('Failed to load family activities');
    }
  }

  // Social meetups endpoints
  static async getSocialMeetups(): Promise<SocialMeetup[]> {
    try {
      const response = await apiClient.get('/api/social-meetups');
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch social meetups:', error);
      throw new Error('Failed to load social meetups');
    }
  }

  static async createSocialMeetup(meetup: Omit<SocialMeetup, 'id' | 'createdAt'>): Promise<SocialMeetup> {
    try {
      const response = await apiClient.post('/api/social-meetups', meetup);
      return response.data;
    } catch (error) {
      console.error('Failed to create social meetup:', error);
      throw new Error('Failed to create social meetup');
    }
  }

  // Google Places autocomplete
  static async getPlaceAutocomplete(input: string): Promise<any[]> {
    try {
      if (!input || input.trim().length < 2) {
        return [];
      }

      const response = await apiClient.get('/api/place-autocomplete', {
        params: { input: input.trim() },
      });
      return response.data || [];
    } catch (error) {
      console.error('Failed to fetch place autocomplete:', error);
      throw new Error('Failed to load place suggestions');
    }
  }

  // Health check
  static async healthCheck(): Promise<any> {
    try {
      const response = await apiClient.get('/');
      return response.data;
    } catch (error) {
      console.error('Health check failed:', error);
      throw new Error('Server is not available');
    }
  }
}

export default ApiService;