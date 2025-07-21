import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, FlatList, Image, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../constants/colors';

export default function FavoritesScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const loadFavorites = async () => {
      const favIds = JSON.parse(await AsyncStorage.getItem('favs') || '[]');
      const storedRestaurants = JSON.parse(await AsyncStorage.getItem('restaurants') || '[]');
      const favRestaurants = storedRestaurants.filter((restaurant) => favIds.includes(restaurant.id));
      setFavorites(favRestaurants);
    };
    loadFavorites();

    const unsubscribe = navigation.addListener('focus', loadFavorites);
    return unsubscribe;
  }, [navigation]);

  const favoritesMemo = useMemo(() => favorites, [favorites]);

  const renderItem = useCallback(({ item }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}
      onPress={() => navigation.navigate('RestaurantDetail', { restaurant: item })}
      accessibilityLabel={`Details zu ${item?.name || 'unbekannt'} anzeigen`}
    >
      <Image
        source={{ uri: item.imageUrl }}
        style={styles.image}
        onError={(e) => console.warn(`Failed to load image for ${item.name}: ${e.nativeEvent.error}`)}
        defaultSource={{ uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4' }}
      />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.address}>{item.address}</Text>
        <Text style={styles.meta}>
          {item.type} · {item.rating.toFixed(1)}★ ({item.user_ratings_total} Bewertungen) · {item.openNow ? 'Geöffnet' : 'Geschlossen'}
        </Text>
      </View>
    </Pressable>
  ), [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deine Favoriten</Text>
      {favoritesMemo.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResults}>Keine Favoriten gespeichert.</Text>
        </View>
      ) : (
        <FlatList
          data={favoritesMemo}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noResults: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 20,
  },
  list: { paddingBottom: 100 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  image: { width: '100%', height: 250, resizeMode: 'cover' },
  info: { padding: 16 },
  name: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
  },
  address: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
    color: colors.textSecondary,
    marginVertical: 8,
  },
  meta: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
    color: colors.textSecondary,
  },
});