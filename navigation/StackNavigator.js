import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import RestaurantListScreen from '../screens/RestaurantListScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import PlaygroundsScreen from '../screens/PlaygroundsScreen';
import EventScreen from '../screens/EventScreen';
import FamilyActivitiesScreen from '../screens/FamilyActivitiesScreen';
import SocialMeetupsScreen from '../screens/SocialMeetupsScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import InterestsScreen from '../screens/InterestsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import MapScreen from '../screens/MapScreen';
import RestaurantScreen from '../screens/RestaurantScreen';

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: { backgroundColor: '#1e3a8a' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ title: 'Mini Region' }} 
      />
      <Stack.Screen 
        name="Restaurants" 
        component={RestaurantListScreen} 
        options={{ title: 'Restaurants entdecken' }} 
      />
      <Stack.Screen 
        name="RestaurantDetail" 
        component={RestaurantDetailScreen} 
        options={{ title: 'Restaurant Details' }} 
      />
      <Stack.Screen 
        name="RestaurantScreen" 
        component={RestaurantScreen} 
        options={{ title: 'Restaurants' }} 
      />
      <Stack.Screen 
        name="Playgrounds" 
        component={PlaygroundsScreen} 
        options={{ title: 'Spielplätze' }} 
      />
      <Stack.Screen 
        name="Events" 
        component={EventScreen} 
        options={{ title: 'Veranstaltungen' }} 
      />
      <Stack.Screen 
        name="FamilyActivities" 
        component={FamilyActivitiesScreen} 
        options={{ title: 'Familienaktivitäten' }} 
      />
      <Stack.Screen 
        name="SocialMeetups" 
        component={SocialMeetupsScreen} 
        options={{ title: 'Soziale Treffen' }} 
      />
      <Stack.Screen 
        name="Favorites" 
        component={FavoritesScreen} 
        options={{ title: 'Favoriten' }} 
      />
      <Stack.Screen 
        name="Interests" 
        component={InterestsScreen} 
        options={{ title: 'Interessen' }} 
      />
      <Stack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicyScreen} 
        options={{ title: 'Datenschutz' }} 
      />
      <Stack.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ title: 'Kartenansicht' }} 
      />
    </Stack.Navigator>
  );
}