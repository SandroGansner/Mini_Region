import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Linking, StyleSheet, Alert } from 'react-native';
import axios from 'axios';

export default function RestaurantScreen() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRestaurants = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get('/api/restaurants', {
        timeout: 10000, // 10 second timeout
      });
      
      if (res.data && Array.isArray(res.data)) {
        setRestaurants(res.data);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (error) {
      console.error('API Fehler:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred';
      setError(`Fehler beim Laden der Restaurants: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleRetry = useCallback(() => {
    fetchRestaurants();
  }, [fetchRestaurants]);

  const handleLinkPress = useCallback((url) => {
    if (!url) {
      Alert.alert('Fehler', 'Keine Website verfügbar');
      return;
    }
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Alert.alert('Fehler', 'Website kann nicht geöffnet werden');
      }
    }).catch(err => {
      console.error('Linking error:', err);
      Alert.alert('Fehler', 'Website kann nicht geöffnet werden');
    });
  }, []);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Restaurants werden geladen...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Erneut versuchen</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderRestaurant = useCallback(({ item }) => {
    if (!item) return null;
    
    return (
      <TouchableOpacity 
        style={styles.item}
        onPress={() => handleLinkPress(`https://www.google.com/search?q=${encodeURIComponent(item.name)}`)}
      >
        <Text style={styles.title}>{item.name || 'Unbekanntes Restaurant'}</Text>
        <Text style={styles.subtitle}>{item.address || 'Adresse nicht verfügbar'}</Text>
        {item.rating && (
          <Text style={styles.rating}>⭐ {item.rating.toFixed(1)}</Text>
        )}
      </TouchableOpacity>
    );
  }, [handleLinkPress]);

  if (!restaurants.length) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Keine Restaurants gefunden</Text>
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryButtonText}>Erneut laden</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={restaurants}
      keyExtractor={(item) => item.placeId || item.name || Math.random().toString()}
      renderItem={renderRestaurant}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContainer}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 10,
  },
  item: {
    padding: 15,
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 4,
  },
  rating: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  errorText: {
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
