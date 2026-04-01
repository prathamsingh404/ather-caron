/**
 * Aether-Carbon Geo-Utility Engine
 * Uses 100% Free Open-Source Telemetry (Nominatim & OSRM)
 */

export interface Coordinates {
  lat: number;
  lon: number;
}

/**
 * Resolves a text address or city (e.g. "Mumbai") to Latitude/Longitude
 */
export async function geocode(query: string): Promise<Coordinates | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'AetherCarbon/1.0 (Contact: team@aethercarbon.com)'
      }
    });

    const data = await response.json();
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      };
    }
  } catch (error) {
    console.error("Geocoding Error:", error);
  }
  return null;
}

/**
 * Calculates real-world driving distance between two coordinates using OSRM
 */
export async function getRoutingDistanceKm(start: Coordinates, end: Coordinates): Promise<number | null> {
  try {
    const url = `http://router.project-osrm.org/route/v1/driving/${start.lon},${start.lat};${end.lon},${end.lat}?overview=false`;
    const response = await fetch(url);
    const data = await response.json();

    if (data && data.routes && data.routes.length > 0) {
      // Distance is in meters, convert to km
      return data.routes[0].distance / 1000;
    }
  } catch (error) {
    console.error("Routing Error:", error);
  }
  return null;
}
