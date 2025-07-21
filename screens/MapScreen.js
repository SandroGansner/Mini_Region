import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
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

  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        setMarkers([
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
        ]);
        setLoading(false);
      } catch (error) {
        console.error('Fehler beim Laden der Marker:', error);
        setLoading(false);
      }
    };
    fetchMarkers();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_DEFAULT} // Verwende OpenStreetMap-Tiles
        initialRegion={{
          latitude: 46.85,
          longitude: 9.53,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
        zoomEnabled={true}
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
          >
            <Callout>
              <View>
                <Text>{marker.title}</Text>
                <Text>{marker.description}</Text>
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
  },
});

export default MapScreen;