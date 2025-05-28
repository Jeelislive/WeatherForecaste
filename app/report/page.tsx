'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

// Type definitions (copied from Dashboard.tsx)
type RecommendedPlace = {
  name: string;
  description: string;
  imageUrl: string;
};

type RouteSegment = {
  from: string;
  to: string;
  distanceKm: number;
  travelTimeHours: number;
  bestTimeToTravel: string;
  weather: {
    condition: string;
    temperature: number;
    precipitation: number;
  } | null;
  warnings: string[];
  actions: string[];
  recommendedPlaces: RecommendedPlace[];
};

type JourneyReport = {
  segments: RouteSegment[];
  bestRouteSummary: string;
  overallWarnings: string[];
  overallActions: string[];
  departureDate: string;
  aiRecommendations: string[];
};

export default function JourneyReportPage() {
  const { status } = useSession();
  const router = useRouter();
  const [error, setError] = useState('');
  const [reportData, setReportData] = useState<{
    report: JourneyReport | null;
    startPoint: string;
    endPoint: string;
    waypoints: string[];
    departureDate: string;
  } | null>(null);

  useEffect(() => {
    // Retrieve report data from localStorage
    const storedData = localStorage.getItem('journeyReport');
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setReportData(parsedData);
      // Clear localStorage to prevent stale data usage
      localStorage.removeItem('journeyReport');
    } else {
      setError('No journey report available. Please generate a report from the Dashboard.');
      toast.error('No journey report available.');
      router.push('/dashboard');
    }
  }, [router]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const getWeatherStyles = (condition: string | undefined) => {
    if (!condition || condition === 'Unknown') return { emoji: '⚠️', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', borderColor: 'border-yellow-300' };
    if (condition.includes('Rain')) return { emoji: '🌧️', bgColor: 'bg-blue-100', textColor: 'text-blue-800', borderColor: 'border-blue-300' };
    if (condition.includes('Cloud')) return { emoji: '☁️', bgColor: 'bg-gray-100', textColor: 'text-gray-800', borderColor: 'border-gray-300' };
    if (condition.includes('Clear')) return { emoji: '☀️', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800', borderColor: 'border-yellow-300' };
    if (condition.includes('Storm')) return { emoji: '⛈️', bgColor: 'bg-indigo-100', textColor: 'text-indigo-800', borderColor: 'border-indigo-300' };
    return { emoji: '🌍', bgColor: 'bg-gray-100', textColor: 'text-gray-800', borderColor: 'border-gray-300' };
  };

  const loadImage = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to load image:', error);
      toast.error('Failed to load image for PDF.');
      return '';
    }
  };

  const generatePDF = async () => {
    if (!reportData?.report) return;
    const doc = new jsPDF();
    let yPosition = 20;

    doc.setFontSize(24);
    doc.setTextColor(33, 150, 243);
    doc.text('Journey Report', 105, yPosition, { align: 'center' });
    yPosition += 15;
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(
      `Journey from ${reportData.startPoint} to ${reportData.endPoint}${reportData.waypoints.length ? ` via ${reportData.waypoints.join(', ')}` : ''}`,
      105,
      yPosition,
      { align: 'center' }
    );
    yPosition += 10;
    doc.text(`Departure Date: ${reportData.departureDate}`, 105, yPosition, { align: 'center' });
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(16);
    doc.setTextColor(33, 150, 243);
    doc.text('Summary', 20, yPosition);
    yPosition += 10;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(`Total Segments: ${reportData.report.segments.length}`, 20, yPosition);
    yPosition += 5;
    const totalDistance = reportData.report.segments.reduce((sum, seg) => sum + seg.distanceKm, 0);
    doc.text(`Total Distance: ${totalDistance.toFixed(2)} km`, 20, yPosition);
    yPosition += 5;
    const totalTime = reportData.report.segments.reduce((sum, seg) => sum + seg.travelTimeHours, 0);
    doc.text(`Total Travel Time: ${totalTime.toFixed(2)} hours`, 20, yPosition);
    yPosition += 15;

    for (const [index, segment] of reportData.report.segments.entries()) {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(33, 150, 243);
      doc.text(`Segment ${index + 1}: ${segment.from} to ${segment.to}`, 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPosition - 5, 170, 6, 'F');
      doc.text('Distance', 22, yPosition);
      doc.text(`${segment.distanceKm} km`, 100, yPosition);
      yPosition += 8;
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPosition - 5, 170, 6, 'F');
      doc.text('Estimated Travel Time', 22, yPosition);
      doc.text(`${segment.travelTimeHours} hours`, 100, yPosition);
      yPosition += 8;
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPosition - 5, 170, 6, 'F');
      doc.text('Best Time to Travel', 22, yPosition);
      doc.text(segment.bestTimeToTravel, 100, yPosition);
      yPosition += 10;

      doc.setFontSize(12);
      doc.setTextColor(33, 150, 243);
      doc.text(`Weather at ${segment.to}`, 20, yPosition);
      yPosition += 6;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      if (segment.weather) {
        doc.text(`Condition: ${segment.weather.condition}`, 25, yPosition);
        yPosition += 5;
        doc.text(`Temperature: ${segment.weather.temperature}°C`, 25, yPosition);
        yPosition += 5;
        doc.text(`Precipitation: ${segment.weather.precipitation}%`, 25, yPosition);
        yPosition += 5;
      } else {
        doc.text('Weather data unavailable', 25, yPosition);
        yPosition += 5;
      }

      doc.setFontSize(12);
      doc.setTextColor(244, 67, 54);
      doc.text('Warnings', 20, yPosition);
      yPosition += 6;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      if (segment.warnings.length) {
        segment.warnings.forEach((warning) => {
          const warningLines = doc.splitTextToSize(`- ${warning}`, 160);
          warningLines.forEach((line: string) => {
            doc.text(line, 25, yPosition);
            yPosition += 5;
          });
        });
      } else {
        doc.text('- None', 25, yPosition);
        yPosition += 5;
      }

      doc.setFontSize(12);
      doc.setTextColor(33, 150, 243);
      doc.text('Recommended Actions', 20, yPosition);
      yPosition += 6;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      if (segment.actions.length) {
        segment.actions.forEach((action) => {
          const actionLines = doc.splitTextToSize(`- ${action}`, 160);
          actionLines.forEach((line: string) => {
            doc.text(line, 25, yPosition);
            yPosition += 5;
          });
        });
      } else {
        doc.text('- Travel safely.', 25, yPosition);
        yPosition += 5;
      }

      doc.setFontSize(12);
      doc.setTextColor(33, 150, 243);
      doc.text('Recommended Places to Visit', 20, yPosition);
      yPosition += 6;
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      for (const place of segment.recommendedPlaces) {
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(`- ${place.name}`, 25, yPosition);
        yPosition += 5;
        const descriptionLines = doc.splitTextToSize(place.description, 150);
        descriptionLines.forEach((line: string) => {
          doc.text(line, 30, yPosition);
          yPosition += 5;
        });

        if (place.imageUrl) {
          try {
            const imgData = await loadImage(place.imageUrl);
            if (imgData) {
              doc.addImage(imgData, 'JPEG', 30, yPosition, 40, 24);
              yPosition += 28;
            }
          } catch (error) {
            doc.text('(Image unavailable)', 30, yPosition);
            yPosition += 5;
          }
        }
        yPosition += 5;
      }
      yPosition += 10;
    }

    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(16);
    doc.setTextColor(33, 150, 243);
    doc.text('Best Route Recommendation', 20, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const summaryLines = doc.splitTextToSize(reportData.report.bestRouteSummary, 170);
    summaryLines.forEach((line: string) => {
      doc.text(line, 20, yPosition);
      yPosition += 5;
    });

    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(16);
    doc.setTextColor(33, 150, 243);
    doc.text('AI-Driven Recommendations', 20, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    reportData.report.aiRecommendations.forEach((recommendation) => {
      const recLines = doc.splitTextToSize(`- ${recommendation}`, 170);
      recLines.forEach((line: string) => {
        doc.text(line, 25, yPosition);
        yPosition += 5;
      });
    });

    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(16);
    doc.setTextColor(244, 67, 54);
    doc.text('Overall Warnings', 20, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    reportData.report.overallWarnings.forEach((warning) => {
      const warningLines = doc.splitTextToSize(`- ${warning}`, 170);
      warningLines.forEach((line: string) => {
        doc.text(line, 25, yPosition);
        yPosition += 5;
      });
    });

    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
    doc.setFontSize(16);
    doc.setTextColor(33, 150, 243);
    doc.text('Overall Actions', 20, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    reportData.report.overallActions.forEach((action) => {
      const actionLines = doc.splitTextToSize(`- ${action}`, 170);
      actionLines.forEach((line: string) => {
        doc.text(line, 25, yPosition);
        yPosition += 5;
      });
    });

    return doc;
  };

  const handleDownloadPDF = async () => {
    if (!reportData?.report) {
      toast.error('No report available to download.');
      return;
    }
    toast.loading('Generating PDF...');
    try {
      const doc = await generatePDF();
      if (doc) {
        doc.save(`Journey_Report_${reportData.departureDate}.pdf`);
        toast.success('PDF downloaded successfully!');
      }
    } catch (err) {
      toast.error('Failed to download PDF.');
    }
  };

  if (status === 'loading') {
    return <div className="text-center text-gray-600">Loading...</div>;
  }

  if (!reportData?.report) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 py-10 px-6">
      <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-semibold text-gray-800">Journey Report</h3>
          <div className="space-x-3">
            <button
              onClick={handleDownloadPDF}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition duration-200"
            >
              Download PDF
            </button>
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
        {error && <p className="text-red-500 mb-4 p-3 bg-red-50 rounded-lg">{error}</p>}
        <div className="bg-blue-50 p-6 rounded-lg mb-6 shadow-md">
          <h4 className="text-lg font-semibold text-blue-800 mb-3">Journey Summary</h4>
          <p className="text-gray-700">
            <span className="font-medium">Route:</span> From <strong>{reportData.startPoint}</strong> to <strong>{reportData.endPoint}</strong>
            {reportData.waypoints.length ? ` via ${reportData.waypoints.join(', ')}` : ''} on {reportData.departureDate}.
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Total Distance:</span>{' '}
            {reportData.report.segments.reduce((sum, seg) => sum + seg.distanceKm, 0).toFixed(2)} km
          </p>
          <p className="text-gray-700">
            <span className="font-medium">Total Travel Time:</span>{' '}
            {reportData.report.segments.reduce((sum, seg) => sum + seg.travelTimeHours, 0).toFixed(2)} hours
          </p>
        </div>
        <div className="space-y-6">
          {reportData.report.segments.map((segment, index) => {
            const { emoji, bgColor, textColor, borderColor } = getWeatherStyles(segment.weather?.condition);
            return (
              <div
                key={index}
                className={`border-l-4 ${borderColor} ${bgColor} rounded-lg p-6 shadow-md transition duration-200`}
              >
                <h4 className={`text-lg font-semibold ${textColor} mb-3`}>
                  Segment {index + 1}: {segment.from} to {segment.to} {emoji}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-gray-700">
                      <span className="font-medium">Distance:</span> {segment.distanceKm} km
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Estimated Travel Time:</span> {segment.travelTimeHours} hours
                    </p>
                    <p className="text-gray-700">
                      <span className="font-medium">Best Time to Travel:</span> {segment.bestTimeToTravel}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-700 font-medium">Weather at {segment.to}:</p>
                    {segment.weather ? (
                      <ul className="list-disc ml-5 text-gray-600">
                        <li>Condition: {segment.weather.condition} {emoji}</li>
                        <li>Temperature: {segment.weather.temperature}°C</li>
                        <li>Precipitation: {segment.weather.precipitation}%</li>
                      </ul>
                    ) : (
                      <p className="text-gray-600">Weather data unavailable</p>
                    )}
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-gray-700 font-medium text-red-600">Warnings:</p>
                  {segment.warnings.length ? (
                    <ul className="list-disc ml-5 text-gray-600">
                      {segment.warnings.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">None</p>
                  )}
                </div>
                <div className="mb-4">
                  <p className="text-gray-700 font-medium">Recommended Actions:</p>
                  {segment.actions.length ? (
                    <ul className="list-disc ml-5 text-gray-600">
                      {segment.actions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">Travel safely.</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-700 font-medium">Recommended Places to Visit:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {segment.recommendedPlaces.map((place, i) => (
                      <div key={i} className="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <h5 className="text-sm font-semibold text-gray-800">{place.name}</h5>
                        <p className="text-gray-600 text-sm mt-1">{place.description}</p>
                        {place.imageUrl && (
                          <img
                            src={place.imageUrl}
                            alt={place.name}
                            className="mt-2 w-full h-32 object-cover rounded-lg"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-8 bg-gray-50 p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold text-gray-800 mb-3">Best Route Recommendation</h4>
          <p className="text-gray-600">{reportData.report.bestRouteSummary}</p>
        </div>
        <div className="mt-6 bg-blue-50 p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold text-blue-800 mb-3">AI-Driven Recommendations</h4>
          <ul className="list-disc ml-5 text-gray-600">
            {reportData.report.aiRecommendations.map((rec, i) => (
              <li key={i}>{rec}</li>
            ))}
          </ul>
        </div>
        <div className="mt-6 bg-red-50 p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold text-red-600 mb-3">Overall Warnings</h4>
          <ul className="list-disc ml-5 text-gray-600">
            {reportData.report.overallWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
        <div className="mt-6 bg-blue-50 p-6 rounded-lg shadow-md">
          <h4 className="text-lg font-semibold text-blue-800 mb-3">Overall Actions</h4>
          <ul className="list-disc ml-5 text-gray-600">
            {reportData.report.overallActions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}