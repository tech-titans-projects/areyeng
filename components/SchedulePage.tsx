
import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Filter, ChevronDown, TicketCheck, CheckCircle, X } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { SCHEDULES, ROUTES_INFO } from '../services/dataService';
import { dbService } from '../services/dbService';
import { User, Booking } from '../types';

interface SchedulePageProps {
  user?: User;
}

const SchedulePage: React.FC<SchedulePageProps> = ({ user }) => {
  const [searchParams] = useSearchParams();
  const [selectedRoute, setSelectedRoute] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState<string | null>(null);
  
  // Modal State
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastBooking, setLastBooking] = useState<Booking | null>(null);

  // Initialize from URL params
  useEffect(() => {
    const routeParam = searchParams.get('route');
    if (routeParam) {
      setSelectedRoute(routeParam);
    }
  }, [searchParams]);

  const handleRouteSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const routeId = e.target.value;
    setSelectedRoute(routeId);
    if (user && routeId) {
        dbService.addFrequentRoute(user.id, routeId);
    }
  };

  const handleBookRide = async (scheduleItem: any) => {
    if (!user) return;
    setBookingLoading(scheduleItem.id);
    
    const booking: Booking = {
        id: crypto.randomUUID(),
        userId: user.id,
        routeId: scheduleItem.routeId,
        routeName: ROUTES_INFO.find(r => r.id === scheduleItem.routeId)?.label || scheduleItem.routeId,
        stopName: scheduleItem.stopName,
        time: scheduleItem.departureTime,
        createdAt: new Date().toISOString()
    };

    try {
        await dbService.createBooking(booking);
        setLastBooking(booking);
        setShowSuccessModal(true);
    } catch (error) {
        alert("Failed to book ride. Please try again.");
    } finally {
        setBookingLoading(null);
    }
  };

  const filteredSchedules = selectedRoute 
    ? SCHEDULES.filter(s => s.routeId === selectedRoute) 
    : [];

  const selectedRouteLabel = ROUTES_INFO.find(r => r.id === selectedRoute)?.label;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 relative">
      <div className="mb-4">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Bus Schedule</h2>
        <p className="text-slate-500">View departure times and book your seat.</p>
      </div>

      {/* Route Selector Dropdown */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <label className="block text-slate-700 font-semibold mb-2 flex items-center gap-2">
            <Filter size={18} className="text-teal-600" />
            Select Trip (Start to End)
        </label>
        <div className="relative">
            <select
                value={selectedRoute}
                onChange={handleRouteSelect}
                className="w-full appearance-none px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition text-slate-700 font-medium cursor-pointer"
            >
                <option value="">-- Choose a Route --</option>
                {ROUTES_INFO.map(route => (
                    <option key={route.id} value={route.id}>
                        {route.label}
                    </option>
                ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none" size={20} />
        </div>
      </div>

      {/* Schedule Table */}
      {selectedRoute ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in-up">
            <div className="p-4 bg-teal-50 border-b border-teal-100 flex justify-between items-center">
                <div>
                    <h3 className="font-bold text-teal-800 text-lg">{selectedRouteLabel}</h3>
                    <span className="text-xs text-teal-600">Route ID: {selectedRoute}</span>
                </div>
                <span className="text-xs font-medium bg-white text-teal-600 px-2 py-1 rounded border border-teal-200 shadow-sm">Standard Service</span>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="p-4 font-semibold text-slate-700">Station / Stop</th>
                    <th className="p-4 font-semibold text-slate-700">Arrival</th>
                    <th className="p-4 font-semibold text-slate-700">Departure</th>
                    <th className="p-4 font-semibold text-slate-700 text-right">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredSchedules.map((item) => (
                    <tr key={item.id} className="hover:bg-teal-50/50 transition-colors">
                        <td className="p-4 flex items-center gap-2 text-slate-700 whitespace-nowrap">
                        <MapPin size={16} className="text-slate-400" />
                        {item.stopName}
                        </td>
                        <td className="p-4 text-slate-600 font-mono">{item.arrivalTime}</td>
                        <td className="p-4 text-slate-600 font-mono">{item.departureTime}</td>
                        <td className="p-4 text-right">
                            <button
                                onClick={() => handleBookRide(item)}
                                disabled={bookingLoading === item.id}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                {bookingLoading === item.id ? (
                                    'Booking...'
                                ) : (
                                    <>
                                        <TicketCheck size={16} /> Book
                                    </>
                                )}
                            </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
      ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 text-slate-400 flex flex-col items-center">
              <div className="bg-slate-50 p-4 rounded-full mb-3">
                  <Calendar className="h-8 w-8 text-slate-300" />
              </div>
              <p>Please select a trip from the menu above to see the timetable.</p>
          </div>
      )}

      {/* Booking Success Modal */}
      {showSuccessModal && lastBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in-up transform transition-all scale-100">
                <div className="bg-teal-600 p-6 flex flex-col items-center text-white">
                    <div className="bg-white p-3 rounded-full mb-3">
                        <CheckCircle size={32} className="text-teal-600" />
                    </div>
                    <h3 className="text-xl font-bold">Booking Confirmed!</h3>
                    <p className="text-teal-100 text-sm">Your seat has been reserved.</p>
                </div>
                
                <div className="p-6 space-y-4">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500 text-sm">Route</span>
                        <span className="font-semibold text-slate-800 text-right">{lastBooking.routeName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500 text-sm">Station</span>
                        <span className="font-semibold text-slate-800 text-right">{lastBooking.stopName}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                        <span className="text-slate-500 text-sm">Departure</span>
                        <span className="font-bold text-teal-600 text-lg">{lastBooking.time}</span>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100">
                    <button 
                        onClick={() => setShowSuccessModal(false)}
                        className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors shadow-lg shadow-slate-800/20"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
