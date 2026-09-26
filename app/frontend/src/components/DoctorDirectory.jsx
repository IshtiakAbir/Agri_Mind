/**
 * =============================================================================
 * Module: Doctor Directory & Appointment Booking
 * Component: /app/frontend/src/components/DoctorDirectory.jsx
 * Description: Search/filter poultry veterinarians by district, book video
 *              or farm visit appointments. View and manage appointments.
 * =============================================================================
 */

import React, { useState, useEffect, useContext } from 'react';
import {
  Search, MapPin, Star, Phone, Video, Truck, Calendar,
  Clock, ChevronDown, X, CheckCircle2, AlertCircle, RefreshCw,
  User, Filter, ArrowRight, FileText, Stethoscope, Award,
  Globe, DollarSign, BookOpen
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

export default function DoctorDirectory() {
  const { user } = useContext(AuthContext);
  const [doctors, setDoctors] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState('directory'); // 'directory' | 'appointments'
  const [appointments, setAppointments] = useState([]);
  const [loadingAppts, setLoadingAppts] = useState(false);

  // Booking modal state
  const [bookingDoctor, setBookingDoctor] = useState(null);
  const [bookingType, setBookingType] = useState('video');
  const [bookingForm, setBookingForm] = useState({
    scheduledAt: '',
    farmAddress: '',
    preferredDateWindow: '',
    notes: ''
  });
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    fetchDoctors();
  }, [selectedDistrict, searchQuery]);

  useEffect(() => {
    if (activeView === 'appointments') fetchAppointments();
  }, [activeView]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDistrict) params.append('district', selectedDistrict);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('limit', '50');
      const res = await fetch(`/api/doctors?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setDoctors(data.doctors || []);
        if (data.districts) setDistricts(data.districts);
      }
    } catch { setDoctors([]); }
    finally { setLoading(false); }
  };

  const fetchAppointments = async () => {
    setLoadingAppts(true);
    try {
      const res = await fetch('/api/doctors/appointments/my');
      const data = await res.json();
      if (data.success) setAppointments(data.appointments || []);
    } catch { setAppointments([]); }
    finally { setLoadingAppts(false); }
  };

  const handleBook = async () => {
    setBookingSubmitting(true);
    try {
      const body = {
        doctorId: bookingDoctor._id,
        farmerId: user?.id || 'guest',
        type: bookingType,
        scheduledAt: bookingForm.scheduledAt || null,
        farmAddress: bookingForm.farmAddress,
        preferredDateWindow: bookingForm.preferredDateWindow,
        notes: bookingForm.notes
      };
      const res = await fetch('/api/doctors/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        setBookingSuccess(true);
        setTimeout(() => {
          setBookingDoctor(null);
          setBookingSuccess(false);
          setBookingForm({ scheduledAt: '', farmAddress: '', preferredDateWindow: '', notes: '' });
        }, 2000);
      }
    } catch {}
    finally { setBookingSubmitting(false); }
  };

  const cancelAppointment = async (id) => {
    try {
      await fetch(`/api/doctors/appointments/${id}`, { method: 'DELETE' });
      fetchAppointments();
    } catch {}
  };

  const statusColors = {
    pending: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    confirmed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    completed: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    cancelled: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/95 via-slate-900/70 to-blue-950/30 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Stethoscope className="w-3.5 h-3.5" /> Poultry Veterinarian Directory
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-blue-200 to-cyan-400">
            Find a Poultry Doctor
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-2xl">
            Search veterinarians across all 64 districts of Bangladesh. Book video consultations or farm visit appointments.
          </p>
          <p className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg inline-block">
            ⚠️ Demo Data — Doctor profiles shown are synthetic placeholders for development purposes only.
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('directory')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeView === 'directory'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-slate-950 shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-1.5"><Search className="w-3.5 h-3.5" /> Find Doctors</span>
        </button>
        <button
          onClick={() => setActiveView('appointments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeView === 'appointments'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-slate-950 shadow-md'
              : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> My Appointments ({appointments.length})</span>
        </button>
      </div>

      {activeView === 'directory' && (
        <>
          {/* Search & Filter Bar */}
          <div className="glass-panel rounded-2xl p-4 border border-slate-800 flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, district, or specialty..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="relative w-full sm:w-64">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400" />
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500 appearance-none"
              >
                <option value="">All Districts (64)</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
          </div>

          {/* Results */}
          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto" />
              <p className="text-sm text-slate-400 mt-3">Searching doctors...</p>
            </div>
          ) : doctors.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 border border-slate-800 text-center space-y-3">
              <Stethoscope className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400 font-semibold">No doctors found matching your criteria.</p>
              <p className="text-xs text-slate-500">Try a different district or search term.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {doctors.map(doc => (
                <div key={doc._id} className="glass-panel rounded-2xl border border-slate-800 hover:border-blue-500/40 transition-all duration-300 overflow-hidden group">
                  <div className="p-5 space-y-4">
                    {/* Doctor Info */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-slate-100 truncate">{doc.name}</h4>
                        <p className="text-[11px] text-blue-300">{doc.specialty}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="flex items-center gap-0.5 text-[10px] text-amber-400">
                            <Star className="w-3 h-3 fill-amber-400" /> {doc.rating}
                          </span>
                          <span className="text-[10px] text-slate-500">({doc.totalReviews} reviews)</span>
                        </div>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-[11px]">
                      <div className="flex items-center gap-2 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{doc.district} District</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Award className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                        <span>{doc.qualification} • {doc.yearsOfExperience} yrs experience</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-300">
                        <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{doc.languages.join(', ')}</span>
                      </div>
                    </div>

                    {/* Fees */}
                    <div className="flex gap-2">
                      <div className="flex-1 p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center">
                        <Video className="w-3.5 h-3.5 text-blue-400 mx-auto" />
                        <p className="text-[10px] text-slate-400 mt-1">Video</p>
                        <p className="text-sm font-bold text-blue-300">৳{doc.consultationFee.video}</p>
                      </div>
                      <div className="flex-1 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                        <Truck className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                        <p className="text-[10px] text-slate-400 mt-1">Farm Visit</p>
                        <p className="text-sm font-bold text-emerald-300">৳{doc.consultationFee.farmVisit}</p>
                      </div>
                    </div>

                    {/* Book Button */}
                    <button
                      onClick={() => {
                        setBookingDoctor(doc);
                        setBookingType('video');
                        setBookingSuccess(false);
                      }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-slate-950 text-xs font-bold hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Calendar className="w-3.5 h-3.5" /> Book Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* My Appointments View */}
      {activeView === 'appointments' && (
        <div className="space-y-4">
          {loadingAppts ? (
            <div className="text-center py-12">
              <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mx-auto" />
              <p className="text-sm text-slate-400 mt-2">Loading appointments...</p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="glass-panel rounded-2xl p-12 border border-slate-800 text-center space-y-3">
              <Calendar className="w-10 h-10 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400 font-semibold">No appointments yet.</p>
              <p className="text-xs text-slate-500">Find a doctor and book your first appointment.</p>
              <button
                onClick={() => setActiveView('directory')}
                className="mt-2 px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold"
              >
                Browse Doctors
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {appointments.map(appt => (
                <div key={appt._id} className="glass-panel rounded-2xl p-5 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      appt.type === 'video' ? 'bg-blue-500/10 border-blue-500/20' : 'bg-emerald-500/10 border-emerald-500/20'
                    }`}>
                      {appt.type === 'video' ? <Video className="w-5 h-5 text-blue-400" /> : <Truck className="w-5 h-5 text-emerald-400" />}
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-slate-100">{appt.doctorName}</p>
                      <p className="text-[11px] text-slate-400">
                        {appt.doctorDistrict} • {appt.type === 'video' ? 'Video Consultation' : 'Farm Visit'}
                      </p>
                      {appt.scheduledAt && (
                        <p className="text-[11px] text-cyan-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {new Date(appt.scheduledAt).toLocaleString()}
                        </p>
                      )}
                      {appt.notes && (
                        <p className="text-[10px] text-slate-500 italic">Note: {appt.notes}</p>
                      )}
                      <p className="text-[10px] text-slate-500">Fee: ৳{appt.fee} • Created: {new Date(appt.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusColors[appt.status]}`}>
                      {appt.status.charAt(0).toUpperCase() + appt.status.slice(1)}
                    </span>
                    {appt.status !== 'cancelled' && appt.status !== 'completed' && (
                      <button
                        onClick={() => cancelAppointment(appt._id)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold hover:bg-rose-500/20 transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-3xl p-6 border border-blue-500/30 max-w-md w-full space-y-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            {bookingSuccess ? (
              <div className="text-center py-8 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
                <h3 className="text-lg font-bold text-emerald-300">Appointment Booked!</h3>
                <p className="text-xs text-slate-400">Your appointment with {bookingDoctor.name} has been created.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-slate-100">Book Appointment</h3>
                  <button onClick={() => setBookingDoctor(null)} className="text-slate-400 hover:text-slate-200">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Doctor Summary */}
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-100">{bookingDoctor.name}</p>
                    <p className="text-[11px] text-slate-400">{bookingDoctor.district} • {bookingDoctor.specialty}</p>
                  </div>
                </div>

                {/* Type Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Appointment Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setBookingType('video')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        bookingType === 'video'
                          ? 'bg-blue-500/15 border-blue-500/50 text-blue-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Video className="w-5 h-5 mx-auto" />
                      <p className="text-xs font-bold mt-1">Video Call</p>
                      <p className="text-[10px] mt-0.5">৳{bookingDoctor.consultationFee.video}</p>
                    </button>
                    <button
                      onClick={() => setBookingType('farm_visit')}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        bookingType === 'farm_visit'
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <Truck className="w-5 h-5 mx-auto" />
                      <p className="text-xs font-bold mt-1">Farm Visit</p>
                      <p className="text-[10px] mt-0.5">৳{bookingDoctor.consultationFee.farmVisit}</p>
                    </button>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Preferred Date & Time</label>
                    <input
                      type="datetime-local"
                      value={bookingForm.scheduledAt}
                      onChange={(e) => setBookingForm(prev => ({...prev, scheduledAt: e.target.value}))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 mt-1 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {bookingType === 'farm_visit' && (
                    <>
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Farm Address *</label>
                        <textarea
                          value={bookingForm.farmAddress}
                          onChange={(e) => setBookingForm(prev => ({...prev, farmAddress: e.target.value}))}
                          placeholder="Full farm address including village, union, upazila..."
                          rows={2}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 mt-1 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300">Preferred Date Window</label>
                        <input
                          type="text"
                          value={bookingForm.preferredDateWindow}
                          onChange={(e) => setBookingForm(prev => ({...prev, preferredDateWindow: e.target.value}))}
                          placeholder="e.g. Weekday mornings, or Oct 1-5"
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 mt-1 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-slate-300">Notes (optional)</label>
                    <textarea
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm(prev => ({...prev, notes: e.target.value}))}
                      placeholder="Describe symptoms, attach recent diagnosis, etc..."
                      rows={2}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 mt-1 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <button
                  onClick={handleBook}
                  disabled={bookingSubmitting || (bookingType === 'farm_visit' && !bookingForm.farmAddress)}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-slate-950 font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {bookingSubmitting ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Booking...</>
                  ) : (
                    <><CheckCircle2 className="w-4 h-4" /> Confirm Booking — ৳{bookingType === 'video' ? bookingDoctor.consultationFee.video : bookingDoctor.consultationFee.farmVisit}</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
