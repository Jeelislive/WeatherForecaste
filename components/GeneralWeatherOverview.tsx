'use client';

import { useRef, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import dynamic from 'next/dynamic';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js';
import { MagnifyingGlassIcon, ExclamationTriangleIcon, InformationCircleIcon, CloudArrowDownIcon, CloudIcon, SunIcon } from '@heroicons/react/24/outline';

// Dynamically import the Map component with SSR disabled
const Map = dynamic(() => import('./Map'), { ssr: false });

// Dynamically import react-chartjs-2 Bar and Line components with SSR disabled
const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), { ssr: false });
const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), { ssr: false });
const Chart = dynamic(() => import('react-chartjs-2').then((mod) => mod.Chart), { ssr: false });

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

type NominatimSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
};

type WeatherData = {
  condition: string;
  temperature: number;
  precipitation: number;
  humidity: number;
  windSpeed: number;
  pressure: number;
  lat: number;
  lon: number;
};

type HourlyForecast = {
  time: string;
  temperature: number;
  precipitation: number;
  condition: string;
};

interface GeneralWeatherOverviewProps {
  cityInput: string;
  setCityInput: (value: string) => void;
  weatherData: WeatherData | null;
  setWeatherData: (data: WeatherData | null) => void;
  hourlyForecast: HourlyForecast[];
  setHourlyForecast: (forecast: HourlyForecast[]) => void;
  error: string;
  setError: (error: string) => void;
  citySuggestions: NominatimSuggestion[];
  setCitySuggestions: (suggestions: NominatimSuggestion[]) => void;
}

export default function GeneralWeatherOverview({
  cityInput,
  setCityInput,
  weatherData,
  setWeatherData,
  hourlyForecast,
  setHourlyForecast,
  error,
  setError,
  citySuggestions,
  setCitySuggestions,
}: GeneralWeatherOverviewProps) {
  const cityInputRef = useRef<HTMLInputElement>(null);

  const fetchSuggestions = useCallback(
    async (query: string, setter: (suggestions: NominatimSuggestion[]) => void) => {
      if (!query || query.length < 3) {
        setter([]);
        return;
      }

      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5`;
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'JourneyPlannerApp/1.0 (REPLACE_WITH_YOUR_EMAIL@example.com)',
          },
        });
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        const data = await response.json();
        setter(data || []);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setter([]);
        toast.error('Failed to fetch location suggestions.');
      }
    },
    []
  );

 const fetchDetailedWeather = async (location: string) => {
  try {
    const simplifiedLocation = location.split(',').slice(0, 4).join(',').trim();
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(simplifiedLocation)}&format=json&addressdetails=1&limit=1`;

    const nominatimResponse = await fetch(nominatimUrl, {
      headers: {
        'User-Agent': 'JourneyPlannerApp/1.0 (REPLACE_WITH_YOUR_EMAIL@example.com)',
      },
    });

    if (!nominatimResponse.ok) throw new Error(`Failed to fetch coordinates for ${location}`);
    const nominatimData = await nominatimResponse.json();
    if (!nominatimData[0]) throw new Error(`No coordinates found for ${location}`);

    const lat = parseFloat(nominatimData[0].lat);
    const lon = parseFloat(nominatimData[0].lon);
    const city = nominatimData[0].display_name.split(',')[0].trim();

    const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenWeather API key is not configured.');
    }

    const currentWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const currentResponse = await axios.get(currentWeatherUrl);
    const currentData = currentResponse.data;

    const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const forecastResponse = await axios.get(forecastUrl);
    const forecastData = forecastResponse.data;

    const hourly = forecastData.list.slice(0, 5).map((item: any) => ({
      time: new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      temperature: item.main.temp,
      precipitation: item.rain ? (item.rain['3h'] || 0) * 100 : 0,
      condition: item.weather[0].main,
    }));

    setWeatherData({
      condition: currentData.weather[0].main,
      temperature: currentData.main.temp,
      precipitation: currentData.rain ? (currentData.rain['1h'] || 0) * 100 : 0,
      humidity: currentData.main.humidity,
      windSpeed: currentData.wind.speed,
      pressure: currentData.main.pressure,
      lat,
      lon,
    });

    setHourlyForecast(hourly);
    toast.dismiss();
    toast.success(`Weather data fetched for ${city}!`);
  } catch (err) {
    console.error('Error fetching detailed weather:', err);
    let errorMessage = 'Failed to fetch weather data';
    if (axios.isAxiosError(err)) {
      if (err.response?.status === 429) {
        errorMessage += ': Rate limit exceeded. Please try again later.';
      } else if (err.response?.status === 401) {
        errorMessage += ': Invalid or missing OpenWeather API key.';
      } else {
        errorMessage += `: ${err.message}`;
      }
    } else if (err instanceof Error) {
      errorMessage += `: ${err.message}`;
    }
    setError(errorMessage);
    toast.dismiss();
    toast.error(errorMessage);
  }
};


  const generateWeatherInsights = (weather: WeatherData, forecast: HourlyForecast[]): string[] => {
    const insights: string[] = [];
    const avgPrecipitation = forecast.reduce((sum, h) => sum + h.precipitation, 0) / forecast.length;
    if (avgPrecipitation > 50) {
      insights.push('High chance of rain in the next few hours. Bring an umbrella or raincoat.');
    } else if (avgPrecipitation > 20) {
      insights.push('Light rain possible. You might want to carry a light rain jacket.');
    }

    const tempTrend = forecast[forecast.length - 1].temperature - forecast[0].temperature;
    if (tempTrend > 5) {
      insights.push('Temperature is rising significantly. Dress in layers to stay comfortable.');
    } else if (tempTrend < -5) {
      insights.push('Temperature is dropping. Consider wearing warmer clothing later.');
    }

    if (weather.windSpeed > 10) {
      insights.push('Strong winds detected. Be cautious if driving or walking in open areas.');
    }

    if (insights.length === 0) {
      insights.push('Weather conditions look stable. No specific precautions needed.');
    }
    return insights;
  };

  const handleFetchWeatherForCity = () => {
    if (!cityInput) {
      setError('Please enter a city name');
      toast.error('Please enter a city name to fetch weather.');
      return;
    }
    setError('');
    toast.loading('Fetching weather data...');
    fetchDetailedWeather(cityInput);
  };

  let suggestionTimeout: NodeJS.Timeout;

const handleInputChange = (value: string) => {
  setCityInput(value);
  clearTimeout(suggestionTimeout);
  suggestionTimeout = setTimeout(() => {
    fetchSuggestions(value, setCitySuggestions);
  }, 300);
};


  const handleSelectSuggestion = (suggestion: NominatimSuggestion) => {
  setCityInput(suggestion.display_name);
  setCitySuggestions([]);
  fetchDetailedWeather(suggestion.display_name);
  toast.success(`Selected location: ${suggestion.display_name.split(',')[0]}`);
};


  const getWeatherStyles = (condition: string | undefined) => {
    if (!condition) return { Icon: InformationCircleIcon, color: 'text-slate-500 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-700', borderColor: 'border-slate-300 dark:border-slate-600', emoji: '⚠️' };
    const lowerCondition = condition.toLowerCase();
    if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) return { Icon: CloudArrowDownIcon, color: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-100 dark:bg-blue-900/50', borderColor: 'border-blue-300 dark:border-blue-700', emoji: '🌧️' };
    if (lowerCondition.includes('cloud')) return { Icon: CloudIcon, color: 'text-slate-500 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-700/50', borderColor: 'border-slate-300 dark:border-slate-600', emoji: '☁️' };
    if (lowerCondition.includes('clear') || lowerCondition.includes('sun')) return { Icon: SunIcon, color: 'text-yellow-600 dark:text-yellow-400', bgColor: 'bg-yellow-50 dark:bg-yellow-700/30', borderColor: 'border-yellow-300 dark:border-yellow-600', emoji: '☀️' };
    if (lowerCondition.includes('storm') || lowerCondition.includes('thunder')) return { Icon: ExclamationTriangleIcon, color: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-100 dark:bg-purple-900/50', borderColor: 'border-purple-300 dark:border-purple-700', emoji: '⛈️' };
    if (lowerCondition.includes('snow') || lowerCondition.includes('sleet')) return { Icon: CloudArrowDownIcon, color: 'text-sky-600 dark:text-sky-400', bgColor: 'bg-sky-100 dark:bg-sky-900/50', borderColor: 'border-sky-300 dark:border-sky-700', emoji: '❄️' };
    if (lowerCondition.includes('mist') || lowerCondition.includes('fog') || lowerCondition.includes('haze')) return { Icon: CloudIcon, color: 'text-gray-500 dark:text-gray-400', bgColor: 'bg-gray-100 dark:bg-gray-700/50', borderColor: 'border-gray-300 dark:border-gray-600', emoji: '🌫️' };
    return { Icon: InformationCircleIcon, color: 'text-slate-500 dark:text-slate-400', bgColor: 'bg-slate-100 dark:bg-slate-700', borderColor: 'border-slate-300 dark:border-slate-600', emoji: '🌍' };
  };

  const chartData = hourlyForecast.length > 0
    ? {
        labels: hourlyForecast.map((h) => h.time),
        datasets: [
          {
            type: 'line' as const,
            label: 'Temperature (°C)',
            data: hourlyForecast.map((h) => h.temperature),
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: true,
            tension: 0.4,
            yAxisID: 'yTemp',
          },
          {
            type: 'bar' as const,
            label: 'Precipitation (%)',
            data: hourlyForecast.map((h) => h.precipitation),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1,
            yAxisID: 'yPrecip',
          },
        ],
      }
    : null;

  return (
    <div className="max-w-5xl mx-auto bg-white dark:bg-slate-800/80 backdrop-blur-md p-6 sm:p-8 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700">
      <h3 className="text-xl sm:text-2xl font-semibold text-slate-700 dark:text-slate-200 mb-6">General Weather Overview</h3>
      {error && (
        <div className="flex items-center text-red-600 dark:text-red-400 mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg border border-red-200 dark:border-red-700">
          <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
          {error}
        </div>
      )}
      <div className="mb-6 relative">
        <label htmlFor="cityInput" className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
          Enter City
        </label>
        <div className="flex items-center space-x-2">
          <input
            ref={cityInputRef}
            type="text"
            id="cityInput"
            value={cityInput}
            onChange={(e) => handleInputChange(e.target.value)}
            className="block w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 placeholder-slate-400 dark:placeholder-slate-500 text-slate-900 dark:text-slate-100"
            placeholder="Enter city name (e.g., Jaipur, Rajasthan)"
          />
          <button
            onClick={handleFetchWeatherForCity}
            className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800"
          >
            <MagnifyingGlassIcon className="h-5 w-5 mr-2 -ml-1" />
            Get Weather
          </button>
        </div>
        {citySuggestions.length > 0 && (
          <ul className="absolute z-10 w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
            {citySuggestions.map((suggestion, index) => (
              <li
                key={index}
                className="p-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200"
                onClick={() => handleSelectSuggestion(suggestion)}
              >
                {suggestion.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      {weatherData ? (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800/70 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
              Current Weather in {cityInput.split(',')[0]}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-600 dark:text-slate-300 flex items-center">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Condition:</span>
                  <span className="ml-2 flex items-center">
                    {(() => {
                      const { Icon, color, emoji } = getWeatherStyles(weatherData.condition);
                      return (
                        <>
                          <Icon className={`h-5 w-5 mr-1 ${color}`} />
                          <span className="mr-1">{emoji}</span>
                        </>
                      );
                    })()}
                    {weatherData.condition}
                  </span>
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Temperature:</span> {weatherData.temperature}°C
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Precipitation:</span> {weatherData.precipitation}%
                </p>
              </div>
              <div>
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Humidity:</span> {weatherData.humidity}%
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Wind Speed:</span> {weatherData.windSpeed} m/s
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  <span className="font-medium text-slate-700 dark:text-slate-200">Pressure:</span> {weatherData.pressure} hPa
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/70 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Location Map</h4>
            <div className="rounded-lg overflow-hidden">
              <Map lat={weatherData.lat} lon={weatherData.lon} locationName={cityInput.split(',')[0]} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/70 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">Hourly Weather Forecast</h4>
            {chartData ? (
              <div className="w-full h-72 md:h-80">
                <Chart
                  type='line'
                  data={chartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'top' as const },
                      title: { display: true, text: 'Hourly Forecast (Temperature & Precipitation)' },
                    },
                    scales: {
                      x: {
                        title: { display: true, text: 'Time' },
                      },
                      yTemp: {
                        type: 'linear' as const,
                        display: true,
                        position: 'left' as const,
                        title: { display: true, text: 'Temperature (°C)' },
                      },
                      yPrecip: {
                        type: 'linear' as const,
                        display: true,
                        position: 'right' as const,
                        title: { display: true, text: 'Precipitation (%)' },
                        beginAtZero: true,
                        grid: {
                          drawOnChartArea: false,
                        },
                      },
                    },
                    interaction: {
                      mode: 'index' as const,
                      intersect: false,
                    },
                  }}
                />
              </div>
            ) : (
              <p className="text-slate-500 dark:text-slate-400">No forecast data available.</p>
            )}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {hourlyForecast.map((hour, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg shadow-md text-center border border-slate-200 dark:border-slate-700">
                  <p className="font-medium text-sm text-slate-700 dark:text-slate-200">{hour.time}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center justify-center">
                    {(() => {
                      const { Icon, color, emoji } = getWeatherStyles(hour.condition);
                      return (
                        <>
                          <Icon className={`h-4 w-4 mr-1 ${color}`} />
                          <span className="mr-1">{emoji}</span>
                        </>
                      );
                    })()}
                    {hour.condition}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">{hour.temperature}°C</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Precip: {hour.precipitation}%</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800/70 backdrop-blur-sm p-6 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">AI Weather Insights</h4>
            <ul className="list-disc ml-5 space-y-1 text-sm text-slate-600 dark:text-slate-300">
              {generateWeatherInsights(weatherData, hourlyForecast).map((insight, index) => (
                <li key={index}>{insight}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-slate-500 dark:text-slate-400 text-center py-10">Enter a city to view weather data.</div>
      )}
    </div>
  );
}