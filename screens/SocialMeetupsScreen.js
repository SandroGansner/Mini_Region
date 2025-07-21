import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Linking
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../constants/colors';

export default function SocialMeetupsScreen() {
  const [meetups, setMeetups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lade gespeicherte Meetups oder Fallback
  useEffect(() => {
    const load = async () => {
      try {
        const stored = await AsyncStorage.getItem('socialMeetups');
        if (stored) {
          setMeetups(JSON.parse(stored));
        } else {
          // Fallback-Liste
          setMeetups([
            { id: '1', title: 'Kaffee am See', date: '2025-05-10', location: 'Chur' },
            { id: '2', title: 'Familien-Picknick', date: '2025-05-17', location: 'Lenzerheide' }
          ]);
        }
      } catch (e) {
        Alert.alert('Fehler', 'Konnte Meetups nicht laden.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const openLocation = (loc) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(loc)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Fehler', 'Karte konnte nicht geöffnet werden.');
    });
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <FlatList
      data={meetups}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => (
        <Pressable
          style={styles.card}
          onPress={() => openLocation(item.location)}
        >
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.meta}>{item.date} · {item.location}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  meta: { fontSize: 14, color: '#666' }
});