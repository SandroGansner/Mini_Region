import React, { useState, useEffect, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput, Button } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { supabase } from '../src/supabaseClient';
import StarRating from 'react-native-star-rating-widget';

const PlaygroundsScreen = () => {
  const [activities, setActivities] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    // Nutzerstandort abrufen
    const getLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.error('Standortzugriff verweigert');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.5,
        longitudeDelta: 0.5,
      });
    };
    getLocation();
  }, []);

  useEffect(() => {
    // Aktivitäten in der Nähe abrufen
    const fetchActivities = async () => {
      if (!userLocation) return;
      try {
        const { data, error } = await supabase
          .rpc('nearby_activities', {
            user_long: userLocation.longitude,
            user_lat: userLocation.latitude,
            distance: 5000.0,
          });

        if (error) throw error;

        const formattedData = data.map(activity => ({
          ...activity,
          location: {
            coordinates: [
              activity.location.coordinates[0], // longitude
              activity.location.coordinates[1], // latitude
            ],
          },
        }));

        setActivities(formattedData);
      } catch (error) {
        console.error('Fehler beim Abrufen:', error);
      }
    };
    fetchActivities();
  }, [userLocation]);

  const addRating = async (activityId) => {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .insert([{ activity_id: activityId, user_id: 'test_user', rating, comment }]);

      if (error) throw error;

      const updatedActivities = activities.map(activity => {
        if (activity.id === activityId) {
          const updatedRatings = activity.ratings ? [...activity.ratings, { rating, comment }] : [{ rating, comment }];
          return { ...activity, ratings: updatedRatings };
        }
        return activity;
      });

      setActivities(updatedActivities);
      setRating(0);
      setComment('');
      setSelectedActivityId(null);
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Bewertung:', error);
    }
  };

  const focusOnActivity = (coordinates) => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: coordinates[1],
        longitude: coordinates[0],
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  const renderActivity = ({ item }) => {
    const avgRating =
      item.ratings && item.ratings.length > 0
        ? item.ratings.reduce((sum, r) => sum + r.rating, 0) / item.ratings.length
        : 0;
    const isRatingOpen = selectedActivityId === item.id;

    return (
      <TouchableOpacity
        style={styles.activityContainer}
        onPress={() => focusOnActivity(item.location.coordinates)}
      >
        <Text style={styles.activityTitle}>{item.name || 'Spielplatz'}</Text>
        {item.description ? (
          <Text style={styles.activityText}>{item.description}</Text>
        ) : (
          <Text style={styles.activityText}>Keine Beschreibung verfügbar</Text>
        )}
        <Text style={styles.activityText}>
          Adresse: {item.address || 'Nicht verfügbar'}
        </Text>
        <Text style={styles.activityText}>
          Öffnungszeiten: {item.opening_hours || 'Nicht verfügbar'}
        </Text>
        <Text style={styles.activityText}>
          Altersgruppe: {item.age_range || 'Nicht verfügbar'}
        </Text>
        <View style={styles.ratingContainer}>
          <StarRating
            rating={avgRating}
            onChange={() => {}} // Keine Änderung erlaubt (readonly)
            starSize={20}
            maxStars={5}
            color="#FFD700"
            emptyColor="#D3D3D3"
          />
          <Text style={styles.ratingText}>
            ({item.ratings ? item.ratings.length : 0})
          </Text>
        </View>
        <TouchableOpacity
          style={styles.rateButton}
          onPress={() => setSelectedActivityId(isRatingOpen ? null : item.id)}
        >
          <Text style={styles.rateButtonText}>
            {isRatingOpen ? 'Abbrechen' : 'Bewerten'}
          </Text>
        </TouchableOpacity>
        {isRatingOpen && (
          <View style={styles.ratingInputContainer}>
            <StarRating
              rating={rating}
              onChange={setRating}
              starSize={30}
              maxStars={5}
              color="#FFD700"
              emptyColor="#D3D3D3"
              style={{ marginVertical: 10 }}
            />
            <TextInput
              style={styles.commentInput}
              placeholder="Kommentar hinzufügen..."
              value={comment}
              onChangeText={setComment}
              multiline
            />
            <Button
              title="Bewertung absenden"
              onPress={() => addRating(item.id)}
              color="#FFD700"
            />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {userLocation && (
        <MapView
          ref={mapRef}
          style={styles.map}
          provider={PROVIDER_DEFAULT} // OpenStreetMap-Tiles
          initialRegion={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.5,
            longitudeDelta: 0.5,
          }}
          zoomEnabled={true}
        >
          {activities.map((activity) => (
            <Marker
              key={activity.id}
              coordinate={{
                latitude: activity.location.coordinates[1], // latitude
                longitude: activity.location.coordinates[0], // longitude
              }}
            >
              <Callout>
                <View>
                  <Text>{activity.name || 'Spielplatz'}</Text>
                  <Text>{activity.description || 'Keine Beschreibung verfügbar'}</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}
      <FlatList
        data={activities}
        renderItem={renderActivity}
        keyExtractor={(item) => item.id.toString()}
        style={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Keine Spielplätze in der Nähe gefunden.</Text>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  map: {
    flex: 0.5,
  },
  list: {
    flex: 0.5,
  },
  activityContainer: {
    padding: 15,
    backgroundColor: '#fff',
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  activityText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  ratingText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 5,
  },
  rateButton: {
    backgroundColor: '#FFD700',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  rateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  ratingInputContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginVertical: 10,
    minHeight: 80,
    backgroundColor: '#fff',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default PlaygroundsScreen;