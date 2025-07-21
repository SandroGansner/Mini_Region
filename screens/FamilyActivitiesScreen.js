import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Pressable, ActivityIndicator, Alert, StyleSheet, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import retry from 'async-retry';
import colors from '../constants/colors';

const fallbackActivities = [
  { id: '1', name: 'Spielplatz Chur', location: 'Bahnhofstrasse, Chur', type: 'Spielplatz', website: null },
  { id: '2', name: 'Zoo Davos', location: 'Promenade, Davos', type: 'Zoo', website: 'https://example.com/zoo' },
  { id: '3', name: 'Wanderweg Lenzerheide', location: 'Dorfstrasse, Lenzerheide', type: 'Wandern', website: null },
  { id: '4', name: 'Museum Arosa', location: 'Poststrasse, Arosa', type: 'Museum', website: 'https://example.com/museum' },
];

export default function FamilyActivitiesScreen({ navigation }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [interests, setInterests] = useState([]);
  const [errorDetails, setErrorDetails] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const storedInterests = await AsyncStorage.getItem('interests');
        const parsedInterests = storedInterests ? JSON.parse(storedInterests) : [];
        setInterests(parsedInterests);

        const overpassQuery = `
          [out:json];
          (
            node(around:5000,46.8499,9.5320)[amenity=playground];
            node(around:5000,46.8499,9.5320)[tourism=zoo];
            node(around:5000,46.8499,9.5320)[tourism=museum];
            way(around:5000,46.8499,9.5320)[highway=footway][access=customers];
          );
          out body;
        `;

        const response = await retry(
          () => axios.post(
            `https://overpass-api.de/api/interpreter`,
            overpassQuery,
            {
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            }
          ),
          { retries: 3, minTimeout: 1000 }
        );

        console.log('Overpass API Response (Family Activities):', response.data);

        if (!response.data.elements || response.data.elements.length === 0) {
          Alert.alert('Hinweis', 'Keine Familienaktivitäten gefunden. Zeige Beispieldaten.');
          setActivities(
            parsedInterests.length
              ? fallbackActivities.filter((a) => parsedInterests.includes(a.type))
              : fallbackActivities
          );
          return;
        }

        const filtered = parsedInterests.length
          ? response.data.elements.filter((place) =>
              place.tags?.amenity
                ? parsedInterests.includes(
                    place.tags.amenity.charAt(0).toUpperCase() + place.tags.amenity.slice(1)
                  )
                : place.tags?.tourism
                ? parsedInterests.includes(
                    place.tags.tourism.charAt(0).toUpperCase() + place.tags.tourism.slice(1)
                  )
                : place.tags?.highway
                ? parsedInterests.includes('Wandern')
                : false
            )
          : response.data.elements;

        setActivities(
          filtered.map((place) => ({
            id: place.id.toString(),
            name: place.tags?.name || 'Unbekannte Aktivität',
            location: place.tags?.addr_street
              ? `${place.tags.addr_street}, ${place.tags.addr_city || 'Chur'}`
              : 'Chur',
            type: place.tags?.amenity
              ? place.tags.amenity.charAt(0).toUpperCase() + place.tags.amenity.slice(1)
              : place.tags?.tourism
              ? place.tags.tourism.charAt(0).toUpperCase() + place.tags.tourism.slice(1)
              : place.tags?.highway
              ? 'Wandern'
              : 'Aktivität',
            website: place.tags?.website || null,
          }))
        );
      } catch (err) {
        console.error('API Error:', err.message);
        let errorMessage = 'Familienaktivitäten konnten nicht geladen werden. Zeige Beispieldaten.';
        if (err.response?.status === 403) {
          errorMessage = 'Zugriff verweigert (403).';
        } else if (err.response?.data?.error?.message) {
          errorMessage = `Fehler: ${err.response.data.error.message}`;
        }
        Alert.alert('Fehler', errorMessage);
        setActivities(
          interests.length
            ? fallbackActivities.filter((a) => interests.includes(a.type))
            : fallbackActivities
        );
      }
      setLoading(false);
    };
    loadData();
  }, []);

  const renderItem = ({ item }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { transform: [{ scale: 0.98 }] }]}
      onPress={() => {
        if (!item) {
          Alert.alert('Fehler', 'Aktivitätsdaten nicht verfügbar.');
          return;
        }
        if (item.website) {
          Linking.openURL(item.website).catch(() => {
            Alert.alert('Fehler', 'Die Website konnte nicht geöffnet werden.');
          });
        } else {
          Alert.alert('Hinweis', 'Keine Website verfügbar.');
        }
      }}
      accessibilityLabel={`Details zu ${item?.name || 'unbekannt'} anzeigen`}
    >
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.address}>{item.location}</Text>
        <Text style={styles.meta}>{item.type}</Text>
      </View>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deine Familienaktivitäten</Text>
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : activities.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResults}>Keine Familienaktivitäten gefunden.</Text>
          {errorDetails && (
            <Text style={styles.errorDetails}>
              Fehlerdetails: {JSON.stringify(errorDetails)}
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={activities}
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
  errorDetails: {
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    color: colors.error,
    textAlign: 'center',
    marginTop: 10,
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