
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import { Navigation, RefreshCw, Star, ArrowRight } from 'lucide-react';
import { Bus, User, UserRole } from '../types';
import { INITIAL_BUSES, updateBusPosition } from '../services/dataService';
import { predictDelay } from '../services/geminiService';

// Fix for Leaflet icons in React
const busIcon = new L.DivIcon({
  html: `<div class="bg-teal-600 text-white p-2 rounded-full border-2 border-white shadow-lg flex items-center justify-center w-10 h-10"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg></div>`,
  className: '',
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

interface TrackingPageProps {
    user?: User;
}

const TrackingPage: React.FC<TrackingPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [buses, setBuses] = useState<Bus[]>(INITIAL_BUSES);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [aiPrediction, setAiPrediction] = useState<string>('');
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  // Simulate real-time movement
  useEffect(() => {
    const interval = setInterval(() => {
      setBuses(current => current.map(updateBusPosition));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleBusSelect = async (bus: Bus) => {
    setSelectedBus(bus);
    if (bus.status === 'Delayed') {
      setLoadingPrediction(true);
      const prediction = await predictDelay(bus.routeName, bus.status);
      setAiPrediction(prediction);
      setLoadingPrediction(false);
    } else {
      setAiPrediction('Bus is running on schedule.');
    }
  };

  const handleRouteClick = (routeId: string) => {
    navigate(`/schedule?route=${routeId}`);
  };

  const frequentRoutes = user?.frequentRoutes || [];
  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    // changed from md:flex-row to lg:flex-row to ensure tablet stays column stacked
    <div className="h-full flex flex-col lg:flex-row gap-6">
      
      {/* Map Section - Increased height for mobile visibility */}
      <div className="flex-1 bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col relative z-0 h-[65vh] min-h-[400px] lg:h-auto">
         <MapContainer 
            center={[-25.7479, 28.2293]} 
            zoom={13} 
            className="w-full h-full"
            scrollWheelZoom={true}
         >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {buses.map(bus => (
              <Marker 
                key={bus.id} 
                position={[bus.latitude, bus.longitude]} 
                icon={busIcon}
                eventHandlers={{
                  click: () => handleBusSelect(bus)
                }}
              >
              </Marker>
            ))}
         </MapContainer>
         
         <div className="absolute top-4 right-4 bg-white/90 backdrop-blur p-2 rounded-lg shadow-md z-[1000] text-xs font-semibold text-slate-600 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Updates Active
         </div>
      </div>

      {/* List Section - Will be bottom on Mobile/Tablet, Right on Desktop */}
      <div className="w-full lg:w-96 flex flex-col gap-6">
        {/* Active Fleet Section */}
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Navigation className="text-teal-600" /> Active Fleet
            </h2>
            
            <div className="space-y-3">
            {buses.map(bus => (
                <div 
                key={bus.id}
                onClick={() => handleBusSelect(bus)}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${selectedBus?.id === bus.id ? 'bg-teal-50 border-teal-500 ring-1 ring-teal-500' : 'bg-white border-slate-200'}`}
                >
                <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-700">{bus.routeName}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    bus.status === 'On Time' ? 'bg-green-100 text-green-700' : 
                    bus.status === 'Delayed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                    {bus.status}
                    </span>
                </div>
                <div className="flex items-center text-sm text-slate-500 gap-1 mb-1">
                    <Navigation size={14} /> Next: {bus.nextStop}
                </div>
                
                {selectedBus?.id === bus.id && (
                    <div className="mt-3 pt-3 border-t border-teal-100 animate-fade-in">
                    <h4 className="text-xs font-bold text-teal-800 uppercase mb-1 flex items-center gap-1">
                        <RefreshCw size={12} /> AI Status Insight
                    </h4>
                    {loadingPrediction ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                            <RefreshCw className="animate-spin" size={12} /> Analyzing traffic data...
                        </div>
                    ) : (
                        <p className="text-sm text-slate-600 italic">
                            "{aiPrediction}"
                        </p>
                    )}
                    <div className="mt-2 flex justify-between text-xs text-slate-500">
                        <span>Occupancy: {bus.occupancy}%</span>
                        <span>ID: {bus.id}</span>
                    </div>
                    </div>
                )}
                </div>
            ))}
            </div>
        </div>

        {/* Frequent Routes Section - Hide for Admins */}
        {!isAdmin && (
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Star className="text-yellow-500" fill="currentColor" /> My Frequent Routes
                </h2>
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100 p-4 min-h-[100px]">
                    {frequentRoutes.length > 0 ? (
                        frequentRoutes.map(routeId => (
                            <div 
                                key={routeId} 
                                onClick={() => handleRouteClick(routeId)}
                                className="py-3 first:pt-0 last:pb-0 flex justify-between items-center group cursor-pointer hover:bg-slate-50 transition-colors -mx-2 px-2 rounded-lg"
                                title="Click to view schedule"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-xs">
                                        {routeId}
                                    </div>
                                    <div className="text-sm font-medium text-slate-700">Route {routeId}</div>
                                </div>
                                <ArrowRight size={14} className="text-slate-300 group-hover:text-teal-500 transition-colors" />
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-slate-400 text-sm py-4">
                            No frequent routes yet.
                            <div className="text-xs mt-1">Check the schedule to add some!</div>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;
