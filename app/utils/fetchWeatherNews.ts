import axios from 'axios';

type WeatherNews = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  alertLevel: 'low' | 'yellow' | 'orange' | 'red';
  locations: string[];
  imageUrl?: string; // Optional image URL from news articles
};

// Helper function to get coordinates for a location using Nominatim
async function getCoordinates(location: string): Promise<{ lat: number; lon: number }> {
  const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&addressdetails=1&limit=1`;
  const response = await axios.get(nominatimUrl, {
    headers: {
      'User-Agent': 'JourneyPlannerApp/1.0 (your-email@example.com)',
    },
  });

  if (response.data.length === 0) {
    throw new Error(`No coordinates found for ${location}`);
  }

  return {
    lat: parseFloat(response.data[0].lat),
    lon: parseFloat(response.data[0].lon),
  };
}

// Fetch weather conditions from Open-Meteo to determine alert levels
async function getWeatherCondition(lat: number, lon: number): Promise<{ condition: string; precipitation: number }> {
  const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation,weathercode`;
  const response = await axios.get(openMeteoUrl);

  const hourly = response.data.hourly;
  const precipitation = hourly.precipitation[0] || 0; // Precipitation in mm
  const weatherCode = hourly.weathercode[0] || 0; // WMO weather code

  // Map weather code to condition (simplified)
  let condition = 'Clear';
  if (weatherCode >= 80) condition = 'Storm'; // Showers, thunderstorms
  else if (weatherCode >= 61) condition = 'Rain'; // Rain
  else if (weatherCode >= 1) condition = 'Clouds'; // Cloudy

  return { condition, precipitation };
}

// Main function to fetch weather news and alerts
export async function fetchWeatherNews(location: string): Promise<WeatherNews[]> {
  try {
    // Step 1: Get coordinates for the location
    const { lat, lon } = await getCoordinates(location);

    // Step 2: Fetch weather conditions from Open-Meteo to determine alert level
    const { condition, precipitation } = await getWeatherCondition(lat, lon);
    let alertLevel: 'low' | 'yellow' | 'orange' | 'red' = 'low';
    if (condition === 'Storm' || precipitation > 10) alertLevel = 'red';
    else if (condition === 'Rain' || precipitation > 5) alertLevel = 'orange';
    else if (condition === 'Clouds') alertLevel = 'yellow';

    // Step 3: Fetch weather news from NewsData.io
    const newsApiKey = process.env.NEXT_PUBLIC_NEWSAPI_KEY; // NewsData.io API key
    if (!newsApiKey) {
      throw new Error('NewsData.io API key is not configured.');
    }

    const newsUrl = `https://newsdata.io/api/1/news?apikey=${newsApiKey}&q=weather%20${encodeURIComponent(location)}&language=en`;
    const newsResponse = await axios.get(newsUrl);
    const newsData = newsResponse.data.results || [];

    // Step 4: Map news data to WeatherNews format
    const weatherNews: WeatherNews[] = newsData.map((item: any, index: number) => ({
      id: item.article_id || `news-${index}`,
      title: item.title || 'No title available',
      description: item.description || item.content || 'No description available',
      publishedAt: item.pubDate || new Date().toISOString(),
      alertLevel: alertLevel, // Use the alert level determined from Open-Meteo data
      locations: [location],
      imageUrl: item.image_url || undefined, // Include image URL if available
    }));

    return weatherNews;
  } catch (error) {
    console.error('Error fetching weather news:', error);
    return [
      {
        id: 'error-1',
        title: 'Unable to Fetch News',
        description: 'There was an error fetching weather news. Please try again later.',
        publishedAt: new Date().toISOString(),
        alertLevel: 'low',
        locations: [location],
      },
    ];
  }
}