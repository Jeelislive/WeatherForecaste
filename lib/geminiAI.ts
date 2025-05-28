import { GoogleGenerativeAI } from '@google/generative-ai';

interface JourneyReport {
  segments: {
    from: string;
    to: string;
    distanceKm?: number;
    travelTimeHours?: number;
    weather?: {
      condition?: string;
      temperature?: number;
    };
  }[];
  departureDate?: string;
  overallWarnings: string[];
  overallActions: string[];
}

interface AIResponse {
  recommendations: string[];
  bestRouteSummary: string;
}

export interface Activity {
  timeRange: string; // e.g., "6:00 AM - 7:00 AM"
  description: string;
  details?: string; // Optional further details
}

export interface DayPlan {
  day: number; // e.g., 1, 2
  title: string; // e.g., "Sargasan to Sarangpur & Back" or "Day 2: Exploration"
  activities: Activity[];
  notes?: string; // e.g., "or stay overnight"
}

export interface AttractionInfo {
  name: string;
  description: string;
  timings?: string; // e.g., "Temple timings vary... check official website"
  locationContext?: string; // e.g., "located very close to the Hanuman Temple"
}

export interface TravelTip {
  category: string; // e.g., "Road conditions", "Accommodation", "Food", "Best time to visit", "Weekends & Festivals"
  advice: string;
}

export interface DetailedTripPlan {
  tripTitle: string; // e.g., "Trip Plan: Sargasan to Sarangpur Hanuman Temple & Nearby"
  startPoint?: string; // Original start point for context
  endPoint?: string; // Original end point for context
  departureDate?: string; // Original departure date for context
  overallSummary?: string; // A brief overview if needed, like the intro in the example
  days: DayPlan[];
  nearbyAttractions?: AttractionInfo[];
  importantTimings?: AttractionInfo[]; // Can be specific timings for key places mentioned in the plan
  travelTips?: TravelTip[];
}

const getAIModel = () => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
  if (!apiKey) throw new Error('API key missing');
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
};

const generateAIContent = async (prompt: string): Promise<string> => {
  const model = getAIModel();
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: prompt }] }]
  });
  return result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';
};

export const generateFullJourneyDetailsFromAI = async (
  startPoint: string,
  endPoint: string,
  waypoints: string[],
  departureDate: string // Expecting "YYYY-MM-DD"
): Promise<DetailedTripPlan> => {
  const waypointsString = waypoints.length > 0 ? `via ${waypoints.join(', ')}` : 'direct';
  const prompt = `
Generate a detailed trip plan from "${startPoint}" to "${endPoint}", ${waypointsString}, for departure on ${departureDate}.
The plan should be comprehensive, including daily schedules, activities with timings, descriptions of places, and practical travel tips.
Provide the output strictly in the following JSON format. Do not include any text, comments, or markdown formatting outside of the JSON structure itself.

JSON Output Format:
{
  "tripTitle": "string (e.g., 'Trip Plan: Sargasan to Sarangpur Hanuman Temple & Nearby')",
  "startPoint": "string (original start point, e.g., '${startPoint}')",
  "endPoint": "string (original end point, e.g., '${endPoint}')",
  "departureDate": "string (YYYY-MM-DD, e.g., '${departureDate}')",
  "overallSummary": "string (A brief introductory summary of the trip. e.g., 'Here\\'s a possible trip plan, including nearby attractions and timings. Please verify timings directly with locations as they can change.')",
  "days": [
    {
      "day": "number (e.g., 1)",
      "title": "string (e.g., 'Sargasan to Sarangpur & Back')",
      "activities": [
        {
          "timeRange": "string (e.g., '6:00 AM - 7:00 AM')",
          "description": "string (e.g., 'Start from Sargasan, Gandhinagar.')",
          "details": "string (optional, e.g., 'The drive to Sarangpur is approximately 90-120 minutes (around 90 km) depending on traffic.')"
        },
        {
          "timeRange": "string (e.g., '7:00 AM - 9:00 AM')",
          "description": "string (e.g., 'Arrive at Shree Kashtabhanjan Dev Hanumanji Temple, Sarangpur.')",
          "details": "string (optional, e.g., 'Attend the morning aarti (timings may vary, best to check the temple website or call). Explore the temple complex.')"
        }
        // ... more activities for the day
      ],
      "notes": "string (optional, e.g., 'or stay overnight')"
    }
    // ... more days if it's a multi-day trip
  ],
  "nearbyAttractions": [
    {
      "name": "string (e.g., 'Salangpur Swaminarayan Temple')",
      "description": "string (e.g., 'A significant and visually stunning Swaminarayan temple.')",
      "locationContext": "string (optional, e.g., 'located practically next to the Hanuman temple.')",
      "timings": "string (optional, e.g., 'Similar to the Hanuman temple, check their website or contact them for timings.')"
    }
    // ... more nearby attractions
  ],
  "importantTimings": [
     {
      "name": "string (e.g., 'Shree Kashtabhanjan Dev Hanumanji Temple, Sarangpur')",
      "description": "string (e.g., 'Main temple for the trip.')",
      "timings": "string (e.g., 'Temple timings vary depending on the day and season. It\\'s highly recommended to check their official website or contact the temple directly for up-to-date timings of aarti, darshan, etc.')"
    }
    // ... more important timings for key locations
  ],
  "travelTips": [
    {
      "category": "string (e.g., 'Road conditions')",
      "advice": "string (e.g., 'The roads are generally good.')"
    },
    {
      "category": "string (e.g., 'Accommodation')",
      "advice": "string (e.g., 'Sarangpur has limited options. Botad offers more choices. Book in advance, especially during peak season.')"
    }
    // ... more travel tips
  ]
}

Instructions for AI:
- Populate all fields with relevant and detailed information.
- For a single-day trip, the "days" array will contain one object. For multi-day trips, create an object for each day.
- If the journey implies an overnight stay or options, reflect this in "day.title" or "day.notes".
- "activities" should be chronological.
- "nearbyAttractions" should list significant places near the primary destination(s).
- "importantTimings" should highlight crucial timing information for key attractions mentioned in the plan.
- "travelTips" should provide practical advice covering various aspects like accommodation, food, best time to visit, etc.
- Ensure the information is plausible and helpful for someone planning this trip.
- If waypoints are provided (${waypointsString}), incorporate them logically into the itinerary. If it's a direct trip, focus on the start and end points and potential stops or activities around them.
- Base the level of detail on the complexity of the trip. A simple day trip might have fewer entries than a multi-day tour.
- Be creative and thorough, aiming to produce a report as helpful as the Sargasan-Sarangpur example.
`;

  let responseText = '';
  try {
    responseText = await generateAIContent(prompt);

    let cleanedJsonText = responseText.trim();
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = cleanedJsonText.match(jsonRegex);
    if (match && match[1]) {
      cleanedJsonText = match[1];
    }

    const jsonStartIndex = cleanedJsonText.indexOf('{');
    if (jsonStartIndex > 0) {
        cleanedJsonText = cleanedJsonText.substring(jsonStartIndex);
    }
    const jsonEndIndex = cleanedJsonText.lastIndexOf('}');
    if (jsonEndIndex !== -1 && jsonEndIndex < cleanedJsonText.length -1 ) {
        cleanedJsonText = cleanedJsonText.substring(0, jsonEndIndex + 1);
    }

    const parsedResponse: DetailedTripPlan = JSON.parse(cleanedJsonText);

    // Basic validation for the new structure
    if (!parsedResponse.tripTitle || !parsedResponse.days || !Array.isArray(parsedResponse.days) || parsedResponse.days.length === 0) {
        throw new Error("Parsed AI response is missing essential fields (tripTitle or days).");
    }
    // Further validation can be added here (e.g., check day structure, activities)

    return parsedResponse;
  } catch (error) {
    console.error('Error generating or parsing full journey details from AI:', error);
    console.error('AI Raw Response Text:', responseText);
    let errorMessage = `Failed to generate or parse journey details from AI.`;
    if (error instanceof Error) {
        errorMessage += ` Details: ${error.message}`;
    } else {
        errorMessage += ` Details: ${String(error)}`;
    }
    if (responseText) {
        errorMessage += ` Raw AI response might be malformed. Check console logs.`;
    }
    throw new Error(errorMessage);
  }
};


export const generateAIRecommendations = async (report: JourneyReport): Promise<string[]> => {
  const prompt = `
As an AI travel assistant, provide 3-5 personalized recommendations for the journey:
- Route: From ${report.segments[0]?.from || 'N/A'} to ${report.segments[report.segments.length - 1]?.to || 'N/A'}
- Departure Date: ${report.departureDate || 'N/A'}
- Total Distance: ${report.segments.reduce((a, s) => a + (s.distanceKm || 0), 0).toFixed(1)} km
- Total Travel Time: ${report.segments.reduce((a, s) => a + (s.travelTimeHours || 0), 0).toFixed(1)} hours
- Weather Conditions: ${report.segments.map(s => `${s.from} to ${s.to}: ${s.weather?.condition || 'N/A'}, ${s.weather?.temperature !== undefined ? s.weather.temperature + '°C' : 'N/A'}`).join('; ')}
- Warnings: ${report.overallWarnings.join('; ') || 'None'}
- Actions: ${report.overallActions.join('; ') || 'None'}

Consider safety, comfort, and ways to enhance the travel experience. Provide recommendations in bullet points.
  `;

  try {
    const text = await generateAIContent(prompt);
    const recs = text.split('\n').filter(line => line.trim().match(/^[-•*]/)).map(line => line.trim().replace(/^[-•*]\s*/, ''));
    return recs.length ? recs : ["No specific recommendations generated. Please review your journey details."];
  } catch {
    return ["Unable to generate AI recommendations."];
  }
};

export const generateBestRouteSummary = async (report: JourneyReport): Promise<string> => {
  const prompt = `
Based on the journey details, provide a concise summary of the best route with key considerations:
- Route: From ${report.segments[0]?.from || 'N/A'} to ${report.segments[report.segments.length - 1]?.to || 'N/A'}
- Departure Date: ${report.departureDate || 'N/A'}
- Total Distance: ${report.segments.reduce((a, s) => a + (s.distanceKm || 0), 0).toFixed(1)} km
- Total Travel Time: ${report.segments.reduce((a, s) => a + (s.travelTimeHours || 0), 0).toFixed(1)} hours
- Weather Conditions: ${report.segments.map(s => `${s.from} to ${s.to}: ${s.weather?.condition || 'N/A'}, ${s.weather?.temperature !== undefined ? s.weather.temperature + '°C' : 'N/A'}`).join('; ')}
- Warnings: ${report.overallWarnings.join('; ') || 'None'}
- Actions: ${report.overallActions.join('; ') || 'None'}

Summary in 2-3 sentences focusing on optimal route, key stops, and important considerations.
  `;

  try {
    const summary = await generateAIContent(prompt);
    return summary.trim();
  } catch {
    return "Unable to generate best route summary.";
  }
};

export const generateAIResponse = async (report: JourneyReport): Promise<AIResponse> => {
  const [recommendations, bestRouteSummary] = await Promise.all([
    generateAIRecommendations(report),
    generateBestRouteSummary(report)
  ]);
  return { recommendations, bestRouteSummary };
};
