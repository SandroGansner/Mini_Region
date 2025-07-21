import overpy
import psycopg2
from shapely.geometry import Point
from shapely.wkt import dumps

# Supabase-Verbindung (Session Pooler)
try:
    conn = psycopg2.connect(
        dbname="postgres",
        user="postgres.crdpvtaqdwptzaqccfba",
        password="Calanda2025*",
        host="aws-0-eu-central-2.pooler.supabase.com",
        port="5432"
    )
    cursor = conn.cursor()
    print("Verbindung zu Supabase erfolgreich hergestellt.")
except Exception as e:
    print(f"Fehler bei der Verbindung zu Supabase: {str(e)}")
    exit(1)

# API für OpenStreetMap-Abfragen
api = overpy.Overpass()

# Funktion zum Konvertieren von Koordinaten in WKT-Format
def to_wkt_point(lat, lon):
    point = Point(float(lon), float(lat))
    return dumps(point)

# Abfrage für Spielplätze, Museen, Bibliotheken und Schwimmbäder in Graubünden
query = """
[out:json];
(
  node["leisure"="playground"](46.5,9.0,47.0,10.0);
  node["amenity"="museum"](46.5,9.0,47.0,10.0);
  node["amenity"="library"](46.5,9.0,47.0,10.0);
  node["leisure"="swimming_pool"](46.5,9.0,47.0,10.0);
);
out body;
"""

# Führe die Abfrage aus
result = api.query(query)
elements = result.nodes

# Statistik initialisieren
successful_inserts = 0
failed_inserts = 0

print(f"Erfolgreich {len(elements)} Elemente von OSM abgerufen.")

# Iteriere über die Elemente und füge sie in die Supabase-Tabelle ein
for element in elements:
    try:
        # Extrahiere grundlegende Informationen
        osm_id = int(element.id)
        osm_type = 'n'
        element_type = element.tags.get('leisure') or element.tags.get('amenity')
        name = element.tags.get('name', 'Unbekannter Spielplatz')
        description = element.tags.get('description', '') or element.tags.get('note', '')
        
        # Verbesserte Adressermittlung
        street = element.tags.get('addr:street', '')
        house_number = element.tags.get('addr:housenumber', '')
        city = element.tags.get('addr:city', '') or element.tags.get('destination', '')
        address = f"{street} {house_number}, {city}".strip() if street or city else element.tags.get('address', '')
        
        opening_hours = element.tags.get('opening_hours', '')
        age_range = element.tags.get('age_range', '') or element.tags.get('access', '')

        # Konvertiere Koordinaten in WKT-Format
        location_wkt = to_wkt_point(element.lat, element.lon)

        # SQL-Insert-Befehl mit Update bei Konflikt
        cursor.execute("""
            INSERT INTO activities (osm_id, osm_type, type, name, description, address, opening_hours, age_range, location)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, ST_GeomFromText(%s, 4326))
            ON CONFLICT (osm_id)
            DO UPDATE SET
                osm_type = EXCLUDED.osm_type,
                type = EXCLUDED.type,
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                address = EXCLUDED.address,
                opening_hours = EXCLUDED.opening_hours,
                age_range = EXCLUDED.age_range,
                location = EXCLUDED.location;
        """, (
            osm_id,
            osm_type,
            element_type,
            name,
            description if description else None,
            address if address else None,
            opening_hours if opening_hours else None,
            age_range if age_range else None,
            location_wkt
        ))

        conn.commit()
        successful_inserts += 1
        print(f"Element {osm_id} erfolgreich eingefügt oder aktualisiert.")
    except Exception as e:
        conn.rollback()
        failed_inserts += 1
        print(f"Fehler beim Einfügen von Element {osm_id}: {str(e)}")

# Schließe die Verbindung
cursor.close()
conn.close()

# Statistik ausgeben
print(f"Datenverarbeitung abgeschlossen: {successful_inserts} Elemente erfolgreich eingefügt oder aktualisiert, {failed_inserts} Elemente fehlerhaft.")