import React, { useState, useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import colors from '../constants/colors';

export default function RestaurantCard({ restaurant, onPress }) {
  const [imageError, setImageError] = useState(false);
  
  const handleImageError = useCallback(() => {
    setImageError(true);
  }, []);

  const imageUri = restaurant.imageUrl && !imageError
    ? restaurant.imageUrl
    : 'https://via.placeholder.com/400x200?text=Kein+Bild';

  // Validate restaurant object
  if (!restaurant) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <Image 
        source={{ uri: imageUri }} 
        style={styles.img}
        onError={handleImageError}
      />
      <View style={styles.textWrap}>
        <Text style={styles.name} numberOfLines={2}>
          {restaurant.name || 'Unbekanntes Restaurant'}
        </Text>
        <Text style={styles.details} numberOfLines={1}>
          {restaurant.type || 'Restaurant'} ・ {restaurant.rating ? restaurant.rating.toFixed(1) : '–'}★
          {restaurant.openNow !== undefined && (
            <>
              {' ・ '}
              <Text style={{ color: restaurant.openNow ? colors.success : colors.error }}>
                {restaurant.openNow ? 'Geöffnet' : 'Geschlossen'}
              </Text>
            </>
          )}
        </Text>
        {restaurant.address && (
          <Text style={styles.address} numberOfLines={2}>
            {restaurant.address}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    marginBottom: 16, 
    overflow: 'hidden', 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  img: { 
    width: '100%', 
    height: 180,
    resizeMode: 'cover',
  },
  textWrap: { 
    padding: 12 
  },
  name: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 4,
    color: colors.textPrimary,
  },
  details: { 
    fontSize: 14, 
    color: colors.textSecondary,
    marginBottom: 4,
  },
  address: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
});
});
