import React, { useState, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Map as MapIcon, Users, Coffee, Search, 
  AlertTriangle, QrCode, Calendar, MapPin, Plus, ArrowRight,
  LogOut, Camera, CheckCircle2, Ticket, Shield, Clock,
  MapPinned, CheckSquare
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

// --- MOCK DATA & INITIAL STATE ---
const INITIAL_ZONES = {
  hackathon: { id: 'hackathon', name: 'Bid To Build (Hall A)', capacity: 500, current: 350 },
  sparx: { id: 'sparx', name: 'SPARX Ground', capacity: 2000, current: 1500 },
  food: { id: 'food', name: 'Main Food Court', capacity: 300, current: 250 },
  parking: { id: 'parking', name: 'Campus Parking', capacity: 400, current: 380 },
};

const CHART_HISTORY = [
  { time: '09:00', hackathon: 50, sparx: 100, food: 20 },
  { time: '10:00', hackathon: 200, sparx: 300, food: 80 },
  { time: '11:00', hackathon: 450, sparx: 500, food: 150 },
  { time: '12:00', hackathon: 480, sparx: 800, food: 290 },
  { time: '13:00', hackathon: 400, sparx: 1200, food: 310 }, 
  { time: '14:00', hackathon: 490, sparx: 1500, food: 180 },
];

const INITIAL_FOOD_ORDERS = [
  { id: 'ORD-001', location: 'Self Pickup - Counter 2', status: 'preparing', item: '1x Biryani Combo' },
  { id: 'ORD-002', location: 'Self Pickup - Counter 4', status: 'ready', item: '2x Energy Drinks' },
];

const INITIAL_LOST_ITEMS = [
  { id: 'L-1', type: 'Lost', item: 'Blue Backpack', location: 'SPARX Entrance', status: 'pending', time: '10:30 AM' },
  { id: 'F-1', type: 'Found', item: 'MacBook Charger', location: 'Hackathon Zone C', status: 'secured', time: '11:15 AM' },
];

const getTheme = (event) => {
  if (event === 'hackathon') {
    return {
      name: 'hackathon',
      bg: 'bg-rose-950/40',
      base: 'bg-rose-950',
      surface: 'bg-rose-900/40',
      border: 'border-rose-800',
      text: 'text-rose-100',
      textMuted: 'text-rose-300',
      accent: 'bg-rose-600',
      accentHover: 'hover:bg-rose-500',
      accentText: 'text-rose-400',
      icon: 'text-rose-300',
      heatActive: 'bg-rose-500',
      heatDim: 'bg-rose-900/50'
    };
  }
  if (event === 'sparx') {
    return {
      name: 'sparx',
      bg: 'bg-orange-950/40',
      base: 'bg-orange-950',
      surface: 'bg-orange-900/40',
      border: 'border-orange-800',
      text: 'text-orange-50',
      textMuted: 'text-orange-200',
      accent: 'bg-orange-600',
      accentHover: 'hover:bg-orange-500',
      accentText: 'text-orange-400',
      icon: 'text-orange-300',
      heatActive: 'bg-orange-500',
      heatDim: 'bg-orange-900/50'
    };
  }
  return {
    name: 'admin',
    bg: 'bg-slate-950',
    base: 'bg-slate-950',
    surface: 'bg-slate-900',
    border: 'border-slate-800',
    text: 'text-slate-100',
    textMuted: 'text-slate-400',
    accent: 'bg-indigo-600',
    accentHover: 'hover:bg-indigo-500',
    accentText: 'text-indigo-400',
    icon: 'text-indigo-400',
    heatActive: 'bg-indigo-500',
    heatDim: 'bg-slate-800'
  };
};

const getHeatColorClass = (current, capacity) => {
  const ratio = current / capacity;
  if (ratio >= 0.85) return 'bg-rose-500 border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.5)]'; // Hot/Crowded
  if (ratio >= 0.60) return 'bg-amber-500 border-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.3)]'; // Moderate
  return 'bg-emerald-500 border-emerald-400'; // Clear
};

const Card = ({ children, className = "", title, icon: Icon, theme }) => (
  <div className={`${theme.surface} rounded-xl border ${theme.border} overflow-hidden shadow-lg backdrop-blur-sm ${className}`}>
    {(title || Icon) && (
      <div className={`flex items-center justify-between p-4 border-b ${theme.border} bg-black/20`}>
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-5 h-5 ${theme.icon}`} />}
          <h3 className={`font-semibold ${theme.text}`}>{title}</h3>
        </div>
      </div>
    )}
    <div className="p-4">{children}</div>
  </div>
);

const Badge = ({ children, variant = "default" }) => {
  const variants = {
    default: "bg-slate-700 text-slate-300",
    success: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/20",
    warning: "bg-amber-500/20 text-amber-400 border border-amber-500/20",
    danger: "bg-rose-500/20 text-rose-400 border border-rose-500/20 animate-pulse",
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border uppercase tracking-wider ${variants[variant]}`}>
      {children}
    </span>
  );
};


const HackathonHeatMap = ({ zones }) => {
  const { current, capacity } = zones.hackathon;
  const ratio = current / capacity;
  const totalDisplaySeats = 200; // Visual representation
  const activeSeats = Math.round(ratio * totalDisplaySeats);

  return (
    <div className="bg-slate-950 p-6 rounded-xl border border-rose-900/50 shadow-inner relative flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-6">
        <h4 className="font-black text-rose-200 tracking-widest">BID TO BUILD - HALL A</h4>
        <div className="text-right">
          <span className={`text-xl font-bold ${ratio > 0.8 ? 'text-rose-500 animate-pulse' : 'text-rose-300'}`}>
            {current} / {capacity}
          </span>
          <span className="text-xs text-rose-400 block uppercase">Occupancy</span>
        </div>
      </div>

      {/* Stage */}
      <div className="w-2/3 h-16 bg-rose-900/30 border-t-4 border-rose-500 rounded-t-lg flex items-center justify-center mb-12 shadow-[0_-10px_20px_rgba(225,29,72,0.15)]">
        <span className="text-rose-200 font-bold tracking-widest">MAIN STAGE</span>
      </div>

      {/* Seating Heatmap */}
      <div className="w-full max-w-3xl">
        <p className="text-xs text-rose-400 mb-2 font-semibold">Audience Heatmap (Live Seating Density)</p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(12px,1fr))] gap-1.5 p-4 border border-rose-900/30 rounded-lg bg-black/40">
          {Array.from({ length: totalDisplaySeats }).map((_, i) => (
            <div 
              key={i} 
              className={`aspect-square rounded-sm transition-all duration-500 ${
                i < activeSeats 
                  ? 'bg-rose-500 shadow-[0_0_5px_rgba(225,29,72,0.6)]' // Occupied
                  : 'bg-rose-950 border border-rose-900' // Empty
              }`} 
            />
          ))}
        </div>
      </div>

      <div className="absolute bottom-4 right-4 flex items-center gap-2 text-xs font-bold text-slate-400">
        <div className="w-3 h-3 bg-rose-500 rounded-sm"></div> Occupied
        <div className="w-3 h-3 bg-rose-950 border border-rose-900 rounded-sm ml-2"></div> Empty
      </div>
    </div>
  );
};

const SparxHeatMap = ({ zones }) => {
  const { current, capacity } = zones.sparx;
  const ratio = current / capacity;
  const turfCapacity = capacity / 4;
  const currentPerTurf = Math.floor(current / 4);
  
  // Theater style seating strictly on top
  const renderTheaterSeats = (occupancyRatio) => {
    const totalSeats = 30; // Visual representation per turf
    const activeSeats = Math.round(occupancyRatio * totalSeats);
    return (
      <div className="w-full h-6 flex justify-center items-end gap-0.5 px-4 pb-1">
        {Array.from({ length: totalSeats }).map((_, i) => (
          <div 
            key={i} 
            className={`w-2 h-3 rounded-t-sm transition-all duration-500 ${
              i < activeSeats ? 'bg-orange-500' : 'bg-orange-950 border border-orange-900'
            }`} 
          />
        ))}
      </div>
    );
  };

  const turfs = [
    { name: 'FOOTBALL', heat: currentPerTurf / turfCapacity },
    { name: 'VOLLEYBALL', heat: (currentPerTurf + 50) / turfCapacity }, // Fake slight variations
    { name: 'BADMINTON', heat: (currentPerTurf - 30) / turfCapacity },
    { name: 'PICKLEBALL', heat: currentPerTurf / turfCapacity },
  ];

  return (
    <div className="bg-slate-950 p-6 rounded-xl border border-orange-900/50 shadow-inner">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-black text-orange-200 tracking-widest">SPARX TURFS</h4>
        <div className="text-right">
          <span className={`text-xl font-bold ${ratio > 0.8 ? 'text-orange-500 animate-pulse' : 'text-orange-300'}`}>
            {current} / {capacity}
          </span>
          <span className="text-xs text-orange-400 block uppercase">Total Occupancy</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {turfs.map((turf, idx) => (
          <div key={idx} className="flex flex-col bg-black/40 border border-orange-900/40 rounded-lg overflow-hidden">
            {/* Top Seating (Theater Style) */}
            <div className="bg-orange-900/10 border-b border-orange-900/30">
               {renderTheaterSeats(Math.min(1, turf.heat))}
            </div>
            {/* Playing Field */}
            <div className="h-32 bg-green-900/20 border-x-4 border-b-4 border-green-800/30 relative flex items-center justify-center">
               {/* Center line */}
               <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
               <span className="text-orange-100 font-black text-sm tracking-widest opacity-80 z-10 bg-black/50 px-2 py-1 rounded">
                 TURF {idx + 1}: {turf.name}
               </span>
               {/* Heat Overlay based on density */}
               <div className="absolute inset-0 opacity-20 pointer-events-none" 
                    style={{ backgroundColor: turf.heat > 0.8 ? '#f97316' : turf.heat > 0.5 ? '#eab308' : '#22c55e' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const FoodCourtMap = ({ zones, isAttendee = false }) => {
  const { current, capacity } = zones.food;
  const heatClass = getHeatColorClass(current, capacity);
  
  return (
    <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 shadow-inner flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <h4 className="font-black text-slate-200 tracking-widest">FOOD COURT ZONE</h4>
        <div className="text-right">
          <span className={`text-xl font-bold ${heatClass.split(' ')[0].replace('bg-', 'text-')}`}>
            {current} / {capacity}
          </span>
          <span className="text-xs text-slate-400 block uppercase">Density</span>
        </div>
      </div>

      <div className="flex-1 relative border-2 border-dashed border-slate-800 rounded-xl p-4 flex flex-col items-center justify-between min-h-[300px]">
        {/* Heat overlay indicator */}
        <div className={`absolute top-2 right-2 w-3 h-3 rounded-full ${heatClass} animate-pulse`} />

        {/* Counters */}
        <div className="w-full flex justify-around gap-2 mb-8">
          {[1,2,3,4].map(c => (
             <div key={c} className="h-12 flex-1 bg-slate-900 border border-slate-700 rounded flex items-center justify-center text-xs font-bold text-slate-400">
               CTR {c}
             </div>
          ))}
        </div>

        {/* Circular Tables Layout */}
        <div className="grid grid-cols-2 gap-8 w-full max-w-sm mx-auto mb-8 relative">
           {[
             { label: 'A', size: 'w-20 h-20' },
             { label: 'B', size: 'w-16 h-16' },
             { label: 'C', size: 'w-24 h-24' },
             { label: 'D', size: 'w-16 h-16' }
           ].map(table => (
             <div key={table.label} className="flex items-center justify-center">
               <div className={`${table.size} rounded-full border-4 flex items-center justify-center transition-colors duration-500
                    ${current / capacity > 0.8 ? 'border-rose-900 bg-rose-950' : 
                      current / capacity > 0.5 ? 'border-amber-900 bg-amber-950' : 'border-slate-800 bg-slate-900'}`}>
                 <span className="text-slate-500 font-bold text-xs">{table.label}</span>
               </div>
             </div>
           ))}
           {/* Center flow icon */}
           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
             <Users className="w-4 h-4 text-slate-400" />
           </div>
        </div>

        <div className="bg-slate-900 px-4 py-2 rounded text-xs font-bold border border-slate-800 text-slate-400">ENTRY / EXIT</div>
      </div>
    </div>
  );
};

const AdminGlobalHeatmap = ({ zones }) => {
  return (
    <div className="w-full aspect-[16/9] bg-slate-950 rounded-xl border border-slate-800 p-6 shadow-inner relative flex flex-col">
      <h3 className="font-black text-slate-300 tracking-widest mb-6">GLOBAL CAMPUS MACRO-MAP</h3>
      
      <div className="flex-1 grid grid-cols-3 grid-rows-2 gap-4">
        {/* Hackathon Zone */}
        <div className={`col-span-1 row-span-2 rounded-xl p-4 flex flex-col justify-between transition-colors duration-1000 ${getHeatColorClass(zones.hackathon.current, zones.hackathon.capacity)} bg-opacity-20 border-2`}>
          <h4 className="font-bold text-white drop-shadow-md">Hall A<br/><span className="text-sm font-normal">Bid To Build</span></h4>
          <div>
            <div className="text-3xl font-black text-white">{zones.hackathon.current}</div>
            <div className="text-sm text-white/70">/ {zones.hackathon.capacity} Seats</div>
          </div>
        </div>

        {/* Sparx Zone */}
        <div className={`col-span-2 row-span-1 rounded-xl p-4 flex flex-col justify-between transition-colors duration-1000 ${getHeatColorClass(zones.sparx.current, zones.sparx.capacity)} bg-opacity-20 border-2`}>
          <h4 className="font-bold text-white drop-shadow-md">Sports Ground<br/><span className="text-sm font-normal">SPARX</span></h4>
          <div>
            <div className="text-3xl font-black text-white">{zones.sparx.current}</div>
            <div className="text-sm text-white/70">/ {zones.sparx.capacity} Ground Cap</div>
          </div>
        </div>

        {/* Food Court */}
        <div className={`col-span-1 row-span-1 rounded-xl p-4 flex flex-col justify-between transition-colors duration-1000 ${getHeatColorClass(zones.food.current, zones.food.capacity)} bg-opacity-20 border-2`}>
          <h4 className="font-bold text-white drop-shadow-md">Food Court</h4>
          <div>
            <div className="text-2xl font-black text-white">{zones.food.current}</div>
            <div className="text-xs text-white/70">/ {zones.food.capacity}</div>
          </div>
        </div>

        {/* Parking */}
        <div className={`col-span-1 row-span-1 rounded-xl p-4 flex flex-col justify-between transition-colors duration-1000 ${getHeatColorClass(zones.parking.current, zones.parking.capacity)} bg-opacity-20 border-2`}>
          <h4 className="font-bold text-white drop-shadow-md">Campus Parking</h4>
          <div>
            <div className="text-2xl font-black text-white">{zones.parking.current}</div>
            <div className="text-xs text-white/70">/ {zones.parking.capacity} Spots</div>
          </div>
        </div>
      </div>
    </div>
  );
};


const QRScanner = ({ theme, onSuccess }) => {
  const [scanning, setScanning] = useState(false);
  const [success, setSuccess] = useState(false);

  const startScan = () => {
    setScanning(true);
    // Simulate API delay for scan
    setTimeout(() => {
      setScanning(false);
      setSuccess(true);
      setTimeout(onSuccess, 1500); // Transition after showing tick
    }, 2500);
  };

  if (success) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 border-2 border-emerald-500 bg-emerald-500/10 rounded-2xl animate-in zoom-in duration-300`}>
        <CheckCircle2 className="w-24 h-24 text-emerald-400 mb-4 animate-[bounce_1s_ease-in-out_infinite]" />
        <h3 className="text-2xl font-bold text-emerald-400">Verified!</h3>
        <p className="text-emerald-200/70 mt-2 text-center">Ticket confirmed. Opening dashboard...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center p-6 border-2 ${theme.border} ${theme.surface} rounded-2xl`}>
      {!scanning ? (
        <>
          <div className={`w-32 h-32 rounded-xl border-4 border-dashed ${theme.border} flex items-center justify-center mb-6`}>
            <QrCode className={`w-12 h-12 ${theme.icon} opacity-50`} />
          </div>
          <button 
            onClick={startScan}
            className={`w-full py-4 text-xl font-bold rounded-xl flex items-center justify-center gap-3 ${theme.accent} ${theme.accentHover} text-white shadow-lg transition-transform hover:-translate-y-1`}
          >
            <Camera className="w-6 h-6" /> Scan Entry Pass
          </button>
        </>
      ) : (
        <div className="w-full aspect-square max-w-sm bg-black rounded-xl relative overflow-hidden flex items-center justify-center">
          {/* Fake camera feed background */}
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700 via-black to-black animate-pulse" />
          
          {/* Scanner Box */}
          <div className="w-3/4 h-3/4 border-2 border-emerald-500 rounded-lg relative z-10">
            {/* Laser */}
            <div className="w-full h-1 bg-emerald-400 absolute top-0 shadow-[0_0_10px_#34d399] animate-[scan_2s_linear_infinite]" />
          </div>
          <p className="absolute bottom-4 text-emerald-400 font-bold z-10 animate-pulse">Scanning QR Code...</p>
          <style>{`
            @keyframes scan {
              0% { top: 0%; }
              50% { top: 100%; }
              100% { top: 0%; }
            }
          `}</style>
        </div>
      )}
    </div>
  );
};


const AttendeeHome = ({ theme, event, setTab }) => {
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  const schedules = {
    hackathon: [
      { time: '09:00 AM', title: 'Registration & Breakfast', done: true },
      { time: '10:00 AM', title: 'Opening Ceremony', done: true },
      { time: '11:00 AM', title: 'Hacking Begins', done: true },
      { time: '01:00 PM', title: 'Lunch at Food Court', active: true },
      { time: '06:00 PM', title: 'Project Submission', pending: true },
      { time: '07:30 PM', title: 'Closing & Awards (Ends Early)', pending: true },
    ],
    sparx: [
      { time: '09:00 AM', title: 'Opening March', done: true },
      { time: '10:30 AM', title: 'Preliminary Rounds', done: true },
      { time: '02:00 PM', title: 'Semi-Finals', active: true },
      { time: '05:00 PM', title: 'Finals (Turf 1 & 2)', pending: true },
      { time: '08:00 PM', title: 'Live Music & Celebration (Late Event)', pending: true },
    ]
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {!isCheckedIn ? (
        <Card theme={theme} className="text-center p-8">
          <h2 className={`text-3xl font-black mb-2 ${theme.text}`}>Welcome to {event === 'hackathon' ? 'Bid To Build' : 'SPARX'}!</h2>
          <p className={`${theme.textMuted} mb-8`}>Please scan your ticket at the entry gates.</p>
          <QRScanner theme={theme} onSuccess={() => setIsCheckedIn(true)} />
        </Card>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
          {/* Personalized Check-in Zone */}
          <div className={`p-6 rounded-2xl ${theme.surface} border ${theme.border} flex flex-col md:flex-row items-center gap-6 justify-between`}>
            <div>
              <p className={`text-sm uppercase tracking-widest font-bold ${theme.accentText} mb-1`}>My Check-in Zone</p>
              <h2 className={`text-3xl font-black ${theme.text} flex items-center gap-2`}>
                <MapPinned className="w-8 h-8" />
                {event === 'hackathon' ? 'Hall A - Seat Grid B' : 'Turf 2 Entrance'}
              </h2>
              <p className={`${theme.textMuted} mt-2`}>Your attendance is verified. Use the map to navigate.</p>
            </div>
            <button 
              onClick={() => setTab('map')}
              className={`px-6 py-3 rounded-xl font-bold flex items-center gap-2 ${theme.accent} ${theme.accentHover} text-white whitespace-nowrap`}
            >
              Open Live Map <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Event Schedule */}
          <Card title="Today's Schedule" icon={Clock} theme={theme}>
            <div className="relative border-l-2 border-slate-700/50 ml-4 space-y-8 py-4">
              {schedules[event].map((item, idx) => (
                <div key={idx} className="relative pl-6">
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 ${theme.base} 
                    ${item.done ? 'bg-emerald-500 border-emerald-500' : 
                      item.active ? `${theme.heatActive} border-${theme.heatActive} animate-pulse` : 
                      'bg-slate-700 border-slate-600'}`} 
                  />
                  <div className={`flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-4 
                    ${item.pending ? 'opacity-50' : 'opacity-100'}`}>
                    <h4 className={`font-bold ${item.active ? theme.text : 'text-slate-300'}`}>{item.title}</h4>
                    <span className={`text-sm font-mono ${item.active ? theme.accentText : 'text-slate-500'}`}>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

const AttendeeLostFound = ({ theme, items, setItems }) => {
  const [form, setForm] = useState({ type: 'Lost', item: '', location: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.item || !form.location) return;
    
    const newItem = {
      id: `${form.type.charAt(0)}-${Date.now().toString().slice(-4)}`,
      type: form.type,
      item: form.item,
      location: form.location,
      status: form.type === 'Lost' ? 'pending' : 'secured',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setItems([newItem, ...items]);
    setForm({ type: 'Lost', item: '', location: '' });
  };

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Form */}
      <Card title="Report Item" icon={Plus} theme={theme} className="md:col-span-1 h-fit">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-sm font-bold ${theme.textMuted} mb-2`}>I have...</label>
            <div className="flex gap-2">
              {['Lost', 'Found'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({...form, type: t})}
                  className={`flex-1 py-2 rounded-lg font-bold border ${form.type === t ? `${theme.accent} border-transparent text-white` : `bg-black/20 ${theme.border} ${theme.textMuted}`}`}
                >
                  {t} an Item
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className={`block text-sm font-bold ${theme.textMuted} mb-1`}>Item Name</label>
            <input 
              type="text" required
              value={form.item} onChange={e => setForm({...form, item: e.target.value})}
              className={`w-full bg-black/40 border ${theme.border} rounded-lg px-4 py-2 ${theme.text} focus:outline-none focus:border-${theme.name}-500`}
              placeholder="e.g. Red Wallet"
            />
          </div>
          <div>
            <label className={`block text-sm font-bold ${theme.textMuted} mb-1`}>Location</label>
            <input 
              type="text" required
              value={form.location} onChange={e => setForm({...form, location: e.target.value})}
              className={`w-full bg-black/40 border ${theme.border} rounded-lg px-4 py-2 ${theme.text} focus:outline-none focus:border-${theme.name}-500`}
              placeholder="e.g. Near Main Gate"
            />
          </div>
          <button type="submit" className={`w-full py-3 rounded-lg font-bold ${theme.accent} ${theme.accentHover} text-white mt-4`}>
            Submit Report
          </button>
        </form>
      </Card>

      {/* List */}
      <Card title="Registry" icon={Search} theme={theme} className="md:col-span-2">
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className={`p-4 rounded-xl bg-black/20 border ${theme.border} flex justify-between items-center`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg
                  ${item.type === 'Lost' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}`}>
                  {item.type.charAt(0)}
                </div>
                <div>
                  <h4 className={`font-bold text-lg ${theme.text}`}>{item.item}</h4>
                  <p className={`text-sm flex items-center gap-1 mt-0.5 ${theme.textMuted}`}>
                    <MapPin className="w-3 h-3" /> {item.location} • {item.time}
                  </p>
                </div>
              </div>
              <Badge variant={item.status === 'secured' ? 'success' : 'warning'}>
                {item.status}
              </Badge>
            </div>
          ))}
          {items.length === 0 && <p className={`${theme.textMuted} text-center py-8`}>No items reported yet.</p>}
        </div>
      </Card>
    </div>
  );
};


const AdminDashboard = ({ zones, onLogout }) => {
  const theme = getTheme('admin');
  
  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans pb-10`}>
      <header className={`${theme.surface} border-b ${theme.border} p-4 px-6 flex justify-between items-center sticky top-0 z-20 shadow-md`}>
        <div className="flex items-center gap-3">
          <Shield className="w-8 h-8 text-indigo-500" />
          <h1 className="text-xl font-black tracking-tight">Admin Console</h1>
        </div>
        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-bold transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </header>

      <main className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Top Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card theme={theme} className="border-indigo-500/30">
            <p className="text-sm font-bold text-slate-400 mb-1 uppercase tracking-wider">Total Campus Pop</p>
            <h2 className="text-4xl font-black text-white flex items-center gap-2">
              {zones.hackathon.current + zones.sparx.current + zones.food.current}
            </h2>
          </Card>
          {[zones.hackathon, zones.sparx, zones.food].map(z => (
            <Card key={z.id} theme={theme} className={z.current/z.capacity > 0.8 ? 'border-rose-500/50 bg-rose-500/5' : ''}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-slate-400 mb-1 uppercase tracking-wider">{z.name}</p>
                  <h2 className="text-3xl font-bold text-white">{z.current} <span className="text-lg text-slate-500">/ {z.capacity}</span></h2>
                </div>
                {z.current/z.capacity > 0.8 && <AlertTriangle className="w-6 h-6 text-rose-500 animate-pulse" />}
              </div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Macro Map */}
          <div className="lg:col-span-2">
            <AdminGlobalHeatmap zones={zones} />
          </div>

          {/* Chart */}
          <div className="lg:col-span-1">
             <Card title="Density Trends" icon={MapIcon} theme={theme} className="h-full min-h-[350px]">
               <ResponsiveContainer width="100%" height={300}>
                 <LineChart data={CHART_HISTORY} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                   <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                   <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                   <YAxis stroke="#64748b" fontSize={12} />
                   <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }} />
                   <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}/>
                   <Line type="monotone" dataKey="hackathon" name="Hackathon" stroke="#f43f5e" strokeWidth={2} dot={false} />
                   <Line type="monotone" dataKey="sparx" name="SPARX" stroke="#f97316" strokeWidth={2} dot={false} />
                   <Line type="monotone" dataKey="food" name="Food Court" stroke="#3b82f6" strokeWidth={2} dot={false} />
                 </LineChart>
               </ResponsiveContainer>
             </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

const AttendeeDashboard = ({ event, zones, setZones, lostItems, setLostItems, foodOrders, setFoodOrders, onLogout }) => {
  const [activeTab, setActiveTab] = useState('home');
  const theme = getTheme(event);

  return (
    <div className={`min-h-screen ${theme.bg} ${theme.text} font-sans flex flex-col pb-24 md:pb-0 relative`}>
      {/* Background Decor */}
      <div className={`fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] ${event==='hackathon'? 'from-rose-900' : 'from-orange-900'} via-transparent to-transparent`} />

      <header className={`${theme.surface} border-b ${theme.border} p-4 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md`}>
        <div>
          <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
            {event === 'hackathon' ? <LayoutDashboard className="w-5 h-5"/> : <MapIcon className="w-5 h-5"/>}
            {event === 'hackathon' ? 'Bid To Build' : 'SPARX Festival'}
          </h1>
          <p className={`text-[10px] ${theme.textMuted} uppercase tracking-widest font-bold mt-1`}>Attendee Portal</p>
        </div>
        <button onClick={onLogout} className={`p-2 ${theme.base} rounded-full border ${theme.border} hover:bg-black/30 transition-colors`}>
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 p-4 md:p-6 relative z-10 w-full max-w-7xl mx-auto">
        {activeTab === 'home' && <AttendeeHome theme={theme} event={event} setTab={setActiveTab} />}
        
        {activeTab === 'map' && (
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
            <h2 className="text-3xl font-black mb-6">Live Venue Map</h2>
            <p className={`${theme.textMuted} mb-4`}>Real-time heatmaps indicate crowd density. Red zones are currently crowded.</p>
            {event === 'hackathon' ? <HackathonHeatMap zones={zones} /> : <SparxHeatMap zones={zones} />}
          </div>
        )}

        {activeTab === 'food' && (
          <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
            <h2 className="text-3xl font-black mb-6">Food Court & Orders</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <FoodCourtMap zones={zones} isAttendee={true} />
              
              <div className="space-y-6">
                <Card title="Mobile Ordering" icon={Coffee} theme={theme}>
                  <p className={`${theme.textMuted} mb-6 text-sm`}>Skip the queue! Order here and pickup when ready.</p>
                  <button 
                    onClick={() => {
                      setFoodOrders([{
                        id: `ORD-${Math.floor(Math.random() * 9000) + 1000}`,
                        location: 'Mobile Order - Counter 1',
                        status: 'preparing',
                        item: '1x Custom Meal'
                      }, ...foodOrders]);
                    }}
                    className={`w-full py-4 text-lg font-bold rounded-xl flex items-center justify-center gap-2 ${theme.accent} ${theme.accentHover} text-white shadow-lg`}
                  >
                    <Plus className="w-5 h-5" /> Place Order
                  </button>
                </Card>

                <Card title="My Orders" icon={Ticket} theme={theme}>
                  <div className="space-y-3">
                    {foodOrders.map(order => (
                      <div key={order.id} className={`p-4 rounded-xl bg-black/30 border ${theme.border} flex justify-between items-center`}>
                        <div>
                          <h4 className="font-bold">{order.item}</h4>
                          <p className={`text-xs ${theme.textMuted}`}>{order.id} • {order.location}</p>
                        </div>
                        <Badge variant={order.status === 'ready' ? 'success' : 'warning'}>{order.status}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'lost' && (
          <div className="animate-in fade-in duration-300">
            <h2 className="text-3xl font-black mb-6">Lost & Found</h2>
            <AttendeeLostFound theme={theme} items={lostItems} setItems={setLostItems} />
          </div>
        )}
      </main>

      {/* Floating Bottom Nav */}
      <nav className={`fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-auto ${theme.surface} border ${theme.border} rounded-2xl flex justify-around md:justify-center p-2 z-30 backdrop-blur-xl shadow-2xl`}>
        {[
          { id: 'home', label: 'Pass', icon: QrCode },
          { id: 'map', label: 'Map', icon: MapIcon },
          { id: 'food', label: 'Food', icon: Coffee },
          { id: 'lost', label: 'Lost', icon: Search },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center w-16 h-14 md:w-24 md:h-16 rounded-xl transition-all ${
              activeTab === tab.id 
                ? `${theme.accent} text-white shadow-lg` 
                : `${theme.textMuted} hover:${theme.text} hover:bg-black/20`
            }`}
          >
            <tab.icon className={`w-5 h-5 md:w-6 md:h-6 mb-1 ${activeTab === tab.id ? 'text-white' : ''}`} />
            <span className="text-[10px] md:text-xs font-bold">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
};


export default function App() {
  // Global State lifted here so Admin and Attendees see the same simulated data
  const [zones, setZones] = useState(INITIAL_ZONES);
  const [lostItems, setLostItems] = useState(INITIAL_LOST_ITEMS);
  const [foodOrders, setFoodOrders] = useState(INITIAL_FOOD_ORDERS);
  
  const [auth, setAuth] = useState({ role: null, event: null, isAuthenticated: false });
  const [inputVal, setInputVal] = useState('');
  const [error, setError] = useState('');

  // Simulate real-time data fluctuations
  useEffect(() => {
    const interval = setInterval(() => {
      setZones(prev => ({
        ...prev,
        hackathon: { ...prev.hackathon, current: Math.max(100, Math.min(500, prev.hackathon.current + (Math.random() > 0.5 ? 5 : -5))) },
        sparx: { ...prev.sparx, current: Math.max(500, Math.min(2000, prev.sparx.current + (Math.random() > 0.5 ? 15 : -15))) },
        food: { ...prev.food, current: Math.max(50, Math.min(300, prev.food.current + (Math.random() > 0.5 ? 8 : -8))) },
        parking: { ...prev.parking, current: Math.max(200, Math.min(400, prev.parking.current + (Math.random() > 0.5 ? 2 : -2))) },
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    setAuth({ role: null, event: null, isAuthenticated: false });
    setInputVal('');
    setError('');
  };

  // Render Logged-in Views
  if (auth.isAuthenticated) {
    if (auth.role === 'admin') {
      return <AdminDashboard zones={zones} onLogout={handleLogout} />;
    }
    if (auth.role === 'attendee' && auth.event) {
      return (
        <AttendeeDashboard 
          event={auth.event} 
          zones={zones} setZones={setZones}
          lostItems={lostItems} setLostItems={setLostItems}
          foodOrders={foodOrders} setFoodOrders={setFoodOrders}
          onLogout={handleLogout} 
        />
      );
    }
  }

  // Render Login View
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans text-slate-200">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
      
      <div className="w-full max-w-md space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="text-center">
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">Campus Events</h1>
          <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Central OS</p>
        </div>

        {!auth.role && (
          <div className="space-y-4">
            <button 
              onClick={() => { setAuth({ ...auth, role: 'attendee' }); setError(''); }}
              className="w-full p-6 bg-slate-900 border border-slate-700 hover:border-indigo-500 rounded-2xl flex items-center gap-6 transition-all hover:bg-slate-800 shadow-xl"
            >
              <div className="w-14 h-14 bg-indigo-500/20 rounded-full flex items-center justify-center border border-indigo-500/50">
                <Users className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="text-left">
                <span className="text-xl font-bold block text-white">Attendee</span>
                <span className="text-slate-400 text-sm">Enter via Email</span>
              </div>
            </button>

            <button 
              onClick={() => { setAuth({ ...auth, role: 'admin' }); setError(''); }}
              className="w-full p-6 bg-slate-900 border border-slate-700 hover:border-emerald-500 rounded-2xl flex items-center gap-6 transition-all hover:bg-slate-800 shadow-xl"
            >
              <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-500/50">
                <Shield className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="text-left">
                <span className="text-xl font-bold block text-white">Administrator</span>
                <span className="text-slate-400 text-sm">System Access</span>
              </div>
            </button>
          </div>
        )}

        {auth.role === 'admin' && (
          <Card title="Admin Authorization" theme={getTheme('admin')}>
            <div className="space-y-4 pt-2">
              <input 
                type="password" value={inputVal} onChange={e => {setInputVal(e.target.value); setError('');}}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg text-white focus:outline-none focus:border-indigo-500"
                placeholder="Secret Code (admin123)" autoFocus
              />
              {error && <p className="text-rose-500 text-sm font-bold">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setAuth({ role: null })} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white transition-colors">Back</button>
                <button 
                  onClick={() => { inputVal === 'admin123' ? setAuth({...auth, isAuthenticated: true}) : setError('Invalid code'); }} 
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors"
                >Access</button>
              </div>
            </div>
          </Card>
        )}

        {auth.role === 'attendee' && !auth.event && (
          <Card title="Attendee Check-in" theme={getTheme('admin')}>
             <div className="space-y-4 pt-2">
              <input 
                type="email" value={inputVal} onChange={e => {setInputVal(e.target.value); setError('');}}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-lg text-white focus:outline-none focus:border-indigo-500"
                placeholder="Registered Email" autoFocus
              />
              {error && <p className="text-rose-500 text-sm font-bold">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setAuth({ role: null })} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-white transition-colors">Back</button>
                <button 
                  onClick={() => { inputVal.includes('@') ? setAuth({...auth, event: 'select'}) : setError('Enter valid email'); }} 
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors"
                >Verify</button>
              </div>
            </div>
          </Card>
        )}

        {auth.role === 'attendee' && auth.event === 'select' && (
          <div className="space-y-4 animate-in slide-in-from-right-8 duration-300">
            <h2 className="text-2xl font-black text-center mb-6 text-white">Select Your Event</h2>
            
            <button 
              onClick={() => setAuth({ ...auth, event: 'hackathon', isAuthenticated: true })}
              className="w-full p-6 bg-rose-950/50 border border-rose-800 hover:border-rose-500 rounded-2xl flex items-center gap-6 transition-all hover:bg-rose-900/50"
            >
              <div className="text-left flex-1">
                <h3 className="text-2xl font-black text-rose-200 mb-1">Bid To Build</h3>
                <p className="text-rose-400 text-sm font-bold uppercase tracking-wider">Hackathon</p>
              </div>
              <LayoutDashboard className="w-8 h-8 text-rose-500" />
            </button>

            <button 
              onClick={() => setAuth({ ...auth, event: 'sparx', isAuthenticated: true })}
              className="w-full p-6 bg-orange-950/50 border border-orange-800 hover:border-orange-500 rounded-2xl flex items-center gap-6 transition-all hover:bg-orange-900/50"
            >
              <div className="text-left flex-1">
                <h3 className="text-2xl font-black text-orange-200 mb-1">SPARX</h3>
                <p className="text-orange-400 text-sm font-bold uppercase tracking-wider">Sports Fest</p>
              </div>
              <MapIcon className="w-8 h-8 text-orange-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}