import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get('q');
  const isGlobal = searchParams.get('global') === 'true';

  const apiKey = process.env.NEXT_PUBLIC_WEATHER_API_KEY!;
  
  if (!city) {
    return NextResponse.json({ error: 'City is required' }, { status: 400 });
  }

  const endpoint = isGlobal 
    ? `https://weather.indianapi.in/global/weather?location=${encodeURIComponent(city)}`
    : `https://weather.indianapi.in/india/weather?city=${encodeURIComponent(city)}`;

  try {
    const res = await fetch(endpoint, {
      headers: {
        'x-api-key': apiKey,
      },
    });

    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch weather data' }, { status: 500 });
  }
}
