import React, { useState, useEffect } from 'react';
import { View, Text, SectionList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../constants/colors';

const interestsList = {
  Restaurants: ['Pizza', 'Sushi', 'Vegan', 'Regional'],
  Events: ['Konzert', 'Festival', 'Kultur', 'Sport'],
  Familienaktivitäten: ['Spielplatz', 'Zoo', 'Wandern', 'Museum'],
  'Soziale Treffen': ['Kaffee', 'Brettspiele', 'Outdoor', 'Networking'],
};

export default function InterestsScreen({ navigation, route, onComplete }) {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const isUpdate = route?.params?.updateInterests || false;

  useEffect(() => {
    const loadInterests = async () => {
      const storedInterests = await AsyncStorage.getItem('interests');
      if (storedInterests) {
        try {
          const parsedInterests = JSON.parse(storedInterests);
          if (Array.isArray(parsedInterests)) {
            setSelectedInterests(parsedInterests);
          }
        } catch (error) {
          console.error('Error loading interests:', error);
        }
      }
    };
    loadInterests();
  }, []);

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((item) => item !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleSave = async () => {
    if (selectedInterests.length === 0) {
      Alert.alert('Hinweis', 'Bitte wähle mindestens ein Interesse aus.');
      return;
    }
    try {
      await AsyncStorage.setItem('interests', JSON.stringify(selectedInterests));
      if (isUpdate) {
        navigation.goBack();
      } else {
        onComplete();
      }
    } catch (error) {
      console.error('Error saving interests:', error);
      Alert.alert('Fehler', 'Interessen konnten nicht gespeichert werden.');
    }
  };

  const sections = Object.keys(interestsList).map((category) => ({
    title: category,
    data: interestsList[category],
  }));

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.interestItem,
        selectedInterests.includes(item) && styles.selectedInterest,
      ]}
      onPress={() => toggleInterest(item)}
    >
      <Text
        style={[
          styles.interestText,
          selectedInterests.includes(item) && styles.selectedInterestText,
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section: { title } }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isUpdate ? 'Interessen ändern' : 'Wähle deine Interessen'}</Text>
      <SectionList
        sections={sections}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        keyExtractor={(item) => item}
        contentContainerStyle={styles.list}
      />
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Speichern</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
    marginTop: 10,
    marginBottom: 5,
  },
  list: {
    paddingBottom: 20,
  },
  interestItem: {
    backgroundColor: colors.white,
    padding: 15,
    borderRadius: 12,
    margin: 5,
    flex: 1,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  selectedInterest: {
    backgroundColor: colors.primary,
  },
  interestText: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: colors.textPrimary,
  },
  selectedInterestText: {
    color: colors.white,
  },
  saveButton: {
    backgroundColor: colors.accent,
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: colors.white,
  },
});