import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Image, Pressable, StyleSheet, Linking, ScrollView, Share, Alert, FlatList, TextInput, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Picker } from '@react-native-picker/picker';
import colors from '../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const BACKEND_URL = 'https://d1e1-84-226-211-68.ngrok-free.app';

export default function RestaurantDetailScreen({ route, navigation }) {
  const { restaurant } = route.params;
  const [isFav, setIsFav] = useState(false);
  const [rating, setRating] = useState("0");
  const [comment, setComment] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkFavorite = async () => {
      const favs = JSON.parse(await AsyncStorage.getItem('favs') || '[]');
      setIsFav(favs.includes(restaurant.id));
    };
    checkFavorite();

    // Animation für das Erscheinen der Inhalte
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, [restaurant.id, fadeAnim]);

  const toggleFav = useCallback(async () => {
    const favs = JSON.parse(await AsyncStorage.getItem('favs') || '[]');
    const updated = isFav ? favs.filter((id) => id !== restaurant.id) : [...favs, restaurant.id];
    await AsyncStorage.setItem('favs', JSON.stringify(updated));
    setIsFav(!isFav);
  }, [isFav, restaurant.id]);

  const shareRestaurant = useCallback(async () => {
    try {
      await Share.share({
        message: `Entdecke ${restaurant.name}! 📍 ${restaurant.address} - ${restaurant.website || 'Keine Website verfügbar'}`,
      });
    } catch (error) {
      console.error('Share Error:', error);
      Alert.alert('Fehler', 'Restaurant konnte nicht geteilt werden.');
    }
  }, [restaurant]);

  const visitWebsite = useCallback(() => {
    if (restaurant.website) {
      Linking.openURL(restaurant.website).catch(() => {
        Alert.alert('Fehler', 'Die Website konnte nicht geöffnet werden.');
      });
    } else {
      Alert.alert('Hinweis', 'Keine Website verfügbar.');
    }
  }, [restaurant.website]);

  const openGoogleMapsNavigation = useCallback(() => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(restaurant.address)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Fehler', 'Google Maps konnte nicht geöffnet werden.');
    });
  }, [restaurant.address]);

  const callRestaurant = useCallback(() => {
    if (restaurant.phone) {
      Linking.openURL(`tel:${restaurant.phone}`).catch(() => {
        Alert.alert('Fehler', 'Telefonnummer konnte nicht angerufen werden.');
      });
    } else {
      Alert.alert('Hinweis', 'Keine Telefonnummer verfügbar.');
    }
  }, [restaurant.phone]);

  const submitReview = useCallback(async () => {
    if (rating === "0" || !comment.trim()) {
      Alert.alert('Hinweis', 'Bitte gib eine Bewertung und einen Kommentar ein.');
      return;
    }
    try {
      await axios.post(`${BACKEND_URL}/api/reviews`, {
        restaurantId: restaurant.id,
        rating: parseFloat(rating),
        comment,
      });
      Alert.alert('Erfolg', 'Bewertung gespeichert!');
      setRating("0");
      setComment('');
    } catch (err) {
      console.error('Review Error:', err.message);
      Alert.alert('Fehler', 'Bewertung konnte nicht gespeichert werden.');
    }
  }, [rating, comment, restaurant.id]);

  const renderReview = useCallback(({ item }) => (
    <View style={styles.reviewContainer}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewAuthor}>{item.author_name}</Text>
        <View style={styles.reviewStars}>
          {[...Array(Math.round(item.rating))].map((_, i) => (
            <Ionicons key={i} name="star" size={16} color={colors.accent} />
          ))}
          {[...Array(5 - Math.round(item.rating))].map((_, i) => (
            <Ionicons key={i} name="star-outline" size={16} color={colors.textSecondary} />
          ))}
        </View>
      </View>
      <Text style={styles.reviewText}>{item.text}</Text>
      <Text style={styles.reviewTime}>{new Date(item.time * 1000).toLocaleDateString()}</Text>
    </View>
  ), []);

  const renderImageDot = (index) => (
    <View
      style={[
        styles.imageDot,
        currentImageIndex === index && styles.imageDotActive,
      ]}
      key={index}
    />
  );

  const images = restaurant.photos?.length > 0
    ? restaurant.photos.map((photo) => photo.url || `https://maps.googleapis.com/maps/api/place/photo?maxheight=400&photoreference=${photo.photo_reference}&key=${GOOGLE_API_KEY}`)
    : [restaurant.imageUrl];

  return (
    <ScrollView style={styles.container}>
      {/* Bild-Karussell */}
      <View style={styles.imageContainer}>
        <FlatList
          data={images}
          renderItem={({ item }) => (
            <Image
              source={{ uri: item }}
              style={styles.image}
              onError={() => console.warn(`Failed to load image for ${restaurant.name}`)}
              defaultSource={{ uri: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4' }}
            />
          )}
          keyExtractor={(item, index) => index.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width);
            setCurrentImageIndex(index);
          }}
        />
        <View style={styles.imageDotsContainer}>
          {images.map((_, index) => renderImageDot(index))}
        </View>
      </View>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.title}>{restaurant.name}</Text>
        <Text style={styles.address}>{restaurant.address}</Text>
        <View style={styles.infoContainer}>
          <Text style={styles.info}>
            {restaurant.type} · {restaurant.rating.toFixed(1)}★ ({restaurant.user_ratings_total})
          </Text>
          <Text style={[styles.status, { color: restaurant.openNow ? colors.success : colors.error }]}>
            {restaurant.openNow ? 'Geöffnet' : 'Geschlossen'}
          </Text>
        </View>
        {restaurant.phone && (
          <Text style={styles.phone}>📞 {restaurant.phone}</Text>
        )}

        {/* Buttons im Grid-Layout */}
        <View style={styles.buttonGrid}>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && { transform: [{ scale: 0.95 }] }]}
            onPress={visitWebsite}
            accessibilityLabel={`Website von ${restaurant.name} besuchen`}
          >
            <Ionicons name="globe-outline" size={24} color={colors.white} />
            <Text style={styles.buttonText}>Website</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && { transform: [{ scale: 0.95 }] }]}
            onPress={callRestaurant}
            accessibilityLabel={`Restaurant ${restaurant.name} anrufen`}
          >
            <Ionicons name="call-outline" size={24} color={colors.white} />
            <Text style={styles.buttonText}>Anrufen</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              isFav && { backgroundColor: colors.success },
              pressed && { transform: [{ scale: 0.95 }] },
            ]}
            onPress={toggleFav}
            accessibilityLabel={isFav ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
          >
            <Ionicons name={isFav ? 'heart' : 'heart-outline'} size={24} color={colors.white} />
            <Text style={styles.buttonText}>{isFav ? 'Entfernen' : 'Favorit'}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && { transform: [{ scale: 0.95 }] }]}
            onPress={shareRestaurant}
            accessibilityLabel={`${restaurant.name} teilen`}
          >
            <Ionicons name="share-outline" size={24} color={colors.white} />
            <Text style={styles.buttonText}>Teilen</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && { transform: [{ scale: 0.95 }] }]}
            onPress={openGoogleMapsNavigation}
            accessibilityLabel={`Route zu ${restaurant.name} in Google Maps öffnen`}
          >
            <Ionicons name="navigate-outline" size={24} color={colors.white} />
            <Text style={styles.buttonText}>Route</Text>
          </Pressable>
        </View>

        {/* Bewertungsformular */}
        <View style={styles.reviewForm}>
          <Text style={styles.sectionTitle}>Deine Bewertung</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Dein Kommentar..."
            placeholderTextColor={colors.textSecondary}
            value={comment}
            onChangeText={setComment}
            multiline
          />
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>Bewertung:</Text>
            <Picker
              selectedValue={rating}
              onValueChange={(itemValue) => setRating(itemValue.toString())}
              style={styles.ratingPicker}
            >
              <Picker.Item label="Bewertung auswählen" value="0" />
              {[1, 2, 3, 4, 5].map((num) => (
                <Picker.Item key={num} label={`${num} Sterne`} value={num.toString()} />
              ))}
            </Picker>
          </View>
          <Pressable
            style={({ pressed }) => [styles.submitButton, pressed && { transform: [{ scale: 0.95 }] }]}
            onPress={submitReview}
          >
            <Text style={styles.submitButtonText}>Bewertung absenden</Text>
          </Pressable>
        </View>

        {/* Öffnungszeiten */}
        {restaurant.openingHours.length > 0 && (
          <View style={styles.hoursContainer}>
            <Text style={styles.sectionTitle}>Öffnungszeiten</Text>
            {restaurant.openingHours.map((hour, index) => {
              const today = new Date().getDay();
              const isToday = hour.toLowerCase().includes(['sonntag', 'montag', 'dienstag', 'mittwoch', 'donnerstag', 'freitag', 'samstag'][today].toLowerCase());
              return (
                <View
                  key={index}
                  style={[styles.hourRow, isToday && styles.hourRowToday]}
                >
                  <Text style={[styles.hourText, isToday && styles.hourTextToday]}>{hour}</Text>
                  {isToday && (
                    <Text style={styles.todayLabel}>Heute</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Bewertungen */}
        {restaurant.reviews.length > 0 && (
          <View style={styles.reviewsContainer}>
            <Text style={styles.sectionTitle}>Bewertungen</Text>
            <FlatList
              data={restaurant.reviews}
              renderItem={renderReview}
              keyExtractor={(item, index) => index.toString()}
              contentContainerStyle={styles.reviewsList}
            />
          </View>
        )}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: 400,
    height: 300,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  imageDotsContainer: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  imageDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.white,
    marginHorizontal: 4,
    opacity: 0.5,
  },
  imageDotActive: {
    opacity: 1,
    backgroundColor: colors.accent,
  },
  content: { padding: 16 },
  title: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  address: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  info: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: colors.textSecondary,
  },
  status: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
  },
  phone: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: colors.textSecondary,
    marginBottom: 16,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  button: {
    backgroundColor: colors.accent,
    width: '48%',
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: colors.white,
    marginTop: 4,
  },
  reviewForm: {
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  commentInput: {
    backgroundColor: colors.background,
    padding: 10,
    borderRadius: 8,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: colors.textPrimary,
    marginBottom: 12,
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: colors.textPrimary,
    marginRight: 8,
  },
  ratingPicker: {
    flex: 1,
  },
  submitButton: {
    backgroundColor: colors.accent,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: colors.white,
  },
  hoursContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
    marginBottom: 10,
  },
  hourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  hourRowToday: {
    backgroundColor: colors.accent + '20',
    borderRadius: 8,
    padding: 8,
  },
  hourText: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: colors.textSecondary,
  },
  hourTextToday: {
    color: colors.accent,
    fontWeight: '700',
  },
  todayLabel: {
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    color: colors.accent,
    backgroundColor: colors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  reviewsContainer: {
    marginTop: 16,
  },
  reviewsList: {
    paddingBottom: 20,
  },
  reviewContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewAuthor: {
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
  },
  reviewStars: {
    flexDirection: 'row',
  },
  reviewText: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  reviewTime: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: colors.textSecondary,
  },
});