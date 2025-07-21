# MiniRegion App 🏔️

Eine React Native App für die Erkundung der Region Graubünden mit Restaurants, Events, Aktivitäten und mehr.

## ✨ Features

- 🍽️ Restaurant-Suche und -bewertungen
- 📅 Lokale Events und Veranstaltungen
- 👨‍👩‍👧‍👦 Familienaktivitäten
- 🤝 Soziale Treffen
- 🗺️ Interaktive Karten
- 🎮 Spielplätze
- ⭐ Favoriten-System

## 🚀 Getting Started

1. **Dependencies installieren**
   ```bash
   npm install
   ```

2. **Backend Dependencies installieren**
   ```bash
   cd backend
   npm install
   ```

3. **Environment Variables einrichten**
   
   Kopiere `.env.example` zu `.env` und fülle die benötigten Variablen aus:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   REACT_NATIVE_BACKEND_URL=http://localhost:5000
   ```

   Für das Backend (`backend/.env`):
   ```
   MONGODB_URI=your_mongodb_connection_string
   GOOGLE_API_KEY=your_google_api_key
   PORT=5000
   ```

4. **Backend starten**
   ```bash
   cd backend
   npm start
   ```

5. **React Native App starten**
   ```bash
   npm run start
   npm run android  # für Android
   npm run ios      # für iOS
   ```

## 🏗️ Architektur

### Frontend
- **React Native** 0.74.5 mit TypeScript
- **React Navigation** für Navigation
- **Supabase** für Backend-Services
- **React Native Maps** für Kartenintegration
- **Axios** für HTTP Requests

### Backend
- **Node.js** mit Express
- **MongoDB** für Datenspeicherung
- **Google Places API** für Restaurant-Daten
- **Rate Limiting** für API-Schutz

### Ordnerstruktur
```
├── components/          # Wiederverwendbare UI-Komponenten
├── screens/            # App-Screens
├── navigation/         # Navigation Konfiguration
├── services/          # API Services
├── utils/             # Hilfsfunktionen
├── types/             # TypeScript Interfaces
├── constants/         # App-Konstanten
└── backend/           # Express Backend Server
```

## 🔒 Security Features

- ✅ Keine hardcoded API Keys
- ✅ Input Validation & Sanitization
- ✅ Rate Limiting (100 requests/15min)
- ✅ Environment Variables für sensitive Daten
- ✅ Error Boundaries für bessere Fehlerbehandlung

## 📱 Performance Optimizations

- ✅ Request Timeouts (10s)
- ✅ Image Error Handling
- ✅ Memory Leak Prevention
- ✅ Debounced API Calls
- ✅ Optimized Re-rendering with useCallback
- ✅ Limited API Results (max 20)

## 🛠️ Development

### Linting & Formatting
```bash
npm run lint
npm run format
```

### Testing
```bash
npm run test
```

### Building
```bash
npm run build:android
npm run build:ios
```

## 📋 API Endpoints

### Restaurants
- `GET /api/restaurants` - Get restaurants
- `GET /api/restaurants?query=pizza&lat=46.85&lng=9.53` - Search with location
- `GET /api/refresh-restaurants` - Manual refresh from Google Places

### Events
- `GET /api/events` - Get upcoming events
- `GET /api/events?startDate=2024-01-01` - Get events from date

### Social Meetups
- `GET /api/social-meetups` - Get all meetups
- `POST /api/social-meetups` - Create new meetup

### Family Activities
- `GET /api/family-activities` - Get family activities

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Änderungen (`git commit -m 'Add some AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

## 📄 License

Dieses Projekt ist unter der MIT License lizenziert - siehe [LICENSE](LICENSE) für Details.

## 🙏 Acknowledgments

- Google Places API für Restaurant-Daten
- Unsplash für Placeholder-Bilder
- React Native Community für excellente Libraries

---

Made with ❤️ in Graubünden, Switzerland
