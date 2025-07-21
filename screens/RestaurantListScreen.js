import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, FlatList, Image, Pressable, ActivityIndicator, Alert, StyleSheet, TextInput, Animated, TouchableOpacity, Switch } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import retry from 'async-retry';
import debounce from 'lodash.debounce';
import colors from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';
import Geolocation from '@react-native-community/geolocation';

// Hinweis: API-Schlüssel sollte in Umgebungsvariablen gespeichert werden, z. B. mit react-native-dotenv
// Removed hardcoded API key for security
const BACKEND_URL = process.env.REACT_NATIVE_BACKEND_URL || 'http://localhost:5000';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 Stunden in Millisekunden

const fallbackRestaurants = [
  { id: '1', name: 'La Calma Pizzeria', address: 'Bahnhofstrasse 12, Chur', rating: 4.7, openNow: true, imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a584', type: 'Pizza', website: 'https://example.com/pizza', user_ratings_total: 120, lat: 46.8499, lng: 9.5320 },
  { id: '2', name: 'Bergblick Stübli', address: 'Dorfstrasse 45, Lenzerheide', rating: 4.3, openNow: false, imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9', type: 'Regional', website: 'https://example.com/regional', user_ratings_total: 85, lat: 46.7272, lng: 9.5579 },
  { id: '3', name: 'Sushi Heaven', address: 'Poststrasse 8, Davos', rating: 4.8, openNow: true, imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c', type: 'Sushi', website: 'https://example.com/sushi', user_ratings_total: 150, lat: 46.8043, lng: 9.8370 },
  { id: '4', name: 'Vegan Delight', address: 'Grabenstrasse 5, Chur', rating: 4.5, openNow: true, imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe', type: 'Vegan', website: 'https://example.com/vegan', user_ratings_total: 90, lat: 46.8499, lng: 9.5320 },
];

export default function RestaurantListScreen({ navigation }) {
  const [restaurants, setRestaurants] = useState([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorDetails, setErrorDetails] = useState(null);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [useNearby, setUseNearby] = useState(true);
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [sortOption, setSortOption] = useState('rating');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sortAnim = useRef(new Animated.Value(0)).current;

  let cachedRestaurants = useMemo(() => null, []);

  const isFetching = useRef(false);
  const lastRequestTime = useRef(0);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedFavs = await AsyncStorage.getItem('favs');
        if (storedFavs) setFavorites(JSON.parse(storedFavs));

        const storedLocation = await AsyncStorage.getItem('user_location');
        if (storedLocation) setLocation(JSON.parse(storedLocation));

        // Prüfe, ob gecachte Restaurants vorhanden sind und nicht veraltet
        const cachedData = await AsyncStorage.getItem('cached_restaurants_data');
        if (cachedData) {
          const { data, timestamp } = JSON.parse(cachedData);
          const now = Date.now();
          if (now - timestamp < CACHE_DURATION) {
            setRestaurants(data);
            cachedRestaurants = data;
            return;
          }
        }
      } catch (err) {
        console.error('Error loading stored data:', err);
      }

      const loadLocationAndSearch = async () => {
        Geolocation.getCurrentPosition(
          async position => {
            setLocation(position);
            await AsyncStorage.setItem('user_location', JSON.stringify(position));
            fetchRestaurants(null, true);
          },
          error => {
            Alert.alert('Hinweis', 'Standort konnte nicht ermittelt werden. Suche nach Restaurants in der Schweiz.');
            setUseNearby(false);
            fetchRestaurants(null, false);
            console.error(error);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      };
      loadLocationAndSearch();
    };
    loadStoredData();
  }, []);

  const fetchRestaurants = useCallback(async (query, useLocation = false) => {
    const now = Date.now();
    if (now - lastRequestTime.current < 1000) {
      console.log('Rate limit exceeded, skipping API request...');
      return;
    }
    lastRequestTime.current = now;

    if (isFetching.current) {
      console.log('API request already in progress, skipping...');
      return;
    }

    isFetching.current = true;
    setLoading(true);

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    try {
      let queryText = 'restaurants';
      if (query) queryText += ` in ${query}`;
      else if (useLocation && location) queryText += ` near ${location.coords.latitude},${location.coords.longitude}`;
      else queryText += ' in Switzerland';

      console.log('Search Query:', queryText);

      const response = await retry(
        async () => {
          console.log('Attempting API request to:', `${BACKEND_URL}/api/restaurants`);
          const res = await axios.get(`${BACKEND_URL}/api/restaurants`, {
            params: {
              query: queryText,
              lat: useLocation && location ? location.coords.latitude : undefined,
              lng: useLocation && location ? location.coords.longitude : undefined,
              radius: useLocation ? 50000 : undefined,
            },
            timeout: 20000,
          });
          return res;
        },
        {
          retries: 3,
          minTimeout: 1000,
          factor: 2,
          onRetry: (err) => console.log('Retrying API request due to error:', err.message),
        }
      );

      console.log('Backend API Response:', response.data);

      if (!response.data || response.data.length === 0) {
        Alert.alert('Hinweis', 'Keine Restaurants gefunden. Zeige Beispieldaten.');
        setRestaurants(fallbackRestaurants);
        return;
      }

      const detailedRestaurants = response.data.map((place) => ({
        id: place.place_id,
        name: place.name,
        address: place.formatted_address || place.address,
        rating: place.rating || 0,
        user_ratings_total: place.user_ratings_total || 0,
        openNow: place.openingHours?.open_now || false,
        imageUrl: place.photos?.[0]?.url || place.photos?.[0]?.photo_reference
          ? `https://maps.googleapis.com/maps/api/place/photo?maxheight=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_API_KEY}`
          : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
        type: place.types?.[0]?.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Restaurant',
        website: place.website || null,
        phone: place.formatted_phone_number || null,
        openingHours: place.openingHours?.weekday_text || [],
        reviews: place.reviews || [],
        lat: place.geometry?.location?.lat || 0,
        lng: place.geometry?.location?.lng || 0,
      }));

      console.log('Detailed Restaurants:', detailedRestaurants);

      await AsyncStorage.setItem('cached_restaurants_data', JSON.stringify({
        data: detailedRestaurants,
        timestamp: Date.now(),
      }));

      cachedRestaurants = detailedRestaurants;
      setRestaurants(detailedRestaurants);
      setNextPageToken(response.data.next_page_token);
    } catch (err) {
      console.error('API Error:', err.message);
      let errorMessage = 'Restaurants konnten nicht geladen werden. Zeige Beispieldaten.';
      if (err.response?.status === 403) errorMessage = 'Zugriff verweigert (403). Überprüfe den API-Schlüssel.';
      else if (err.response?.status === 404) errorMessage = 'Backend-Server nicht erreichbar (404).';
      else if (err.message.includes('Network Error')) errorMessage = 'Netzwerkfehler: Backend nicht erreichbar.';
      else if (err.code === 'ECONNABORTED') errorMessage = 'Anfragezeitüberschreitung.';
      setErrorDetails(errorMessage);
      setRestaurants(fallbackRestaurants);
    } finally {
      isFetching.current = false;
      setLoading(false);
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [location, fadeAnim]);

  const debouncedFetchRestaurants = useCallback(debounce(fetchRestaurants, 1000), [fetchRestaurants]);

  const handleSearch = () => {
    debouncedFetchRestaurants(searchQuery, useNearby);
  };

  const toggleFavorite = async (restaurantId) => {
    try {
      const updatedFavorites = favorites.includes(restaurantId)
        ? favorites.filter((id) => id !== restaurantId)
        : [...favorites, restaurantId];
      setFavorites(updatedFavorites);
      await AsyncStorage.setItem('favs', JSON.stringify(updatedFavorites));
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const toggleSortMenu = () => {
    setShowSortOptions(!showSortOptions);
    Animated.timing(sortAnim, {
      toValue: showSortOptions ? 0 : 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const renderItem = useCallback(({ item }) => {
    const userLat = location?.coords?.latitude;
    const userLng = location?.coords?.longitude;
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };
    const distance = userLat && userLng && item.lat && item.lng
      ? calculateDistance(userLat, userLng, item.lat, item.lng).toFixed(1)
      : 'N/A';
    const isFavorite = favorites.includes(item.id);

    return (
      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && { transform: [{ scale: 0.98 }], opacity: 0.9 },
        ]}
        onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}
        accessibilityLabel={`Details zu ${item.name} anzeigen`}
      >
        <Image
          source={{ uri: item.imageUrl }}
          style={styles.cardImage}
          onError={(e) => console.warn(`Failed to load image for ${item.name}: ${e.nativeEvent.error}`)}
          defaultSource={{ uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4' }}
        />
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardName}>{item.name}</Text>
            <TouchableOpacity onPress={() => toggleFavorite(item.id)}>
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={24}
                color={isFavorite ? colors.accent : colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <Text style={styles.cardAddress}>{item.address}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardMetaText}>
              {item.type} · {item.rating.toFixed(1)}★ ({item.user_ratings_total})
            </Text>
            <Text style={[styles.cardStatus, { color: item.openNow ? colors.success : colors.error }]}>
              {item.openNow ? 'Geöffnet' : 'Geschlossen'}
            </Text>
          </View>
          {userLat && userLng && (
            <Text style={styles.cardDistance}>Entfernung: {distance} km</Text>
          )}
        </View>
      </Pressable>
    );
  }, [location, favorites, navigation]);

  const filteredRestaurantsMemo = useMemo(() => {
    let filtered = [...restaurants];

    const userLat = location?.coords?.latitude;
    const userLng = location?.coords?.longitude;
    const calculateDistance = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = (lat2 - lat1) * (Math.PI / 180);
      const dLon = (lon2 - lon1) * (Math.PI / 180);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    if (searchQuery.trim() !== '') {
      const lowerCaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (restaurant) =>
          restaurant.name.toLowerCase().includes(lowerCaseQuery) ||
          restaurant.address.toLowerCase().includes(lowerCaseQuery) ||
          restaurant.type.toLowerCase().includes(lowerCaseQuery)
      );
    }

    if (sortOption === 'rating') {
      filtered.sort((a, b) => b.rating - a.rating);
    } else if (sortOption === 'distance' && userLat && userLng) {
      filtered.sort((a, b) => {
        const distanceA = calculateDistance(userLat, userLng, a.lat, a.lng);
        const distanceB = calculateDistance(userLat, userLng, b.lat, b.lng);
        return distanceA - distanceB;
      });
    } else if (sortOption === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    }

    console.log('Filtered Restaurants:', filtered);
    return filtered;
  }, [restaurants, searchQuery, sortOption, location]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Entdecke Restaurants</Text>
        <TouchableOpacity onPress={toggleSortMenu} style={styles.sortIcon}>
          <Ionicons
            name={showSortOptions ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colors.accent}
          />
        </TouchableOpacity>
      </View>

      {/* Sortiermenü */}
      <Animated.View
        style={[
          styles.sortContainer,
          {
            transform: [
              {
                scaleY: sortAnim,
              },
            ],
            opacity: sortAnim,
          },
        ]}
      >
        <View style={styles.sortOptions}>
          <TouchableOpacity
            style={[styles.sortOption, sortOption === 'rating' && styles.sortOptionSelected]}
            onPress={() => setSortOption('rating')}
          >
            <Text style={[styles.sortOptionText, sortOption === 'rating' && styles.sortOptionTextSelected]}>Bewertung</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortOption === 'distance' && styles.sortOptionSelected]}
            onPress={() => setSortOption('distance')}
          >
            <Text style={[styles.sortOptionText, sortOption === 'distance' && styles.sortOptionTextSelected]}>Entfernung</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sortOption, sortOption === 'name' && styles.sortOptionSelected]}
            onPress={() => setSortOption('name')}
          >
            <Text style={[styles.sortOptionText, sortOption === 'name' && styles.sortOptionTextSelected]}>Name</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Suchleiste */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Suche in der Schweiz (z.B. Zürich)"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          editable={!useNearby}
        />
        <Pressable
          style={[styles.searchButton, loading && styles.searchButtonDisabled]}
          onPress={handleSearch}
          disabled={loading}
        >
          <Text style={styles.searchButtonText}>Suchen</Text>
        </Pressable>
      </View>

      {/* Standorterkennung Toggle */}
      <View style={styles.switchContainer}>
        <Text style={styles.switchLabel}>Restaurants in der Nähe suchen</Text>
        <Switch
          value={useNearby}
          onValueChange={(val) => {
            setUseNearby(val);
            if (val) setSearchQuery('');
            if (val) debouncedFetchRestaurants(null, true);
          }}
          trackColor={{ false: colors.textSecondary, true: colors.accent }}
          thumbColor={colors.white}
        />
      </View>

      {/* Ladeanimation */}
      {loading && (
        <Animated.View style={[styles.loadingOverlay, { opacity: fadeAnim }]}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.loadingText}>Restaurants werden geladen...</Text>
        </Animated.View>
      )}

      {/* Restaurants Liste oder Fehlerzustand */}
      {restaurants.length === 0 && !loading ? (
        <View style={styles.noResultsContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.noResults}>Bitte suche nach Restaurants.</Text>
        </View>
      ) : filteredRestaurantsMemo.length === 0 && !loading ? (
        <View style={styles.noResultsContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={styles.noResults}>
            {errorDetails ? 'Keine Restaurants gefunden. Versuche einen anderen Ort oder deaktiviere "Restaurants in der Nähe".' : 'Keine Restaurants verfügbar. Offline-Modus aktiv.'}
          </Text>
          {errorDetails && (
            <Text style={styles.errorDetails}>{errorDetails}</Text>
          )}
          <Pressable
            style={styles.retryButton}
            onPress={handleSearch}
          >
            <Text style={styles.retryButtonText}>Erneut laden</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredRestaurantsMemo}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          initialNumToRender={10}
          windowSize={5}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 16,
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  sortIcon: {
    padding: 8,
  },
  sortContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sortOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 12,
  },
  sortOption: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  sortOptionSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  sortOptionText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: colors.textPrimary,
  },
  sortOptionTextSelected: {
    color: colors.white,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: colors.textPrimary,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButton: {
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: 12,
    marginLeft: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchButtonDisabled: {
    backgroundColor: colors.textSecondary,
    opacity: 0.6,
  },
  searchButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: colors.white,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: colors.textPrimary,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: colors.textPrimary,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResults: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  errorDetails: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: colors.error,
    textAlign: 'center',
    marginTop: 10,
  },
  retryButton: {
    backgroundColor: colors.accent,
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: colors.white,
  },
  list: {
    paddingBottom: 100,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  cardContent: {
    flex: 1,
    padding: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
  },
  cardAddress: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardMetaText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: colors.textSecondary,
  },
  cardStatus: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
  },
  cardDistance: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: colors.accent,
  },
});