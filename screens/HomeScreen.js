import React from 'react';
import {
    SafeAreaView,
    ImageBackground,
    View,
    Text,
    Pressable,
    StyleSheet,
} from 'react-native';
import colors from '../constants/colors';

export default function HomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.safe}>
            <ImageBackground
                source={require('../assets/images/background.jpg')}
                style={styles.container}
                resizeMode="cover"
            >
                <View style={styles.overlay}>
                    <Text style={styles.title}>Willkommen in Graubünden!</Text>
                    <View style={styles.mainButtonsContainer}>
                        <Pressable
                            style={({ pressed }) => [styles.mainButton, pressed && styles.pressedButton]}
                            onPress={() => navigation.navigate('Restaurants')}
                        >
                            <Text style={styles.mainButtonText}>Restaurants</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.mainButton, pressed && styles.pressedButton]}
                            onPress={() => navigation.navigate('Map')}
                        >
                            <Text style={styles.mainButtonText}>Kartenansicht</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.mainButton, pressed && styles.pressedButton]}
                            onPress={() => navigation.navigate('Events')}
                        >
                            <Text style={styles.mainButtonText}>Events</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.mainButton, pressed && styles.pressedButton]}
                            onPress={() => navigation.navigate('FamilyActivities')}
                        >
                            <Text style={styles.mainButtonText}>Familienaktivitäten</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.mainButton, pressed && styles.pressedButton]}
                            onPress={() => navigation.navigate('SocialMeetups')}
                        >
                            <Text style={styles.mainButtonText}>Soziale Treffen</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.mainButton, pressed && styles.pressedButton]}
                            onPress={() => navigation.navigate('Playgrounds')}
                        >
                            <Text style={styles.mainButtonText}>Spielplätze</Text>
                        </Pressable>
                    </View>
                    <View style={styles.secondaryButtonsContainer}>
                        <Pressable
                            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressedButton]}
                            onPress={() => navigation.navigate('Favorites')}
                        >
                            <Text style={styles.secondaryButtonText}>Favoriten</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressedButton]}
                            onPress={() => navigation.navigate('Interests', { updateInterests: true })}
                        >
                            <Text style={styles.secondaryButtonText}>Interessen ändern</Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressedButton]}
                            onPress={() => navigation.navigate('PrivacyPolicy')}
                        >
                            <Text style={styles.secondaryButtonText}>Datenschutz</Text>
                        </Pressable>
                    </View>
                </View>
            </ImageBackground>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '900',
        fontFamily: 'Poppins-Bold',
        color: colors.white,
        textAlign: 'center',
        marginBottom: 30,
    },
    mainButtonsContainer: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 20,
    },
    mainButton: {
        backgroundColor: colors.accent,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 5,
        width: '80%',
    },
    mainButtonText: {
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        color: colors.white,
    },
    secondaryButtonsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '80%',
    },
    secondaryButton: {
        backgroundColor: colors.secondary,
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 6,
        alignItems: 'center',
        width: '30%',
        marginVertical: 5,
    },
    secondaryButtonText: {
        fontSize: 14,
        fontFamily: 'Poppins-SemiBold',
        color: colors.textPrimary,
    },
    pressedButton: {
        opacity: 0.8,
    },
});