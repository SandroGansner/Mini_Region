import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import ErrorBoundary from './components/ErrorBoundary';
import StackNavigator from './navigation/StackNavigator';

export default function App() {
  return (
    <ErrorBoundary>
      <NavigationContainer>
        <StackNavigator />
      </NavigationContainer>
    </ErrorBoundary>
  );
}