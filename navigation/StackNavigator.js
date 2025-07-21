import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import RestaurantListScreen from '../screens/RestaurantListScreen';
import RestaurantDetailScreen from '../screens/RestaurantDetailScreen';
import PlaygroundsScreen from '../screens/PlaygroundsScreen'; // Neuer Screen hinzufügen

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
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Mini Region' }} />
      <Stack.Screen name="Restaurants" component={RestaurantListScreen} options={{ title: 'Restaurants entdecken' }} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} options={{ title: 'Details' }} />
      <Stack.Screen name="Playgrounds" component={PlaygroundsScreen} options={{ title: 'Spielplätze' }} />
    </Stack.Navigator>
  );
}