import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TextInput, Pressable } from 'react-native';
import { WebView } from 'react-native-webview';
import Geolocation from '@react-native-community/geolocation';
import colors from '../constants/colors';

export default function EventScreen() {
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    // Fordere Standortberechtigung an
    Geolocation.requestAuthorization((result) => {
      if (result === 'granted') {
        Geolocation.getCurrentPosition(
          (position) => {
            setLocation(position);
            setLoading(false);
          },
          (error) => {
            Alert.alert('Hinweis', error.message);
            setLoading(false);
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
      } else {
        Alert.alert('Hinweis', 'Standortberechtigung wurde nicht erteilt.');
        setLoading(false);
      }
    });
  }, []);

  const constructEventfrogUrl = () => {
    let url =
      'https://embed.eventfrog.ch/de/events.html?key=8bc33953-e621-4ef4-8e34-456278f6ee3b&color=60BF00&showSearch=true&excludeOrgs=false&geoRadius=25';
    if (searchQuery) {
      url += `&search=${encodeURIComponent(searchQuery)}`;
    }
    if (categoryFilter) {
      url += `&category=${encodeURIComponent(categoryFilter)}`;
    }
    if (dateFilter) {
      url += `&startDate=${encodeURIComponent(dateFilter)}`;
    }
    // Falls Geolocation verfügbar ist, füge Koordinaten hinzu (falls Eventfrog das unterstützt)
    if (location) {
      url += `&lat=${location.coords.latitude}&lng=${location.coords.longitude}`;
    }
    return url;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Deine Events</Text>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Deine Events</Text>
      <View style={styles.filterContainer}>
        <TextInput
          style={styles.filterInput}
          placeholder="Suche nach Events..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <TextInput
          style={styles.filterInput}
          placeholder="Kategorie (z. B. Konzert, Festival)"
          placeholderTextColor={colors.textSecondary}
          value={categoryFilter}
          onChangeText={setCategoryFilter}
        />
        <TextInput
          style={styles.filterInput}
          placeholder="Datum (YYYY-MM-DD)"
          placeholderTextColor={colors.textSecondary}
          value={dateFilter}
          onChangeText={setDateFilter}
        />
      </View>
      <WebView
        source={{ uri: constructEventfrogUrl() }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        geolocationEnabled={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1"
        onError={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.warn('WebView error: ', nativeEvent);
        }}
        onMessage={(event) => {
          console.log('WebView message:', event.nativeEvent.data);
        }}
        injectedJavaScript={`
          window.onerror = function(message, source, lineno, colno, error) {
            window.ReactNativeWebView.postMessage('Error: ' + message + ' at ' + source + ':' + lineno);
            return true;
          };
          true;
        `}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  filterContainer: {
    marginBottom: 20,
  },
  filterInput: {
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 12,
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: colors.textPrimary,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  webview: {
    flex: 1,
  },
});