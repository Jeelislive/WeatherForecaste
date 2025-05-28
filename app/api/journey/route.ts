import { NextResponse } from 'next/server';
import connectDB from '../../../lib/mongodb';
import { generateFullJourneyDetailsFromAI, DetailedTripPlan } from '@/lib/geminiAI'; // Changed AIJourneyDetails to DetailedTripPlan

export async function POST(request: Request) {
  try {
    await connectDB();

    const body = await request.json();
    const { startPoint, endPoint, waypoints = [], departureDate } = body;

    if (!startPoint || !endPoint || !departureDate) {
      return NextResponse.json({ error: 'Missing required fields: startPoint, endPoint, and departureDate are required.' }, { status: 400 });
    }
    
    if (!/^\d{4}-\d{2}-\d{2}$/.test(departureDate)) {
        return NextResponse.json({ error: 'Invalid departureDate format. Please use YYYY-MM-DD.' }, { status: 400 });
    }

    const journeyDetails: DetailedTripPlan = await generateFullJourneyDetailsFromAI( // Changed AIJourneyDetails to DetailedTripPlan
      startPoint,
      endPoint,
      Array.isArray(waypoints) ? waypoints : [], 
      departureDate
    );

    return NextResponse.json({ report: journeyDetails });

  } catch (error) {
    console.error('Error in /api/journey POST handler:', error);
    
    let errorMessage = 'Internal Server Error while processing journey request.';
    if (error instanceof Error) {
        errorMessage = error.message;
    } else if (typeof error === 'string') {
        errorMessage = error;
    }
    
    return NextResponse.json(
      { error: 'Failed to generate journey plan.', details: errorMessage },
      { status: 500 }
    );
  }
}