'use client';

import React, { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBarProps {
  onSearch: (city: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [input, setInput] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');

  // Fetch city data on initial render
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch('https://weather.indianapi.in/india/cities', {
          method: 'GET',
          headers: {
            'x-api-key': process.env.NEXT_PUBLIC_WEATHER_API_KEY || '',
          },
        });
        const data = await response.json();
        const cities = Object.values(data) as string[];
        setCitySuggestions(cities);
      } catch (error) {
        console.error('Error fetching city data:', error);
      }
    };

    fetchCities();
  }, []);

  // Filter cities based on the user input
  const filteredCities = citySuggestions.filter((city) =>
    city.toLowerCase().includes(input.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && filteredCities.length > 0) {
      onSearch(input.trim());
      setInput(''); // Clear input after search
      setSelectedCity(input.trim());
    }
  };

  const handleSuggestionClick = (city: string) => {
    setInput(''); // Clear input immediately
    setSelectedCity(city);
    onSearch(city); // Trigger search
  };

  return (
    <div className="flex justify-center mb-6">
      <div className="relative w-full max-w-md">
        <motion.input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter city name"
          className="w-full p-3 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
          whileFocus={{ scale: 1.05 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <motion.button
          onClick={handleSubmit}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-secondary text-white px-4 py-1 rounded-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          Search
        </motion.button>

        {/* Display suggestions */}
        <AnimatePresence>
          {input && (
            <motion.ul
              className="absolute w-full bg-white border mt-1 rounded-lg shadow-lg max-h-60 overflow-y-auto z-10"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {filteredCities.length === 0 ? (
                <li className="p-2 text-gray-600">No cities found</li>
              ) : (
                filteredCities.map((city, index) => (
                  <motion.li
                    key={index}
                    className="p-2 cursor-pointer hover:bg-gray-200"
                    onClick={() => handleSuggestionClick(city)}
                    whileHover={{ backgroundColor: '#F3F4F6' }}
                    transition={{ duration: 0.1 }}
                  >
                    {city}
                  </motion.li>
                ))
              )}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SearchBar;