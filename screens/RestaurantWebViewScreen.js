// screens/RestaurantWebViewScreen.js

import React from 'react';
import { WebView } from 'react-native-webview';

export default function RestaurantWebViewScreen({ route }) {
  const { url } = route.params;

  return <WebView source={{ uri: url || 'https://www.google.com' }} style={{ flex: 1 }} />;
}
