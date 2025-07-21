const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

console.log('Starting Mini Region Backend…');

// MongoDB-Verbindung
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Health-Check
app.get('/', (_req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Proxy-Route für Google Places Autocomplete
app.get('/api/place-autocomplete', async (req, res) => {
  const input = req.query.input;
  if (!input) {
    return res.status(400).json({ error: 'Missing input query parameter' });
  }
  try {
    const response = await axios.get(
      'https://maps.googleapis.com/maps/api/place/autocomplete/json',
      {
        params: {
          input,
          key: process.env.GOOGLE_API_KEY,
          language: 'de',
          types: 'establishment',
          components: 'country:ch',
        },
      }
    );
    res.json(response.data.predictions);
  } catch (err) {
    console.error('Autocomplete-Fehler:', err.response?.data || err.message);
    res.status(500).json({ error: 'Autocomplete failed' });
  }
});

// Funktion zum Abrufen von Restaurants
const fetchRestaurants = async (query, location) => {
  try {
    const resp = await axios.get(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      {
        params: {
          query: query || 'restaurants in Graubünden',
          location: location ? `${location.latitude},${location.longitude}` : undefined,
          radius: location ? 25000 : undefined, // 25 km Radius
          type: 'restaurant',
          key: process.env.GOOGLE_API_KEY,
        },
      }
    );

    // Für jedes Restaurant Details abrufen, einschließlich Website
    const detailedResults = await Promise.all(
      resp.data.results.map(async (place) => {
        try {
          const detailsResponse = await axios.get(
            'https://maps.googleapis.com/maps/api/place/details/json',
            {
              params: {
                place_id: place.place_id,
                fields: 'website,formatted_phone_number,opening_hours,reviews',
                key: process.env.GOOGLE_API_KEY,
              },
              timeout: 5000,
            }
          );

          if (detailsResponse.data.status !== 'OK') {
            console.warn(`Failed to load details for ${place.name}: ${detailsResponse.data.error_message}`);
          }

          return {
            ...place,
            website: detailsResponse.data.result?.website || null,
            formatted_phone_number: detailsResponse.data.result?.formatted_phone_number || null,
            openingHours: detailsResponse.data.result?.opening_hours || null,
            reviews: detailsResponse.data.result?.reviews || [],
          };
        } catch (err) {
          console.error(`Error loading details for ${place.name}:`, err.message);
          return {
            ...place,
            website: null,
            formatted_phone_number: null,
            openingHours: null,
            reviews: [],
          };
        }
      })
    );

    return detailedResults;
  } catch (error) {
    console.error('FetchRestaurants error:', error.message);
    return [];
  }
};

// Cron-Job: Restaurants täglich aktualisieren
cron.schedule('0 1 * * *', async () => {
  console.log('Cron: Updating restaurants...');
  const list = await fetchRestaurants();
  for (const r of list) {
    await Restaurant.findOneAndUpdate(
      { placeId: r.place_id },
      {
        name: r.name,
        address: r.formatted_address,
        rating: r.rating,
        types: r.types,
        openingHours: r.openingHours,
        location: r.geometry?.location
          ? { type: 'Point', coordinates: [r.geometry.location.lng, r.geometry.location.lat] }
          : undefined,
        photos: r.photos || [],
        website: r.website || null,
        formatted_phone_number: r.formatted_phone_number || null,
        reviews: r.reviews || [],
        user_ratings_total: r.user_ratings_total || 0,
        updatedAt: new Date(),
      },
      { upsert: true }
    );
  }
  console.log('Cron: Restaurantdaten aktualisiert.');
});

// Schemas & Models
const restaurantSchema = new mongoose.Schema({
  placeId: String,
  name: String,
  address: String,
  rating: Number,
  types: [String],
  openingHours: Object,
  location: { type: { type: String }, coordinates: [Number] },
  photos: [{ photo_reference: String, url: String }],
  website: String,
  formatted_phone_number: String,
  reviews: [Object],
  user_ratings_total: Number,
  updatedAt: Date,
});
const Restaurant = mongoose.model('Restaurant', restaurantSchema);

const eventSchema = new mongoose.Schema({
  id: String,
  title: String,
  date: Date,
  location: String,
  description: String,
  image: String,
  updatedAt: Date,
});
const Event = mongoose.model('Event', eventSchema);

const familyActivitySchema = new mongoose.Schema({
  title: String,
  location: String,
  description: String,
  image: String,
});
const FamilyActivity = mongoose.model('FamilyActivity', familyActivitySchema);

const socialMeetupSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: Date,
  location: String,
  createdAt: { type: Date, default: Date.now },
});
const SocialMeetup = mongoose.model('SocialMeetup', socialMeetupSchema);

// API-Endpoints

// Restaurants
app.get('/api/restaurants', async (req, res) => {
  const { query, lat, lng } = req.query;
  if (query || (lat && lng)) {
    const loc = lat && lng ? { latitude: parseFloat(lat), longitude: parseFloat(lng) } : null;
    const results = await fetchRestaurants(query, loc);
    return res.json(results);
  }
  const stored = await Restaurant.find().limit(20);
  res.json(stored);
});

// MANUELLER Refresh-Endpoint für Restaurants (sofort neu von Google holen)
app.get('/api/refresh-restaurants', async (_req, res) => {
  try {
    console.log('Manueller Refresh gestartet...');
    const list = await fetchRestaurants();
    for (const r of list) {
      await Restaurant.findOneAndUpdate(
        { placeId: r.place_id },
        {
          name: r.name,
          address: r.formatted_address,
          rating: r.rating,
          types: r.types,
          openingHours: r.openingHours,
          location: r.geometry?.location
            ? { type: 'Point', coordinates: [r.geometry.location.lng, r.geometry.location.lat] }
            : undefined,
          photos: r.photos || [],
          website: r.website || null,
          formatted_phone_number: r.formatted_phone_number || null,
          reviews: r.reviews || [],
          user_ratings_total: r.user_ratings_total || 0,
          updatedAt: new Date(),
        },
        { upsert: true }
      );
    }
    console.log('Manueller Refresh abgeschlossen.');
    res.json({ status: 'ok', message: 'Restaurants aktualisiert' });
  } catch (err) {
    console.error('Fehler beim manuellen Refresh:', err.message);
    res.status(500).json({ error: 'Manueller Refresh fehlgeschlagen' });
  }
});

// Events
app.get('/api/events', async (req, res) => {
  const { startDate } = req.query;
  const since = new Date(startDate || new Date().toISOString().split('T')[0]);
  const events = await Event.find({ date: { $gte: since } });
  res.json(events);
});

// Familienaktivitäten
app.get('/api/family-activities', async (_req, res) => {
  const activities = await FamilyActivity.find();
  res.json(activities);
});

// Soziale Treffen
app.get('/api/social-meetups', async (_req, res) => {
  const meetups = await SocialMeetup.find().sort({ createdAt: -1 });
  res.json(meetups);
});
app.post('/api/social-meetups', async (req, res) => {
  const { title, description, date, location } = req.body;
  const m = new SocialMeetup({ title, description, date, location });
  await m.save();
  res.json(m);
});

// Server starten (Port aus Kommandozeilenargumenten oder Umgebungsvariable)
const args = process.argv.slice(2);
const portIndex = args.findIndex(arg => arg === '--port');
const PORT = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : (process.env.PORT || 5001);
app.listen(PORT, '0.0.0.0', () =>
  console.log(`Server läuft auf http://0.0.0.0:${PORT}`)
);