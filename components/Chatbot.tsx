'use client';

import { useState, useRef, useEffect } from 'react';
import { XMarkIcon, TrashIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DetailedTripPlan } from '@/lib/geminiAI'; // Import the new type

type ChatMessage = {
  sender: 'user' | 'bot';
  text: string;
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

// Remove old RouteSegment and JourneyReport types as we'll use DetailedTripPlan

interface ChatbotProps {
  weatherData: WeatherData | null;
  report: DetailedTripPlan | undefined; // Use DetailedTripPlan here
  cityInput: string;
}

export default function Chatbot({ weatherData, report, cityInput }: ChatbotProps) {
  const [showChatbot, setShowChatbot] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { sender: 'bot', text: 'Hello! I’m your Journey Assistant, powered by Gemini AI. Ask me about weather, travel plans, or safety!' },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('Gemini API key is missing. Please set NEXT_PUBLIC_GOOGLE_API_KEY.');
    toast.error('Chatbot configuration error. Please contact support.');
  }
  const genAI = new GoogleGenerativeAI(apiKey || '');
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const generatePrompt = (userMessage: string) => {
    let context = 'You are a Journey Assistant providing helpful and concise travel advice. Use the following context to tailor your responses:\n';

    if (weatherData) {
      context += `Current weather in ${cityInput.split(',')[0]}: ${weatherData.condition}, ${weatherData.temperature}°C, ${weatherData.precipitation}% precipitation, ${weatherData.humidity}% humidity, ${weatherData.windSpeed} km/h wind speed.\n`;
    } else {
      context += 'No weather data available. Suggest checking weather if relevant.\n';
    }

    if (report) {
      context += `Trip Plan Title: ${report.tripTitle || 'N/A'}\n`;
      if (report.departureDate) {
        context += `Departure Date: ${report.departureDate}\n`;
      }
      if (report.overallSummary) {
        context += `Overall Summary: ${report.overallSummary}\n`;
      }
      if (report.days && report.days.length > 0) {
        report.days.forEach(day => {
          context += `Day ${day.day} (${day.title}):\n`;
          day.activities.forEach(activity => {
            context += `  - ${activity.timeRange}: ${activity.description}${activity.details ? ` (${activity.details})` : ''}\n`;
          });
        });
      }
      if (report.travelTips && report.travelTips.length > 0) {
        context += `Travel Tips: ${report.travelTips.map(tip => `${tip.category}: ${tip.advice}`).join('; ')}\n`;
      }
      // Add more context from DetailedTripPlan as needed, e.g., nearbyAttractions, importantTimings
    } else {
      context += 'No detailed trip plan available. Suggest generating a plan if relevant.\n';
    }

    context += `\nUser Question: ${userMessage}\n`;
    context += 'Provide a concise, friendly, and tailored response. If suggesting places to visit or activities as part of your response, try to include 1-2 brief, insightful reviews for each. Also, describe a relevant image for each such suggestion (e.g., "Image: A bustling market scene." or "Image: Serene view of a mountain lake."). If the question is unrelated to travel, provide a general helpful answer. Aim for responses around 100-150 words if including suggestions with reviews/images.';

    return context;
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) {
      toast.error('Please enter a message to send.');
      return;
    }

    setChatMessages((prev) => [...prev, { sender: 'user', text: chatInput }]);
    setIsLoading(true);

    try {
      const prompt = generatePrompt(chatInput);

      const result = await model.generateContent(prompt);
      const botResponse = result.response.text().trim();

      setChatMessages((prev) => [...prev, { sender: 'bot', text: botResponse }]);
    } catch (error) {
      console.error('Error with Gemini API:', error);
      toast.error('Failed to get a response. Please try again.');
      setChatMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I couldn’t process that. Please try again!' },
      ]);
    }

    setChatInput('');
    setIsLoading(false);
  };

  const handleClearChat = () => {
    setChatMessages([
      { sender: 'bot', text: 'Hello! I’m your Journey Assistant, powered by Gemini AI. Ask me about weather, travel plans, or safety!' },
    ]);
    toast.success('Conversation cleared!', { icon: '🗑️' });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!showChatbot ? (
        <button
          onClick={() => {
            setShowChatbot(true);
            toast('Chatbot opened. Ask me anything!', { icon: '💬' });
          }}
          className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition duration-200"
        >
          💬 Chat
        </button>
      ) : (
        <div className="w-[90vw] max-w-[360px] sm:max-w-[400px] md:max-w-[600px] lg:max-w-[720px] bg-white rounded-lg shadow-lg box-border">
          <div className="bg-blue-600 text-white p-3 sm:p-4 rounded-t-lg flex justify-between items-center">
            <h4 className="font-semibold text-base sm:text-lg truncate flex-1 mr-2">
              Journey Assistant (Gemini AI)
            </h4>
            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <button
                onClick={handleClearChat}
                className="p-1 hover:bg-blue-700 rounded-full"
                title="Clear Chat"
              >
                <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => {
                  setShowChatbot(false);
                  toast('Chatbot closed.', { icon: '💬' });
                }}
                className="p-1 hover:bg-blue-700 rounded-full"
                title="Close Chat"
              >
                <XMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
          <div
            ref={chatContainerRef}
            className="p-3 sm:p-4 h-[50vh] max-h-[360px] sm:max-h-[400px] md:max-h-[500px] lg:max-h-[600px] overflow-y-auto"
          >
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`mb-2 sm:mb-3 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}
              >
                <span
                  className={`inline-block p-2 sm:p-3 rounded-lg ${
                    msg.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
                  } max-w-[80%] text-xs sm:text-sm md:text-base`}
                >
                  {msg.text}
                </span>
              </div>
            ))}
            {isLoading && (
              <div className="text-left mb-2 sm:mb-3">
                <span className="inline-block p-2 sm:p-3 rounded-lg bg-gray-200 text-gray-800 text-xs sm:text-sm">
                  Thinking...
                </span>
              </div>
            )}
          </div>
          <form onSubmit={handleChatSubmit} className="p-3 sm:p-4 border-t">
            <div className="flex">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="w-full p-2 sm:p-3 border rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 text-xs sm:text-sm md:text-base"
                placeholder="Type your message..."
                disabled={isLoading}
              />
              <button
                type="submit"
                className="ml-1 sm:ml-2 bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300 text-xs sm:text-sm"
                disabled={isLoading}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}