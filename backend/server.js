const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cron = require('node-cron');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit payload size

// Simple rate limiting middleware
const rateLimitMap = new Map();
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => { // 100 requests per 15 minutes
  return (req, res, next) => {
    const clientIp = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!rateLimitMap.has(clientIp)) {
      rateLimitMap.set(clientIp, []);
    }
    
    const requests = rateLimitMap.get(clientIp);
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => time > windowStart);
    
    if (recentRequests.length >= maxRequests) {
      return res.status(429).json({ error: 'Too many requests' });
    }
    
    recentRequests.push(now);
    rateLimitMap.set(clientIp, recentRequests);
    next();
  };
};

app.use(rateLimit());

console.log('Starting Mini Region Backend…');

// MongoDB-Verbindung
if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

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
  
  if (!process.env.GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY environment variable is required');
    return res.status(500).json({ error: 'Server configuration error' });
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
        timeout: 5000, // Add timeout
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
  if (!process.env.GOOGLE_API_KEY) {
    console.error('GOOGLE_API_KEY environment variable is required');
    return [];
  }
  
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
        timeout: 10000, // 10 second timeout
      }
    );

    if (!resp.data.results) {
      console.warn('No results returned from Google Places API');
      return [];
    }

    // Für jedes Restaurant Details abrufen, einschließlich Website
    const detailedResults = await Promise.all(
      resp.data.results.slice(0, 20).map(async (place) => { // Limit to 20 results
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

// Input validation middleware
const validateQueryInput = (req, res, next) => {
  const { query } = req.query;
  if (query && (typeof query !== 'string' || query.length > 100)) {
    return res.status(400).json({ error: 'Invalid query parameter' });
  }
  next();
};

const validateCoordinates = (req, res, next) => {
  const { lat, lng } = req.query;
  if ((lat && (isNaN(parseFloat(lat)) || Math.abs(parseFloat(lat)) > 90)) ||
      (lng && (isNaN(parseFloat(lng)) || Math.abs(parseFloat(lng)) > 180))) {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }
  next();
};

// Restaurants
app.get('/api/restaurants', validateQueryInput, validateCoordinates, async (req, res) => {
  try {
    const { query, lat, lng } = req.query;
    
    if (query || (lat && lng)) {
      const loc = lat && lng ? { latitude: parseFloat(lat), longitude: parseFloat(lng) } : null;
      const results = await fetchRestaurants(query, loc);
      return res.json(results);
    }
    
    // Fetch from database with error handling
    const stored = await Restaurant.find().limit(20);
    res.json(stored);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    res.status(500).json({ error: 'Failed to fetch restaurants' });
  }
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
  try {
    const { startDate } = req.query;
    
    // Validate date if provided
    let since = new Date();
    if (startDate) {
      const parsedDate = new Date(startDate);
      if (isNaN(parsedDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date format' });
      }
      since = parsedDate;
    }
    
    const events = await Event.find({ date: { $gte: since } }).sort({ date: 1 });
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Familienaktivitäten
app.get('/api/family-activities', async (_req, res) => {
  try {
    const activities = await FamilyActivity.find();
    res.json(activities);
  } catch (error) {
    console.error('Error fetching family activities:', error);
    res.status(500).json({ error: 'Failed to fetch family activities' });
  }
});

// Soziale Treffen
app.get('/api/social-meetups', async (_req, res) => {
  try {
    const meetups = await SocialMeetup.find().sort({ createdAt: -1 });
    res.json(meetups);
  } catch (error) {
    console.error('Error fetching social meetups:', error);
    res.status(500).json({ error: 'Failed to fetch social meetups' });
  }
});

app.post('/api/social-meetups', async (req, res) => {
  try {
    const { title, description, date, location } = req.body;
    
    // Input validation
    if (!title || typeof title !== 'string' || title.length > 100) {
      return res.status(400).json({ error: 'Invalid title' });
    }
    if (!description || typeof description !== 'string' || description.length > 500) {
      return res.status(400).json({ error: 'Invalid description' });
    }
    if (!date || isNaN(new Date(date).getTime())) {
      return res.status(400).json({ error: 'Invalid date' });
    }
    if (!location || typeof location !== 'string' || location.length > 200) {
      return res.status(400).json({ error: 'Invalid location' });
    }
    
    const m = new SocialMeetup({ 
      title: title.trim(), 
      description: description.trim(), 
      date: new Date(date), 
      location: location.trim() 
    });
    await m.save();
    res.status(201).json(m);
  } catch (error) {
    console.error('Error creating social meetup:', error);
    res.status(500).json({ error: 'Failed to create social meetup' });
  }
});

// Server starten (Port aus Kommandozeilenargumenten oder Umgebungsvariable)
const args = process.argv.slice(2);
const portIndex = args.findIndex(arg => arg === '--port');
const PORT = portIndex !== -1 ? parseInt(args[portIndex + 1], 10) : (process.env.PORT || 5001);
app.listen(PORT, '0.0.0.0', () =>
  console.log(`Server läuft auf http://0.0.0.0:${PORT}`)
);