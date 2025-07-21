import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, StatusBar } from 'react-native';
import { Video } from 'expo-av';

const SplashScreenComponent = ({ onAnimationFinish }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const videoRef = useRef(null);

  useEffect(() => {
    StatusBar.setHidden(true); // StatusBar verstecken beim Splashscreen

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => {
      handleSplashEnd();
    }, 3200); // Dein Video geht ca. 3 Sekunden

    return () => {
      clearTimeout(timeout);
      StatusBar.setHidden(false); // Wieder einblenden nach Splash
    };
  }, []);

  const handleSplashEnd = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        onAnimationFinish(); // Signal an App.js zum Weiterleiten
      }
    });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Video
        ref={videoRef}
        source={require('../assets/videos/GraubuendenSplash.mp4')} // ACHTUNG: Pfad genau so!
        resizeMode="cover"
        shouldPlay
        isLooping={false}
        volume={1.0}
        isMuted={false} // Ton aktiv!
        onPlaybackStatusUpdate={(status) => {
          if (status.didJustFinish) {
            handleSplashEnd();
          }
        }}
        style={styles.video}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});

export default SplashScreenComponent;
