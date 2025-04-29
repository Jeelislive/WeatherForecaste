'use client';

import { useState, useEffect } from 'react';
import SearchBar from '../app/components/SearchBar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Lottie from 'lottie-react';
import sunnyAnimation from '../public/animations/sunny.json';
import rainyAnimation from '../public/animations/rainy.json';
import cloudyAnimation from '../public/animations/normal.json';
import winterAnimation from '../public/animations/winter.json';
import { Line } from 'react-chartjs-2';
import dynamic from 'next/dynamic';
import { getCoordinates } from './utils/geocode';
import { FaSun, FaCloudRain, FaCloud, FaWind, FaTint, FaSnowflake } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

const DynamicMap = dynamic(() => import('./components/Map'), {
  ssr: false,
});

const Home = () => {
  const [weather, setWeather] = useState<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [backgroundClass, setBackgroundClass] = useState('bg-sunny');

  ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

  const handleSearch = async (city: string) => {
    const toastId = toast.loading("Fetching weather data...");
    try {
      const response = await fetch(
        `https://weather.indianapi.in/india/weather?city=${city}`,
        {
          method: 'GET',
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_WEATHER_API_KEY || '',
          },
        }
      );
      if (!response.ok) {
        const errorMessage = await response.text();
        console.error('Error:', errorMessage);
        toast.update(toastId, {
          render: errorMessage,
          type: "error",
          isLoading: false,
          autoClose: 3000
        });
        throw new Error(errorMessage);
      }
      const data = await response.json();
      setWeather(data);

      const coordinates = await getCoordinates(city);
      setCoords(coordinates);

      toast.update(toastId, {
        render: "Weather fetched!",
        type: "success",
        isLoading: false,
        autoClose: 3000
      });
    } catch (error) {
      console.error('Error fetching weather:', error);
    }
  };

  // Update background class based on weather condition
  useEffect(() => {
    if (weather?.weather?.current?.description) {
      const condition = weather.weather.current.description.toLowerCase();
      const temp = weather.weather.current.temperature.max.value;
      if (condition.includes('snow') || condition.includes('sleet') || temp < 5) {
        setBackgroundClass('bg-winter');
      } else if (condition.includes('rain')) {
        setBackgroundClass('bg-rainy');
      } else if (condition.includes('cloud')) {
        setBackgroundClass('bg-cloudy');
      } else {
        setBackgroundClass('bg-sunny');
      }
    }
  }, [weather]);

  const getWeatherAnimation = (condition: string, temp: number) => {
    if (condition.toLowerCase().includes('snow') || condition.toLowerCase().includes('sleet') || temp < 5) {
      return winterAnimation;
    }
    if (condition.toLowerCase().includes('rain')) return rainyAnimation;
    if (condition.toLowerCase().includes('cloud')) return cloudyAnimation;
    return sunnyAnimation;
  };

  const getWeatherIcon = (condition: string, temp: number) => {
    if (condition.toLowerCase().includes('snow') || condition.toLowerCase().includes('sleet') || temp < 5) {
      return <FaSnowflake className="text-blue-300" />;
    }
    if (condition.toLowerCase().includes('rain')) return <FaCloudRain className="text-secondary" />;
    if (condition.toLowerCase().includes('cloud')) return <FaCloud className="text-gray-500" />;
    return <FaSun className="text-accent" />;
  };

  const chartData = weather?.weather?.forecast
    ? {
        labels: weather.weather.forecast.map((f: any) => f.date),
        datasets: [
          {
            label: 'Max Temp (°C)',
            data: weather.weather.forecast.map((f: any) => f.max_temp),
            borderColor: '#F59E0B', // accent
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            fill: true,
          },
          {
            label: 'Min Temp (°C)',
            data: weather.weather.forecast.map((f: any) => f.min_temp),
            borderColor: '#3B82F6', // secondary
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            fill: true,
          },
        ],
      }
    : null;

  return (
    <motion.div
      className={`min-h-screen py-6 px-4 animate-fadeIn ${backgroundClass}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-4xl font-bold text-primary text-center mb-8">Weather Forecast</h1>
      <SearchBar onSearch={handleSearch} />

      {/* First Section: Weather Details */}
      {weather && weather.weather && (
        <div className="max-w-6xl mx-auto mb-8 min-h-[33vh] flex flex-col">
          <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-xl shadow-lg text-center animate-slideUp flex-grow">
            <h2 className="text-2xl font-semibold text-primary mb-4">{weather.city}</h2>
            <div className="w-32 h-32 mx-auto mb-4">
              <Lottie
                animationData={getWeatherAnimation(
                  weather.weather.current.description || 'clear',
                  weather.weather.current.temperature.max.value
                )}
                loop={true}
              />
            </div>
            <div className="flex items-center justify-center mb-2">
              {getWeatherIcon(
                weather.weather.current.description || 'clear',
                weather.weather.current.temperature.max.value
              )}
              <p className="text-3xl font-bold text-gray-800 ml-2">
                {weather.weather.current.temperature.max.value}°C
              </p>
            </div>
            <p className="capitalize text-gray-600 text-lg mb-4">
              {weather.weather.current.rainfall ? 'Rainfall' : 'Clear'}
            </p>
            <motion.button
              className="bg-secondary text-white px-4 py-2 rounded-lg mb-4 hover:bg-primary transition-colors"
              onClick={() => setShowDetails(!showDetails)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {showDetails ? 'Hide Details' : 'Show More Details'}
            </motion.button>
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  className="bg-gray-100 p-4 rounded-lg mb-4"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="flex items-center text-gray-700">
                    <FaTint className="mr-2 text-secondary" />
                    Humidity: {weather.weather.current.humidity?.value || 'N/A'}%
                  </p>
                  <p className="flex items-center text-gray-700 mt-2">
                    <FaWind className="mr-2 text-secondary" />
                    Wind Speed: {weather.weather.current.wind_speed?.value || 'N/A'} km/h
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="mt-4 max-h-[20vh] overflow-y-auto">
              <h3 className="font-medium text-gray-800 mb-2">Forecast:</h3>
              <ul className="space-y-3">
                {weather.weather.forecast.map((forecast: any, index: number) => (
                  <motion.li
                    key={index}
                    className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow flex items-center"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <span className="mr-3">
                      {getWeatherIcon(forecast.description, forecast.max_temp)}
                    </span>
                    <div>
                      <p className="font-medium">{forecast.date}: {forecast.description}</p>
                      <p className="text-gray-600">
                        Max: {forecast.max_temp}°C, Min: {forecast.min_temp}°C
                      </p>
                    </div>
                  </motion.li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Second Section: Map */}
      {coords && (
        <div className="max-w-6xl mx-auto mb-8 min-h-[33vh] flex flex-col">
          <div className="rounded-xl overflow-hidden animate-slideUp flex-grow">
            <DynamicMap city={weather?.city || 'Unknown'} lat={coords.lat} lon={coords.lon} />
          </div>
        </div>
      )}

      {/* Third Section: Temperature Chart */}
      {chartData && (
        <div className="max-w-6xl mx-auto mb-8 min-h-[33vh] flex flex-col">
          <h3 className="font-medium text-gray-800 mb-2 text-center">Temperature Trend</h3>
          <div className="bg-white p-6 rounded-xl shadow-lg flex-grow">
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: { title: { display: true, text: 'Temperature (°C)' } },
                  x: { title: { display: true, text: 'Date' } },
                },
              }}
            />
          </div>
        </div>
      )}

      <ToastContainer />
    </motion.div>
  );
};

export default Home;