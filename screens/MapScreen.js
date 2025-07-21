import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, Alert } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';
import colors from '../constants/colors';

const MapScreen = () => {
  const [region, setRegion] = useState({
    latitude: 46.85, // Graubünden (Standardposition)
    longitude: 9.53,
    latitudeDelta: 0.5,
    longitudeDelta: 0.5,
  });
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMarkers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real app, this would fetch from an API
      const mockMarkers = [
        {
          id: 1,
          coordinate: {
            latitude: 46.85,
            longitude: 9.53,
          },
          title: 'Chur',
          description: 'Hauptstadt von Graubünden',
        },
        {
          id: 2,
          coordinate: {
            latitude: 46.7,
            longitude: 9.45,
          },
          title: 'Davos',
          description: 'Berühmtes Skigebiet',
        },
        {
          id: 3,
          coordinate: {
            latitude: 46.8137,
            longitude: 9.8374,
          },
          title: 'St. Moritz',
          description: 'Luxuriöser Kurort',
        },
      ];
      
      setMarkers(mockMarkers);
    } catch (error) {
      console.error('Fehler beim Laden der Marker:', error);
      setError('Fehler beim Laden der Kartenmarkierungen');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMarkers();
  }, [fetchMarkers]);

  const onRegionChangeComplete = useCallback((newRegion) => {
    setRegion(newRegion);
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Karte wird geladen...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        region={region}
        onRegionChangeComplete={onRegionChangeComplete}
        showsUserLocation
        showsMyLocationButton
        loadingEnabled
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
          >
            <Callout>
              <View style={styles.calloutContainer}>
                <Text style={styles.calloutTitle}>{marker.title}</Text>
                <Text style={styles.calloutDescription}>{marker.description}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    textAlign: 'center',
  },
  calloutContainer: {
    padding: 10,
    minWidth: 150,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  calloutDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default MapScreen;