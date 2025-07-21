// Common types used throughout the application

export interface Restaurant {
  id?: string;
  placeId?: string;
  name: string;
  address?: string;
  rating?: number;
  type?: string;
  openNow?: boolean;
  imageUrl?: string;
  website?: string;
  formatted_phone_number?: string;
  user_ratings_total?: number;
  photos?: Array<{ photo_reference: string; url?: string }>;
  reviews?: Array<Review>;
  location?: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
  geometry?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

export interface Review {
  author_name: string;
  rating: number;
  text: string;
  time: number;
}

export interface Event {
  id: string;
  title: string;
  date: Date;
  location: string;
  description: string;
  image?: string;
  updatedAt?: Date;
}

export interface FamilyActivity {
  id?: string;
  title: string;
  location: string;
  description: string;
  image?: string;
}

export interface SocialMeetup {
  id?: string;
  title: string;
  description: string;
  date: Date;
  location: string;
  createdAt?: Date;
}

export interface MapMarker {
  id: string | number;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title: string;
  description: string;
}

export interface Location {
  latitude: number;
  longitude: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status?: string;
}

export interface NavigationProps {
  navigation: {
    navigate: (screen: string, params?: any) => void;
    goBack: () => void;
  };
}