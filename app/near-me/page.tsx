'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { MapPinIcon, MagnifyingGlassIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

interface Place {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type?: string;
  class?: string;
  distance?: string;
  icon?: string;
  reviews?: string[];
  images?: string[];
}

const NearMePage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!userLocation) {
      setError('Please allow location access first.');
      return;
    }
    if (!searchTerm.trim()) {
      setError('Please enter a search term.');
      return;
    }
    setLoading(true);
    setError(null);
    setPlaces([]);

    try {
      const response = await fetch(`/api/places?lat=${userLocation.lat}&lng=${userLocation.lng}&query=${encodeURIComponent(searchTerm)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch places.');
      }
      const data = await response.json();
      const fetchedPlaces = data.results || [];
      setPlaces(fetchedPlaces);
      if (fetchedPlaces.length > 0) {
        setSelectedPlace(fetchedPlaces[0]);
      } else {
        setSelectedPlace(null);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching places.');
      setSelectedPlace(null);
    } finally {
      setLoading(false);
    }
  };

  const requestLocation = async () => {
    setError(null);
    if (navigator.geolocation) {
      const handlePosition = (position: GeolocationPosition) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      };

      const handleError = (err: GeolocationPositionError) => {
        if (err.code === 1) {
          setError('Location access denied. To use this feature, please enable location permissions in your browser/OS settings.');
        } else {
          setError(`Error getting location: ${err.message}. Please ensure location services are enabled on your device.`);
        }
      };

      if (navigator.permissions && navigator.permissions.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'geolocation' });
          permissionStatus.onchange = () => {
            console.log(`Geolocation permission state changed to: ${permissionStatus.state}`);
            if (permissionStatus.state === 'granted') {
              if (!userLocation) {
                navigator.geolocation.getCurrentPosition(handlePosition, handleError);
              }
            } else if (permissionStatus.state === 'denied') {
              setError('Location access has been denied or revoked. Please enable location permissions for this site in your browser/OS settings to use this feature.');
              setUserLocation(null);
            } else if (permissionStatus.state === 'prompt') {
              setError('Location permission status changed. Please click "Allow Location Access" again if needed.');
            }
          };

          if (permissionStatus.state === 'granted') {
            navigator.geolocation.getCurrentPosition(handlePosition, handleError);
          } else if (permissionStatus.state === 'prompt') {
            navigator.geolocation.getCurrentPosition(handlePosition, handleError);
          } else if (permissionStatus.state === 'denied') {
            setError('Location access has been denied. Please enable location permissions for this site in your browser/OS settings to use this feature.');
          }
        } catch (e) {
          console.error("Error querying location permissions: ", e);
          setError('Could not determine location permission status. Attempting to get location directly.');
          navigator.geolocation.getCurrentPosition(handlePosition, handleError);
        }
      } else {
        console.warn("Permissions API not supported. Using basic geolocation.");
        navigator.geolocation.getCurrentPosition(handlePosition, handleError);
      }
    } else {
      setError('Geolocation is not supported by this browser.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400 dark:from-slate-800 dark:via-slate-900 dark:to-black text-slate-800 dark:text-slate-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center">
            <MapPinIcon className="w-10 h-10 mr-3 text-sky-600 dark:text-sky-400" />
            Find Places Near Meee
            <span className="ml-2 text-xs bg-yellow-400 text-yellow-800 px-2 py-1 rounded-full animate-pulse">
              Feature in Improvement
            </span>
          </h1>
          <Link href="/dashboard" className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2.5 px-5 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Back to Home
          </Link>
        </div>

        {!userLocation && (
          <div className="text-center mb-8 p-6 bg-slate-100 dark:bg-slate-900/90 rounded-xl shadow-lg backdrop-blur-sm border border-slate-200 dark:border-slate-700">
            <p className="mb-4 text-slate-600 dark:text-slate-300 text-lg">Please allow location access to find places near you.</p>
            <button
              onClick={requestLocation}
              className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center mx-auto"
            >
              <MapPinIcon className="w-5 h-5 mr-2" />
              Allow Location Access
            </button>
          </div>
        )}

        {userLocation && (
          <p className="text-center mb-6 text-sm text-slate-500 dark:text-slate-400">
            Your current location: Latitude: {userLocation.lat.toFixed(4)}, Longitude: {userLocation.lng.toFixed(4)}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 sticky top-4 z-10">
          <div className="relative w-full max-w-lg">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="E.g., cafe, park, library..."
              className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 transition-colors duration-200"
              disabled={!userLocation}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <MagnifyingGlassIcon className="w-5 h-5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>
          <button
            onClick={handleSearch}
            disabled={!userLocation || loading}
            className="w-full sm:w-auto bg-sky-600 hover:bg-sky-700 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:shadow-lg disabled:bg-slate-400 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {error && (
          <p className="text-red-500 dark:text-red-400 text-center mb-6 p-4 bg-red-100 dark:bg-red-900/30 rounded-lg shadow-md">
            {error}
          </p>
        )}

        {loading && <p className="text-center text-slate-500 dark:text-slate-400 animate-pulse">Loading places...</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {!loading && places.length > 0 && places.map((place, index) => (
            <div
              key={place.id}
              className={`bg-slate-100 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 ease-in-out cursor-pointer transform hover:-translate-y-1 animate-fade-in ${selectedPlace?.id === place.id ? 'ring-2 ring-sky-500 dark:ring-sky-400' : ''}`}
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => setSelectedPlace(place)}
            >
              <div className="flex items-center mb-2">
                {place.icon && <img src={place.icon} alt={place.name} className="w-8 h-8 mr-3 rounded-full border border-slate-300 dark:border-slate-600" />}
                <h2 className="text-xl font-bold text-sky-700 dark:text-sky-400">{place.name}</h2>
              </div>
              {place.address && <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">{place.address}</p>}
              {place.distance && <p className="text-sm text-slate-500 dark:text-slate-400 mb-3"><strong>Distance:</strong> {place.distance}</p>}

              {place.reviews && place.reviews.length > 0 && (
                <div className="mb-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                  <h3 className="text-md font-semibold text-slate-700 dark:text-slate-300 mb-2">Reviews:</h3>
                  <ul className="space-y-2 text-sm text-slate-500 dark:text-slate-400 max-h-28 overflow-y-auto pr-2">
                    {place.reviews.slice(0, 2).map((review, index) => (
                      <li key={index} className="p-2 border border-slate-200 dark:border-slate-600 rounded-md text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 italic">"{review}"</li>
                    ))}
                  </ul>
                </div>
              )}

              {(place.type || place.class) && (
                <div className="pt-3 border-t border-red-200 dark:border-slate-700">
                  <span className="text-sm bg-sky-100 dark:bg-sky-800/50 text-sky-700 dark:text-sky-300 px-3 py-1.5 rounded-full capitalize font-medium">
                    {place.type}{place.type && place.class ? ` (${place.class})` : place.class || ''}
                  </span>
                </div>
              )}
            </div>
          ))}
          {!loading && places.length === 0 && searchTerm && userLocation && !error && (
            <p className="text-center text-slate-500 dark:text-slate-400 mt-8 p-6 bg-slate-100 dark:bg-slate-900/90 rounded-lg shadow-lg backdrop-blur-sm">
              No places found for "{searchTerm}". Try a different search term or check for typos.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NearMePage;