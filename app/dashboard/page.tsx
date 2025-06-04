'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useQuery } from '@tanstack/react-query';
import { jsPDF } from 'jspdf';
import dynamic from 'next/dynamic';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement } from 'chart.js';
import { BellIcon, SunIcon, CloudIcon, MapPinIcon, ArrowPathIcon, DocumentArrowDownIcon, PlusIcon, ArrowRightOnRectangleIcon, ExclamationTriangleIcon, CheckCircleIcon, InformationCircleIcon, PaperAirplaneIcon, CloudArrowDownIcon, MagnifyingGlassIcon, XMarkIcon, SparklesIcon, GlobeAltIcon, ArrowLeftIcon, Bars3Icon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import debounce from 'lodash.debounce';
import { fetchWeatherNews } from '../utils/fetchWeatherNews';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateFullJourneyDetailsFromAI, DetailedTripPlan, Activity, DayPlan, AttractionInfo, TravelTip } from '@/lib/geminiAI';
import Chatbot from '../../components/Chatbot';
import GeneralWeatherOverview from '../../components/GeneralWeatherOverview';

const Map = dynamic(() => import('../../components/Map'), { ssr: false });
const Bar = dynamic(() => import('react-chartjs-2').then((mod) => mod.Bar), { ssr: false });
const Line = dynamic(() => import('react-chartjs-2').then((mod) => mod.Line), { ssr: false });

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

type NominatimSuggestion = {
  display_name: string;
  lat: string;
  lon: string;
  type: string;
  class: string;
};

type NearMePlace = {
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
};

type JourneyReport = DetailedTripPlan;

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

type WeatherNews = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  alertLevel: 'low' | 'yellow' | 'orange' | 'red';
  locations: string[];
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [view, setView] = useState<'traveller' | 'weather' | 'nearMe'>('traveller');
  const [startPoint, setStartPoint] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [endPoint, setEndPoint] = useState('');
  const [waypoints, setWaypoints] = useState<string[]>([]);
  const [waypointInput, setWaypointInput] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [error, setError] = useState('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [weatherNews, setWeatherNews] = useState<WeatherNews[]>([]);
  const [cityInput, setCityInput] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<NominatimSuggestion[]>([]);
  const [startSuggestions, setStartSuggestions] = useState<NominatimSuggestion[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<NominatimSuggestion[]>([]);
  const [waypointSuggestions, setWaypointSuggestions] = useState<NominatimSuggestion[]>([]);
  const [nearMeSearchTerm, setNearMeTerm] = useState('');
  const [nearMeUserLocation, setNearMeUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [nearMePlaces, setNearMePlaces] = useState<NearMePlace[]>([]);
  const [nearMeSelectedPlace, setNearMeSelectedPlace] = useState<NearMePlace | null>(null);
  const [nearMeLoading, setNearMeLoading] = useState(false);
  const [nearMeError, setNearMeError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const startInputRef = useRef<HTMLInputElement>(null);
  const endInputRef = useRef<HTMLInputElement>(null);
  const waypointInputRef = useRef<HTMLInputElement>(null);
  const nearMeInputRef = useRef<HTMLInputElement>(null);

  const loadWeatherNews = useCallback(
    debounce(async (city: string) => {
      if (!city || city.length < 3) return;
      try {
        const news = await fetchWeatherNews(city);
        setWeatherNews(news);
      } catch (err) {
        console.error('Error loading weather news:', err);
        if (axios.isAxiosError(err) && err.response?.status === 429) {
          toast.error('Rate limit exceeded for weather news. Please try again later.');
        } else {
          toast.error('Failed to load weather news.');
        }
      }
    }, 1000),
    []
  );

  useEffect(() => {
    const defaultCity = cityInput || startPoint || 'Delhi';
    loadWeatherNews(defaultCity);
    return () => {
      loadWeatherNews.cancel();
    };
  }, [cityInput, startPoint, loadWeatherNews]);

  const fetchWeatherReport = async (): Promise<JourneyReport> => {
    setIsLoading(true);
    setError('');
    try {
      if (!startPoint || !endPoint || !departureDate) {
        throw new Error("Start point, end point, and departure date are required.");
      }
      const aiData: DetailedTripPlan = await generateFullJourneyDetailsFromAI(
        startPoint,
        endPoint,
        waypoints,
        departureDate
      );

      const uiReport: JourneyReport = aiData;

      console.log("Detailed Trip Plan from AI:", uiReport);
      setReport(uiReport);
      setIsLoading(false);
      return uiReport;
    } catch (err: any) {
      console.error('Error fetching detailed trip plan from AI:', err);
      const errorMessage = err.message || 'Failed to generate detailed trip plan from AI.';
      setError(errorMessage);
      toast.error(errorMessage);
      setIsLoading(false);
      throw err;
    }
  };

  const [report, setReport] = useState<JourneyReport | null>(null);
  const { refetch, isLoading: isQueryLoading, error: queryError } = useQuery<JourneyReport>({
    queryKey: ['weatherReport'],
    queryFn: fetchWeatherReport,
    enabled: false,
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (queryError) {
      const errorMessage = (queryError as any).response?.data?.details || queryError.message;
      setError('Failed to generate report: ' + errorMessage);
      toast.error('Failed to generate report: ' + errorMessage);
    }
  }, [queryError]);

  const fetchSuggestions = useCallback(
    async (query: string, setter: (suggestions: NominatimSuggestion[]) => void) => {
      if (!query || query.length < 3) {
        setter([]);
        return;
      }
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=in`;
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'JourneyPlannerApp/1.0 (jeelrupareliya69@gmail.com)' },
        });
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        const data = await response.json();
        const suggestionsData: NominatimSuggestion[] = data || [];
        const filteredSuggestions = suggestionsData.filter((suggestion: NominatimSuggestion) => {
          const displayNameParts = suggestion.display_name.split(',').map(s => s.trim());
          if (suggestion.type?.toLowerCase() === 'country' && displayNameParts.length === 1 && displayNameParts[0].toLowerCase() === 'india') {
            return false;
          }
          const specificPlaceTypes = ['city', 'town', 'village', 'hamlet'];
          const suggestionType = suggestion.type?.toLowerCase();
          if (specificPlaceTypes.includes(suggestionType) && displayNameParts.length >= 2) {
            return true;
          }
          if (displayNameParts.length >= 3) {
            return true;
          }
          return false;
        });
        setter(filteredSuggestions);
      } catch (err) {
        console.error('Error fetching suggestions:', err);
        setter([]);
        toast.error('Failed to fetch location suggestions.');
      }
    },
    []
  );

  const handleGeneralWeather = () => {
    setView('weather');
    setCityInput('');
    setWeatherData(null);
    setHourlyForecast([]);
    setIsMobileMenuOpen(false);
    toast('Switched to General Weather view.', { icon: '🌍' });
  };

  const handleTravellerView = () => {
    setView('traveller');
    setWeatherData(null);
    setHourlyForecast([]);
    setIsMobileMenuOpen(false);
    toast('Switched to Traveller view.', { icon: '🚗' });
  };

  const handleNearMeView = () => {
    setView('nearMe');
    setNearMeTerm('');
    setNearMePlaces([]);
    setNearMeSelectedPlace(null);
    setNearMeError(null);
    setIsMobileMenuOpen(false);
    requestNearMeLocation();
    toast('Switched to Near Me view.', { icon: '📍' });
  };

  const handleInputChange = (
    value: string,
    setter: (value: string) => void,
    suggestionsSetter: (suggestions: NominatimSuggestion[]) => void
  ) => {
    setter(value);
    setTimeout(() => {
      fetchSuggestions(value, suggestionsSetter);
    }, 300);
  };

  const handleSelectSuggestion = (
    suggestion: NominatimSuggestion,
    setter: (value: string) => void,
    suggestionsSetter: (suggestions: NominatimSuggestion[]) => void
  ) => {
    setter(suggestion.display_name);
    suggestionsSetter([]);
    toast.success(`Selected location: ${suggestion.display_name.split(',')[0]}`);
  };

  const handleNearMeLocation = () => {
    if (navigator.geolocation) {
      toast.loading('Fetching your location...', { id: 'near-me' });
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1&countrycodes=in`,
              {
                headers: { 'User-Agent': 'JourneyPlannerApp/1.0 (jeelrupareliya69@gmail.com)' },
              }
            );
            if (!response.ok) throw new Error('Failed to fetch location');
            const data = await response.json();
            if (data.display_name) {
              setStartPoint(data.display_name);
              setStartSuggestions([]);
              toast.success(`Set start point to: ${data.display_name.split(',')[0]}`, { id: 'near-me' });
            } else {
              throw new Error('Location name not found');
            }
          } catch (err) {
            console.error('Error fetching location name:', err);
            toast.error('Failed to fetch location name.', { id: 'near-me' });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          toast.error('Unable to access location. Please enable location services.', { id: 'near-me' });
        }
      );
    } else {
      toast.error('Geolocation is not supported by your browser.');
    }
  };

  const requestNearMeLocation = () => {
    setNearMeError(null);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setNearMeUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          toast.success('Location acquired!', { id: 'near-me-location' });
        },
        (err) => {
          let errorMessage = `Error getting location: ${err.message}`;
          if (err.code === 1) { // PERMISSION_DENIED
            errorMessage = "Location access denied. Please enable it in your browser/OS settings and try again.";
          } else if (err.code === 2) {
            errorMessage = "Location information is unavailable. Please check your network or try again later.";
          } else if (err.code === 3) {
            errorMessage = "Getting location timed out. Please try again.";
          }
          setNearMeError(errorMessage);
          toast.error(errorMessage, { id: 'near-me-location', duration: 5000 });
        }
      );
    } else {
      setNearMeError('Geolocation is not supported by this browser.');
      toast.error('Geolocation is not supported by this browser.', { id: 'near-me-location' });
    }
  };

  const handleNearMeSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nearMeUserLocation) {
      setNearMeError('Please allow location access first.');
      toast.error('Please allow location access first.');
      return;
    }
    if (!nearMeSearchTerm.trim()) {
      setNearMeError('Please enter a search term.');
      toast.error('Please enter a search term.');
      return;
    }
    setNearMeLoading(true);
    setNearMeError(null);
    setNearMePlaces([]);

    try {
      const response = await fetch(`/api/places?lat=${nearMeUserLocation.lat}&lng=${nearMeUserLocation.lng}&query=${encodeURIComponent(nearMeSearchTerm)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch places.');
      }
      const data = await response.json();
      const fetchedPlaces = data.results || [];
      setNearMePlaces(fetchedPlaces);
      if (fetchedPlaces.length > 0) {
        setNearMeSelectedPlace(fetchedPlaces[0]);
        toast.success(`Found ${fetchedPlaces.length} places!`);
      } else {
        setNearMeSelectedPlace(null);
        toast.error('No places found for your search.');
      }
    } catch (err: any) {
      setNearMeError(err.message || 'An error occurred while fetching places.');
      toast.error(err.message || 'An error occurred while fetching places.');
    } finally {
      setNearMeLoading(false);
    }
  };

  const generatePDF = async (report: JourneyReport) => {
    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    const contentWidth = doc.internal.pageSize.width - margin * 2;

    const addPageIfNeeded = () => {
      if (yPosition > pageHeight - margin) {
        doc.addPage();
        yPosition = margin;
      }
    };

    const addSectionTitle = (title: string) => {
      addPageIfNeeded();
      doc.setFontSize(16);
      doc.setTextColor(33, 150, 243);
      doc.text(title, margin, yPosition);
      yPosition += 8;
      addPageIfNeeded();
    };

    const addTextLines = (text: string | undefined, fontSize: number, color: string | number | number[], indent = 0) => {
      if (!text) return;
      doc.setFontSize(fontSize);
      if (Array.isArray(color)) {
        doc.setTextColor(color[0], color[1], color[2]);
      } else if (typeof color === 'string') {
        doc.setTextColor(color);
      } else {
        doc.setTextColor(color);
      }
      const lines = doc.splitTextToSize(text, contentWidth - indent);
      lines.forEach((line: string) => {
        doc.text(line, margin + indent, yPosition);
        yPosition += (fontSize * 0.5);
        addPageIfNeeded();
      });
      yPosition += (fontSize * 0.25);
      addPageIfNeeded();
    };

    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text(report.tripTitle || 'Trip Plan', 105, yPosition, { align: 'center' });
    yPosition += 12;
    addPageIfNeeded();

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    if (report.startPoint && report.endPoint) {
      doc.text(`From: ${report.startPoint} To: ${report.endPoint}`, 105, yPosition, { align: 'center' });
      yPosition += 5;
    }
    if (report.departureDate) {
      doc.text(`Departure: ${new Date(report.departureDate).toLocaleDateString()}`, 105, yPosition, { align: 'center' });
      yPosition += 10;
    }
    addPageIfNeeded();

    if (report.overallSummary) {
      addSectionTitle('Trip Overview');
      addTextLines(report.overallSummary, 10, [0,0,0]);
    }

    report.days?.forEach(dayPlan => {
      addSectionTitle(`Day ${dayPlan.day}: ${dayPlan.title}`);
      dayPlan.activities.forEach(activity => {
        addTextLines(`${activity.timeRange}: ${activity.description}`, 11, [0,0,0], 5);
        if (activity.details) {
          addTextLines(activity.details, 9, [80,80,80], 10);
        }
        yPosition += 2;
        addPageIfNeeded();
      });
      if (dayPlan.notes) {
        addTextLines(`Note: ${dayPlan.notes}`, 9, [100,100,100], 5);
      }
      yPosition += 5;
      addPageIfNeeded();
    });

    if (report.nearbyAttractions && report.nearbyAttractions.length > 0) {
      addSectionTitle('Nearby Attractions');
      report.nearbyAttractions.forEach(attraction => {
        addTextLines(attraction.name, 11, [0,0,0], 5);
        addTextLines(attraction.description, 9, [80,80,80], 10);
        if (attraction.locationContext) {
          addTextLines(`Location: ${attraction.locationContext}`, 9, [120,120,120], 10);
        }
        if (attraction.timings) {
          addTextLines(`Timings: ${attraction.timings}`, 9, [120,120,120], 10);
        }
        yPosition += 3;
        addPageIfNeeded();
      });
    }

    if (report.importantTimings && report.importantTimings.length > 0) {
      addSectionTitle('Important Timings');
      report.importantTimings.forEach(timing => {
        addTextLines(timing.name, 11, [0,0,0], 5);
        if (timing.description) {
          addTextLines(timing.description, 9, [80,80,80], 10);
        }
        if (timing.timings) {
          addTextLines(`Details: ${timing.timings}`, 9, [80,80,80], 10);
        }
        yPosition += 3;
        addPageIfNeeded();
      });
    }

    if (report.travelTips && report.travelTips.length > 0) {
      addSectionTitle('Travel Tips');
      report.travelTips.forEach(tip => {
        addTextLines(tip.category, 11, [0,0,0], 5);
        addTextLines(tip.advice, 9, [80,80,80], 10);
        yPosition += 3;
        addPageIfNeeded();
      });
    }

    doc.save('detailed_trip_report.pdf');
    toast.success('PDF report downloaded!');
  };

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startPoint || !endPoint || !departureDate) {
      setError('Please fill in start point, end point, and departure date.');
      toast.error('Please fill in all required fields.');
      return;
    }
    setError('');
    toast.loading('Generating your detailed trip plan...', { id: 'report-generation' });
    try {
      await refetch();
      toast.success('Report generated successfully!', { id: 'report-generation' });
    } catch (err) {
      toast.error('Failed to generate report.', { id: 'report-generation' });
    }
  };

  const handleDownloadPDF = async () => {
    if (!report) {
      toast.error('No report to download. Please generate a report first.');
      return;
    }
    toast.loading('Preparing PDF...', { id: 'pdf-download' });
    try {
      await generatePDF(report);
      toast.success('PDF Downloaded!', { id: 'pdf-download' });
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error('Failed to generate PDF.', { id: 'pdf-download' });
    }
  };

  const handleAddWaypoint = () => {
    if (waypointInput.trim() && !waypoints.includes(waypointInput.trim())) {
      setWaypoints([...waypoints, waypointInput.trim()]);
      setWaypointInput('');
      setWaypointSuggestions([]);
      toast.success(`Added waypoint: ${waypointInput.trim()}`);
    } else if (waypoints.includes(waypointInput.trim())) {
      toast.error('Waypoint already added.');
    }
  };

  const handleRemoveWaypoint = (index: number) => {
    const wpToRemove = waypoints[index];
    setWaypoints(waypoints.filter((_, i) => i !== index));
    toast.success(`Removed waypoint: ${wpToRemove}`);
  };

  const handleSignOut = () => {
    setIsMobileMenuOpen(false);
    signOut({ callbackUrl: '/login' });
  };

  const getWeatherStyles = (condition: string | undefined) => {
    const cond = condition?.toLowerCase() || '';
    if (cond.includes('rain') || cond.includes('drizzle')) return { icon: CloudArrowDownIcon, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900' };
    if (cond.includes('cloud') || cond.includes('overcast')) return { icon: CloudIcon, color: 'text-slate-500', bg: 'bg-slate-100 dark:bg-slate-700' };
    if (cond.includes('sun') || cond.includes('clear')) return { icon: SunIcon, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-800' };
    return { icon: InformationCircleIcon, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-700' };
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
        <ArrowPathIcon className="h-12 w-12 text-sky-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-black text-slate-800 dark:text-slate-200">
      <nav className="fixed top-0 left-0 right-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-md z-20 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <SparklesIcon className="h-8 w-8 text-sky-500" />
              <span className="ml-2 text-lg sm:text-xl font-semibold text-slate-700 dark:text-sky-200">TravelMate AI</span>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <button
                onClick={() => {
                  router.push('/notifications');
                  toast('Navigating to Weather Notifications.', { icon: '🔔' });
                }}
                className="relative p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
                aria-label="View Notifications"
              >
                <BellIcon className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                {weatherNews.length > 0 && (
                  <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
                  </span>
                )}
              </button>
              <button
                onClick={handleGeneralWeather}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'weather' ? 'bg-sky-100 dark:bg-sky-700 text-sky-600 dark:text-sky-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                title="General Weather View"
              >
                <SunIcon className="h-5 w-5 inline mr-1" /> Weather
              </button>
              <button
                onClick={handleTravellerView}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'traveller' ? 'bg-sky-100 dark:bg-sky-700 text-sky-600 dark:text-sky-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                title="Traveller Journey Planner"
              >
                <MapPinIcon className="h-5 w-5 inline mr-1" /> Planner
              </button>
              <button
                onClick={handleNearMeView}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'nearMe' ? 'bg-sky-100 dark:bg-sky-700 text-sky-600 dark:text-sky-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                title="Find Places Near Me"
              >
                <GlobeAltIcon className="h-5 w-5 inline mr-1" /> Near Me
              </button>
              <button
                onClick={handleSignOut}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                title="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md"
                aria-label="Toggle Menu"
              >
                <Bars3Icon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
            <div className="flex flex-col px-4 py-2 space-y-2">
              <button
                onClick={() => {
                  router.push('/notifications');
                  toast('Navigating to Weather Notifications.', { icon: '🔔' });
                  setIsMobileMenuOpen(false);
                }}
                className="relative flex items-center px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md w-full text-left"
              >
                <BellIcon className="h-5 w-5 mr-2" />
                <span>Notifications</span>
                {weatherNews.length > 0 && (
                  <span className="absolute top-1/2 right-3 transform -translate-y-1/2 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 ring-1 ring-white dark:ring-slate-800"></span>
                  </span>
                )}
              </button>
              <button
                onClick={handleGeneralWeather}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${view === 'weather' ? 'bg-sky-100 dark:bg-sky-700 text-sky-600 dark:text-sky-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                <SunIcon className="h-5 w-5 mr-2" /> Weather
              </button>
              <button
                onClick={handleTravellerView}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${view === 'traveller' ? 'bg-sky-100 dark:bg-sky-700 text-sky-600 dark:text-sky-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                <MapPinIcon className="h-5 w-5 mr-2" /> Planner
              </button>
              <button
                onClick={handleNearMeView}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${view === 'nearMe' ? 'bg-sky-100 dark:bg-sky-700 text-sky-600 dark:text-sky-100' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
              >
                <GlobeAltIcon className="h-5 w-5 mr-2" /> Near Me
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center px-3 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" /> Sign Out
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="pt-20 pb-12 px-4 sm:px-6 lg:px-8">
        {view === 'traveller' ? (
          <div className="max-w-3xl mx-auto">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg mb-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-800 dark:text-sky-100 mb-2">Journey Planner</h2>
              <p className="text-center text-slate-600 dark:text-slate-400 mb-6 text-sm sm:text-base">Enter your travel details to get a personalized weather-aware itinerary.</p>
              <form onSubmit={handleGenerateReport} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="relative">
                    <label htmlFor="startPoint" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Point</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        id="startPoint"
                        ref={startInputRef}
                        value={startPoint}
                        onChange={(e) => handleInputChange(e.target.value, setStartPoint, setStartSuggestions)}
                        placeholder="E.g., Sargasan, Gandhinagar"
                        className="flex-grow p-2 sm:p-3 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white transition-colors text-sm sm:text-base"
                      />
                      <button
                        type="button"
                        onClick={handleNearMeLocation}
                        className="p-2 sm:p-3 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-md transition-all duration-150 ease-in-out flex items-center"
                        title="Use Current Location"
                      >
                        <MapPinIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                    {startSuggestions.length > 0 && (
                      <ul className="absolute z-20 w-full max-w-[calc(100%-3rem)] sm:max-w-[calc(100%-4rem)] bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {startSuggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            onClick={() => handleSelectSuggestion(suggestion, setStartPoint, setStartSuggestions)}
                            className="p-2 hover:bg-sky-100 dark:hover:bg-sky-600 cursor-pointer text-sm sm:text-base animate-fade-in"
                          >
                            {suggestion.display_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="relative">
                    <label htmlFor="endPoint" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Point</label>
                    <input
                      type="text"
                      id="endPoint"
                      ref={endInputRef}
                      value={endPoint}
                      onChange={(e) => handleInputChange(e.target.value, setEndPoint, setEndSuggestions)}
                      placeholder="E.g., Sarangpur, Botad"
                      className="w-full p-2 sm:p-3 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white transition-colors text-sm sm:text-base"
                    />
                    {endSuggestions.length > 0 && (
                      <ul className="absolute z-20 w-full max-w-full bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                        {endSuggestions.map((suggestion, index) => (
                          <li
                            key={index}
                            onClick={() => handleSelectSuggestion(suggestion, setEndPoint, setEndSuggestions)}
                            className="p-2 hover:bg-sky-100 dark:hover:bg-sky-600 cursor-pointer text-sm sm:text-base animate-fade-in"
                          >
                            {suggestion.display_name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="waypointInput" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Add Waypoints (Optional)</label>
                  <div className="flex items-center space-x-2 relative">
                    <input
                      type="text"
                      id="waypointInput"
                      ref={waypointInputRef}
                      value={waypointInput}
                      onChange={(e) => handleInputChange(e.target.value, setWaypointInput, setWaypointSuggestions)}
                      placeholder="E.g., Ahmedabad"
                      className="flex-grow p-2 sm:p-3 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white transition-colors text-sm sm:text-base"
                    />
                    <button
                      type="button"
                      onClick={handleAddWaypoint}
                      className="p-2 sm:p-3 bg-sky-500 hover:bg-sky-600 text-white rounded-lg shadow-md transition-all duration-150 ease-in-out flex items-center"
                      title="Add Waypoint"
                    >
                      <PlusIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>
                  {waypointSuggestions.length > 0 && (
                    <ul className="absolute z-20 w-full max-w-[calc(100%-3rem)] sm:max-w-[calc(100%-4rem)] bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {waypointSuggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          onClick={() => handleSelectSuggestion(suggestion, setWaypointInput, setWaypointSuggestions)}
                          className="p-2 hover:bg-sky-100 dark:hover:bg-sky-600 cursor-pointer text-sm sm:text-base animate-fade-in"
                        >
                          {suggestion.display_name}
                        </li>
                      ))}
                    </ul>
                  )}
                  {waypoints.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-slate-600 dark:text-slate-400">Added waypoints:</p>
                      <ul className="flex flex-wrap gap-2">
                        {waypoints.map((wp, index) => (
                          <li key={index} className="flex items-center bg-sky-100 dark:bg-sky-700 text-sky-700 dark:text-sky-200 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full shadow-sm">
                            {wp}
                            <button type="button" onClick={() => handleRemoveWaypoint(index)} className="ml-1 sm:ml-2 text-sky-500 hover:text-sky-700 dark:text-sky-300 dark:hover:text-sky-100">
                              <XMarkIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="departureDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Departure Date</label>
                  <input
                    type="date"
                    id="departureDate"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full p-2 sm:p-3 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white transition-colors text-sm sm:text-base"
                  />
                </div>

                {error && <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/50 p-2 sm:p-3 rounded-md flex items-center"><ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2"/> {error}</p>}

                <button
                  type="submit"
                  disabled={isLoading || isQueryLoading}
                  className="w-full flex items-center justify-center p-3 sm:p-4 bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-150 ease-in-out disabled:opacity-70 disabled:cursor-not-allowed text-sm sm:text-base"
                >
                  {isLoading || isQueryLoading ? (
                    <>
                      <ArrowPathIcon className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mr-2" />
                      Generating Report...
                    </>
                  ) : (
                    <>
                      <PaperAirplaneIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 transform -rotate-45" />
                      Generate Detailed Trip Plan
                    </>
                  )}
                </button>
              </form>
            </div>

            {report && (
              <div className="mt-8 p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/80 dark:to-slate-900/70 rounded-xl shadow-xl">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                  <div className="mb-4 sm:mb-0">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800 dark:text-sky-100 leading-tight">
                      {report.tripTitle || "Your Trip Plan"}
                    </h3>
                    {(report.startPoint || report.endPoint || report.departureDate) && (
                      <div className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 space-x-2">
                        {report.startPoint && <span>From: <strong>{report.startPoint}</strong></span>}
                        {report.endPoint && <span>To: <strong>{report.endPoint}</strong></span>}
                        {report.departureDate && <span>On: <strong>{new Date(report.departureDate).toLocaleDateString()}</strong></span>}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleDownloadPDF}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-150 ease-in-out flex items-center justify-center space-x-2 text-sm font-medium"
                    title="Download Report as PDF"
                  >
                    <DocumentArrowDownIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Download PDF</span>
                  </button>
                </div>

                {report.overallSummary && (
                  <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-white dark:bg-slate-700 rounded-lg shadow-lg">
                    <h4 className="text-lg sm:text-xl font-semibold text-sky-700 dark:text-sky-300 mb-2 flex items-center">
                      <InformationCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2"/>Trip Overview
                    </h4>
                    <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line text-sm sm:text-base leading-relaxed">{report.overallSummary}</p>
                  </div>
                )}

                {report.days?.map((dayPlan, dayIndex) => (
                  <div key={dayIndex} className="mb-6 sm:mb-8 last:mb-0 bg-white dark:bg-slate-700 p-4 sm:p-6 rounded-lg shadow-lg">
                    <h4 className="text-xl sm:text-2xl font-bold text-sky-600 dark:text-sky-300 mb-4 pb-3 border-b border-slate-200 dark:border-slate-600">
                      Day {dayPlan.day}: {dayPlan.title}
                    </h4>
                    <div className="space-y-4">
                      {dayPlan.activities?.map((activity, activityIndex) => (
                        <div key={activityIndex} className="relative pl-6 pr-2 py-3 bg-slate-50 dark:bg-slate-700/50 rounded-md shadow-sm my-3">
                          <div className="absolute left-2.5 top-4 w-2.5 h-2.5 bg-sky-500 rounded-full border-2 border-white dark:border-slate-700/50"></div>
                          <p className="font-medium text-slate-800 dark:text-slate-100 text-sm sm:text-md">
                            <span className="text-sky-600 dark:text-sky-300 font-semibold">{activity.timeRange}:</span> {activity.description}
                          </p>
                          {activity.details && (
                            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 ml-0 whitespace-pre-line leading-snug">{activity.details}</p>
                          )}
                        </div>
                      ))}
                    </div>
                    {dayPlan.notes && (
                      <p className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-600/50 p-3 rounded-md shadow-inner">Note: {dayPlan.notes}</p>
                    )}
                  </div>
                ))}
                
                {(report.nearbyAttractions && report.nearbyAttractions.length > 0) ||
                (report.importantTimings && report.importantTimings.length > 0) ||
                (report.travelTips && report.travelTips.length > 0) ? (
                  <div className="mt-8 sm:mt-10 pt-6 border-t border-slate-300 dark:border-slate-600 space-y-6 sm:space-y-8">
                    {report.nearbyAttractions && report.nearbyAttractions.length > 0 && (
                      <div>
                        <h4 className="text-lg sm:text-xl font-semibold text-emerald-700 dark:text-emerald-300 mb-3 flex items-center">
                          <MapPinIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2"/>Nearby Attractions
                        </h4>
                        <div className="space-y-3">
                          {report.nearbyAttractions.map((attraction, index) => (
                            <div key={index} className="p-4 bg-white dark:bg-slate-700 rounded-lg shadow-lg">
                              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-md">{attraction.name}</p>
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line mt-1">{attraction.description}</p>
                              {attraction.locationContext && <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Context: {attraction.locationContext}</p>}
                              {attraction.timings && <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">Timings: {attraction.timings}</p>}
                            </div>
                          ))}
                        </div>
                    </div>
                    )}

                    {report.importantTimings && report.importantTimings.length > 0 && (
                      <div>
                        <h4 className="text-lg sm:text-xl font-semibold text-amber-700 dark:text-amber-300 mb-3 flex items-center">
                          <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2"/>Important Timings
                        </h4>
                        <div className="space-y-3">
                          {report.importantTimings.map((timing, index) => (
                            <div key={index} className="p-4 bg-white dark:bg-slate-700 rounded-lg shadow-lg">
                              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-md">{timing.name}</p>
                              {timing.description && <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line mt-1">{timing.description}</p>}
                              {timing.timings && <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">Details: {timing.timings}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {report.travelTips && report.travelTips.length > 0 && (
                      <div>
                        <h4 className="text-lg sm:text-xl font-semibold text-indigo-700 dark:text-indigo-300 mb-3 flex items-center">
                          <CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 mr-2"/>Travel Tips
                        </h4>
                        <div className="space-y-3">
                          {report.travelTips.map((tip, index) => (
                            <div key={index} className="p-4 bg-white dark:bg-slate-700 rounded-lg shadow-lg">
                              <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-md">{tip.category}:</p>
                              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line mt-1">{tip.advice}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        ) : view === 'weather' ? (
          <GeneralWeatherOverview
            cityInput={cityInput}
            setCityInput={setCityInput}
            weatherData={weatherData}
            setWeatherData={setWeatherData}
            hourlyForecast={hourlyForecast}
            setHourlyForecast={setHourlyForecast}
            citySuggestions={citySuggestions}
            setCitySuggestions={setCitySuggestions}
            error={error}
            setError={setError}
          />
        ) : ( // view === 'nearMe'
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-800 dark:text-slate-100 flex items-center">
                <MapPinIcon className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3 text-sky-600 dark:text-sky-400" />
                Find Places Near Me
              </h1>
              <button
                onClick={handleTravellerView}
                className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 px-4 sm:px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out inline-flex items-center text-sm sm:text-base"
              >
                <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Back to Planner
              </button>
            </div>

            {!nearMeUserLocation && (
              <div className="text-center mb-6 p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                <p className="mb-4 text-slate-600 dark:text-slate-300 text-sm sm:text-base">Please allow location access to find places near you.</p>
                <button
                  onClick={requestNearMeLocation}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 ease-in-out inline-flex items-center text-sm sm:text-base"
                >
                  <MapPinIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Allow Location Access
                </button>
              </div>
            )}

            {nearMeUserLocation && (
              <p className="text-center mb-6 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Your current location: Latitude: {nearMeUserLocation.lat.toFixed(4)}, Longitude: {nearMeUserLocation.lng.toFixed(4)}
              </p>
            )}

            <div className="flex justify-center mb-6 sm:mb-8 sticky top-16 sm:top-20 z-10">
              <div className="relative w-full max-w-md sm:max-w-lg">
                <input
                  type="text"
                  value={nearMeSearchTerm}
                  onChange={(e) => setNearMeTerm(e.target.value)}
                  placeholder="E.g., cafe, park, restaurant..."
                  className="w-full pl-8 sm:pl-10 pr-4 py-2 sm:py-3 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-slate-700 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-colors text-sm sm:text-base"
                  disabled={!nearMeUserLocation}
                  onKeyPress={(e) => e.key === 'Enter' && handleNearMeSearch(e)}
                  ref={nearMeInputRef}
                />
                <MagnifyingGlassIcon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 dark:text-slate-500 absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              <button
                onClick={handleNearMeSearch}
                disabled={nearMeLoading || !nearMeUserLocation}
                className="ml-2 sm:ml-3 bg-sky-600 hover:bg-sky-700 text-white font-semibold py-2 sm:py-3 px-4 sm:px-6 rounded-lg shadow-md hover:shadow-lg disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-200 ease-in-out text-sm sm:text-base"
              >
                {nearMeLoading ? 'Searching...' : 'Search'}
              </button>
            </div>

            {nearMeError && (
              <p className="text-red-600 dark:text-red-400 text-center mb-6 p-2 sm:p-3 bg-red-100 dark:bg-red-900/30 rounded-md text-xs sm:text-sm">
                <ExclamationTriangleIcon className="h-4 w-4 sm:h-5 sm:w-5 mr-2 inline" /> {nearMeError}
              </p>
            )}

            {nearMeLoading && <p className="text-center text-slate-600 dark:text-slate-400 text-sm sm:text-base">Loading places...</p>}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Column 1: Places List */}
              <div className="lg:col-span-1 space-y-4 sm:space-y-6 max-h-[calc(100vh-16rem)] sm:max-h-[70vh] overflow-y-auto pr-0 sm:pr-2">
                {!nearMeLoading && nearMePlaces.length > 0 && nearMePlaces.map((place) => (
                  <div
                    key={place.id}
                    className={`bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/70 rounded-lg border border-slate-200 dark:border-slate-700 p-4 sm:p-5 lg:p-6 shadow-lg hover:shadow-xl transition-all duration-200 ease-in-out cursor-pointer animate-slide-up ${nearMeSelectedPlace?.id === place.id ? 'ring-2 ring-sky-500' : ''}`}
                    onClick={() => setNearMeSelectedPlace(place)}
                  >
                    <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                      {place.icon && <img src={place.icon} alt={place.name} className="w-4 h-4 sm:w-5 sm:h-5 mr-2 rounded-full" />}
                      <h4 className="text-lg sm:text-xl lg:text-2xl font-bold text-sky-600 dark:text-sky-400">{place.name}</h4>
                    </div>
                    {place.address && <p className="text-slate-600 dark:text-slate-300 mb-2 text-xs sm:text-sm">{place.address}</p>}
                    {place.distance && <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-2"><strong>Distance:</strong> {place.distance}</p>}

                    {place.images && place.images.length > 0 && (
                      <div className="mt-4 sm:mt-5">
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Images:</h4>
                        <div className="grid-cols-2 sm:grid-cols-3 grid gap-2">
                          {place.images.slice(0, 3).map((imgUrl, index) => (
                            <img
                              key={index}
                              src={imgUrl}
                              alt={`${place.name} image ${index + 1}`}
                              className="w-full h-16 sm:h-20 lg:h-24 object-cover rounded-md shadow-sm"
                              onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/150?text=No+Image')}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {place.reviews && place.reviews.length > 0 && (
                      <div className="mt-3 sm:mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                        <h4 className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Reviews:</h4>
                        <ul className="space-y-1 text-slate-600 dark:text-slate-400 max-h-16 sm:max-h-20 overflow-y-auto">
                          {place.reviews.slice(0, 2).map((review, index) => (
                            <li key={index} className="text-xs sm:text-sm p-1.5 sm:p-2 bg-slate-50 dark:bg-slate-700/60 rounded-md">"{review}"</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(place.type || place.class) && (
                      <div className="mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-slate-200 dark:border-slate-700">
                        <span className="text-xs sm:text-sm bg-sky-100 dark:bg-sky-800 text-sky-700 dark:text-sky-300 px-2 sm:px-2 py-1 rounded-full capitalize">
                          {place.type}{place.type && place.class ? ` (${place.class})` : place.class || ''}
                        </span>
                      </div>
                    )}
                  </div>
                ))}
                {!nearMeLoading && nearMePlaces.length === 0 && nearMeSearchTerm && nearMeUserLocation && !nearMeError && (
                  <div className="text-center mt-4 sm:mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                    <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">No places found for "{nearMeSearchTerm}". Please try a different search term or check for typos.</p>
                  </div>
                )}
              </div>

              {/* Column 2: Work in Progress Placeholder */}
              <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg shadow-inner p-6 flex flex-col items-center justify-center min-h-[300px] lg:min-h-[calc(70vh-theme(space.16))] sticky top-36 self-start">
                <BuildingOfficeIcon className="h-16 w-16 text-slate-400 dark:text-slate-500 mb-4" />
                <h3 className="text-xl font-semibold text-slate-600 dark:text-slate-300 mb-2">Map & Place Details</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center">This feature is currently under construction.</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 text-center">(Coming Soon!)</p>
              </div>
            </div>
          </div>
        )}
      </main>
      <Chatbot weatherData={weatherData} report={report || undefined} cityInput={cityInput} />
    </div>
  );
}