// Utility functions for the Mini Region app

import { Alert, Linking } from 'react-native';

/**
 * Safely opens a URL in the browser
 */
export const openURL = async (url: string): Promise<boolean> => {
  if (!url || typeof url !== 'string') {
    Alert.alert('Fehler', 'Ungültige URL');
    return false;
  }

  // Add protocol if missing
  const formattedUrl = url.startsWith('http') ? url : `https://${url}`;

  try {
    const supported = await Linking.canOpenURL(formattedUrl);
    if (supported) {
      await Linking.openURL(formattedUrl);
      return true;
    } else {
      Alert.alert('Fehler', 'URL kann nicht geöffnet werden');
      return false;
    }
  } catch (error) {
    console.error('Error opening URL:', error);
    Alert.alert('Fehler', 'URL kann nicht geöffnet werden');
    return false;
  }
};

/**
 * Validates email format
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone number format (basic)
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
};

/**
 * Formats a date to local string
 */
export const formatDate = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return 'Ungültiges Datum';
    }
    return dateObj.toLocaleDateString('de-CH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Ungültiges Datum';
  }
};

/**
 * Formats a date to local time string
 */
export const formatTime = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(dateObj.getTime())) {
      return 'Ungültige Zeit';
    }
    return dateObj.toLocaleTimeString('de-CH', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Ungültige Zeit';
  }
};

/**
 * Debounces a function call
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

/**
 * Truncates text to specified length
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

/**
 * Calculates distance between two coordinates (in km)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Validates Swiss postal code
 */
export const isValidSwissPostalCode = (postalCode: string): boolean => {
  const swissPostalRegex = /^[1-9]\d{3}$/;
  return swissPostalRegex.test(postalCode);
};

/**
 * Clean and sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  return input.trim().replace(/[<>\"']/g, '');
};

/**
 * Format rating display
 */
export const formatRating = (rating: number | undefined): string => {
  if (!rating || rating < 0) return '–';
  return rating.toFixed(1);
};