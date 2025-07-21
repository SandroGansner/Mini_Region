import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import colors from '../constants/colors';

export default function PrivacyPolicyScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Datenschutzerklärung</Text>
        <Text style={styles.sectionTitle}>1. Allgemeines</Text>
        <Text style={styles.text}>
          Wir, die Entwickler von Mini Region, nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Diese Datenschutzerklärung erläutert, wie wir Ihre Daten erheben, verarbeiten und schützen.
        </Text>

        <Text style={styles.sectionTitle}>2. Erhobene Daten</Text>
        <Text style={styles.text}>
          Wir erheben die folgenden Daten:
        </Text>
        <Text style={styles.listItem}>
          - **Standortdaten**: Optional, um Restaurants in Ihrer Nähe anzuzeigen (mit Ihrer Zustimmung).
        </Text>
        <Text style={styles.listItem}>
          - **Interessen**: Werden lokal in AsyncStorage gespeichert, um personalisierte Inhalte anzuzeigen.
        </Text>
        <Text style={styles.listItem}>
          - **Favoriten**: Werden lokal gespeichert, um Ihre bevorzugten Restaurants zu speichern.
        </Text>
        <Text style={styles.listItem}>
          - **Benutzerbewertungen**: Optional, wenn Sie Bewertungen für Restaurants abgeben.
        </Text>

        <Text style={styles.sectionTitle}>3. Drittanbieter</Text>
        <Text style={styles.text}>
          Wir nutzen die folgenden Drittanbieter-Dienste:
        </Text>
        <Text style={styles.listItem}>
          - **Google Places API**: Für die Suche nach Restaurants und Kartenansichten.
        </Text>
        <Text style={styles.listItem}>
          - **Eventfrog**: Für die Anzeige von Events über eine WebView.
        </Text>
        <Text style={styles.listItem}>
          - **Overpass API**: Für die Suche nach familienfreundlichen Aktivitäten.
        </Text>
        <Text style={styles.text}>
          Bitte beachten Sie die Datenschutzerklärungen dieser Drittanbieter.
        </Text>

        <Text style={styles.sectionTitle}>4. Datenspeicherung</Text>
        <Text style={styles.text}>
          Ihre Daten werden lokal auf Ihrem Gerät (via AsyncStorage) oder in unserer MongoDB-Datenbank gespeichert. Wir verwenden angemessene Sicherheitsmaßnahmen, um Ihre Daten zu schützen.
        </Text>

        <Text style={styles.sectionTitle}>5. Ihre Rechte</Text>
        <Text style={styles.text}>
          Sie haben das Recht, Auskunft über Ihre gespeicherten Daten zu verlangen, diese zu korrigieren oder zu löschen. Kontaktieren Sie uns hierfür unter:
        </Text>
        <Text style={styles.contact}>
          E-Mail: [Ihre E-Mail-Adresse hier einfügen]
        </Text>

        <Text style={styles.sectionTitle}>6. Änderungen dieser Datenschutzerklärung</Text>
        <Text style={styles.text}>
          Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf zu aktualisieren. Die aktuelle Version wird in der App verfügbar gemacht.
        </Text>

        <Text style={styles.sectionTitle}>7. Kontakt</Text>
        <Text style={styles.text}>
          Bei Fragen zum Datenschutz wenden Sie sich bitte an:
        </Text>
        <Text style={styles.contact}>
          Mini Region Team
        </Text>
        <Text style={styles.contact}>
          [Ihre Kontaktdaten hier einfügen]
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Poppins-Bold',
    color: colors.textPrimary,
    marginTop: 16,
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: colors.textSecondary,
    marginBottom: 12,
  },
  listItem: {
    fontSize: 16,
    fontFamily: 'Poppins-Regular',
    color: colors.textSecondary,
    marginLeft: 16,
    marginBottom: 8,
  },
  contact: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: colors.textPrimary,
    marginBottom: 8,
  },
});