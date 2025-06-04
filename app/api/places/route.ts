import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

interface NominatimPlace {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: [string, string, string, string];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Helper function to calculate viewbox coordinates
function getBoundingBox(latitude: number, longitude: number, radiusKm: number): string {
  const latRadians = latitude * Math.PI / 180;

  const deltaLat = radiusKm / 111.0; // ~111 km per degree latitude
  const deltaLon = radiusKm / (111.0 * Math.cos(latRadians)); // km per degree longitude varies with latitude

  const minLat = latitude - deltaLat;
  const maxLat = latitude + deltaLat;
  const minLon = longitude - deltaLon;
  const maxLon = longitude + deltaLon;

  // Format for Nominatim viewbox: left,top,right,bottom (lon_min,lat_max,lon_max,lat_min)
  return `${minLon},${maxLat},${maxLon},${minLat}`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userLatStr = searchParams.get('lat');
  const userLngStr = searchParams.get('lng');
  const query = searchParams.get('query');

  if (!userLatStr || !userLngStr || !query) {
    return NextResponse.json({ error: 'Missing required parameters: lat, lng, query' }, { status: 400 });
  }

  const userLat = parseFloat(userLatStr);
  const userLng = parseFloat(userLngStr);

  const searchRadiusKm = 20;
  const viewbox = getBoundingBox(userLat, userLng, searchRadiusKm);

  // Nominatim API endpoint
  // Added viewbox and bounded=1 to restrict search to the area around user's location
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=20&viewbox=${viewbox}&bounded=1`;

  try {
    const response = await axios.get<NominatimPlace[]>(nominatimUrl, {
      headers: {
        'User-Agent': 'WeatherWiseJourneyApp/1.0 (jeelrupareliya69@gmail.com)',
      },
    });

    if (!response.data) {
        return NextResponse.json({ results: [] });
    }

    const placesWithDistance = response.data.map(place => {
      const placeLat = parseFloat(place.lat);
      const placeLng = parseFloat(place.lon);
      const distanceKm = calculateDistance(userLat, userLng, placeLat, placeLng);
      return {
        id: place.place_id.toString(),
        name: place.display_name.split(',')[0],
        address: place.display_name,
        lat: placeLat,
        lng: placeLng,
        type: place.type,
        class: place.class,
        distance: `${distanceKm.toFixed(2)} km`,
        icon: place.icon,
        // Simulate fetching reviews and images
        reviews: [`Great ${place.type || 'place'}!`, "Highly recommended.", "A bit crowded but good."],
        images: [
          `https://source.unsplash.com/random/300x200?${place.type || 'location'}&sig=${place.place_id}1`,
          `https://source.unsplash.com/random/300x200?${place.type || 'city'}&sig=${place.place_id}2`,
          `https://source.unsplash.com/random/300x200?${place.type || 'landmark'}&sig=${place.place_id}3`,
        ],
      };
    }).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));

    return NextResponse.json({ results: placesWithDistance });

  } catch (error: any) {
    console.error('Error fetching places from Nominatim:', error);
    let errorMessage = 'Failed to fetch places.';
    if (axios.isAxiosError(error) && error.response) {
        errorMessage = `External API error: ${error.response.status} ${error.response.statusText}`;
    } else if (error.message) {
        errorMessage = error.message;
    }
    if (error.response?.status === 429) {
        errorMessage = "Too many requests to the location service. Please try again in a moment. (Max 1 request per second)";
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}