'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { fetchWeatherNews } from '../utils/fetchWeatherNews'; // Import the fetch function
import toast from 'react-hot-toast';

type WeatherNews = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  alertLevel: 'low' | 'yellow' | 'orange' | 'red';
  locations: string[];
  imageUrl?: string; // Optional image URL for news articles
};

// List of Indian states for the dropdown
const indianStates = [
  'Andhra Pradesh',
  'Assam',
  'Bihar',
  'Delhi',
  'Gujarat',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Rajasthan',
  'Tamil Nadu',
  'Uttar Pradesh',
  'West Bengal',
];

export default function WeatherNotifications() {
  const router = useRouter();
  const [weatherNews, setWeatherNews] = useState<WeatherNews[]>([]);
  const [selectedState, setSelectedState] = useState<string>('Delhi'); // Default state
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch weather news and alerts based on selected state
  useEffect(() => {
    const loadWeatherNews = async () => {
      setLoading(true);
      try {
        const news = await fetchWeatherNews(selectedState);
        setWeatherNews(news);
        toast.success(`Weather news loaded for ${selectedState}`);
      } catch (error) {
        toast.error('Failed to fetch weather news.');
      } finally {
        setLoading(false);
      }
    };
    loadWeatherNews();
  }, [selectedState]);

  // Separate high alerts (orange/red) from regular news
  const highAlertNews = weatherNews.filter((news) => ['orange', 'red'].includes(news.alertLevel));
  const regularNews = weatherNews.filter((news) => !['orange', 'red'].includes(news.alertLevel));

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-10 px-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4 sm:mb-0">Weather Notifications</h1>
          <div className="flex items-center space-x-4">
            {/* State Selection Dropdown */}
            <div>
              <label htmlFor="state-select" className="text-gray-700 mr-2">
                Select State:
              </label>
              <select
                id="state-select"
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="p-2 border rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 transition duration-200"
              >
                {indianStates.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => {
                router.push('/dashboard');
                toast('Returning to Dashboard.', { icon: '🏠' });
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="text-center text-gray-600 mb-6">
            Loading weather news for {selectedState}...
          </div>
        )}

        {/* High Alert News Section */}
        {highAlertNews.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-semibold text-red-600 mb-4">High Alert News for {selectedState}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {highAlertNews.map((news) => (
                <div
                  key={news.id}
                  className="p-6 bg-red-50 rounded-lg border border-red-200 shadow-md"
                >
                  <h3 className="text-lg font-medium text-red-800 mb-2">{news.title}</h3>
                  {news.imageUrl && (
                    <img
                      src={news.imageUrl}
                      alt={news.title}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                  )}
                  <p className="text-gray-600 mb-2">{news.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(news.publishedAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Locations: {news.locations.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Latest Weather News Section */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Latest Weather News for {selectedState}</h2>
          {weatherNews.length > 0 && !loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {regularNews.map((news) => (
                <div
                  key={news.id}
                  className="p-6 bg-gray-50 rounded-lg border border-gray-200 shadow-md"
                >
                  <h3 className="text-lg font-medium text-gray-800 mb-2">{news.title}</h3>
                  {news.imageUrl && (
                    <img
                      src={news.imageUrl}
                      alt={news.title}
                      className="w-full h-40 object-cover rounded-lg mb-4"
                    />
                  )}
                  <p className="text-gray-600 mb-2">{news.description}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(news.publishedAt).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Locations: {news.locations.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          ) : !loading ? (
            <p className="text-gray-600 text-center">No weather news available at the moment for {selectedState}.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}