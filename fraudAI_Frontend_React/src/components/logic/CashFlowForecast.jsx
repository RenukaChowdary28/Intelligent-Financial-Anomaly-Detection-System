import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import {
  TrendingDown, CalendarClock, AlertTriangle,
  CheckCircle2, IndianRupee, RefreshCw, Info, Zap, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Resolve Firestore Timestamp / plain object / Date ────────────────────────
function toDate(val) {
  if (!val) return null;
  if (typeof val.toDate === 'function') return val.toDate();
  if (val instanceof Date) return val;
  if (val.seconds) return new Date(val.seconds * 1000);
  return new Date(val);
}

// ── Build 30-day projection ───────────────────────────────────────────────────
function buildForecast(recurringPayments, recentTxns) {
  // Estimate average daily spend from last 30 days of OUTGOING transactions
  // Bug fix: use createdAt (not timestamp), case-insensitive status check
  const now = Date.now();
  const last30 = recentTxns.filter(t => {
    const ts = toDate(t.createdAt);
    if (!ts) return false;
    const withinWindow = (now - ts.getTime()) < 30 * 86400000;
    const isCompleted  = (t.status || '').toLowerCase() === 'completed';
    const isOutgoing   = t.type !== 'incoming';
    return withinWindow && isCompleted && isOutgoing;
  });
  const totalSpent30 = last30.reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const dailyBase = totalSpent30 / 30 || 350; // fallback ₹350/day

  // Map recurring payments to scheduled dates in next 30 days
  const scheduled = [];
  recurringPayments
    .filter(p => p.isActive)
    .forEach(p => {
      const amt = parseFloat(p.amount) || 0;
      if (!amt) return;
      const freq = p.frequency || 'monthly';
      let intervalDays = 30;
      if (freq === 'daily')   intervalDays = 1;
      if (freq === 'weekly')  intervalDays = 7;
      if (freq === 'monthly') intervalDays = 30;

      let next = p.nextRun?.toDate?.() || new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date(Date.now() + i * 86400000);
        const diff = Math.abs(d - next) / 86400000;
        if (diff < 1) {
          scheduled.push({ day: i, amount: amt, label: p.recipientUPI || 'Recurring', freq });
        }
      }
    });

  // Build daily projection
  let balance = 0; // relative starting point (we don't know real balance)
  const data = [];
  for (let day = 0; day < 30; day++) {
    const date = new Date(Date.now() + day * 86400000);
    const dayScheduled = scheduled.filter(s => s.day === day);
    const scheduledAmt = dayScheduled.reduce((s, p) => s + p.amount, 0);
    const totalOutflow = dailyBase + scheduledAmt;

    balance -= totalOutflow;

    data.push({
      day: day + 1,
      label: date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      balance: Math.round(balance),
      daily: Math.round(dailyBase),
      scheduled: Math.round(scheduledAmt),
      total: Math.round(totalOutflow),
      hasScheduled: dayScheduled.length > 0,
      scheduledItems: dayScheduled,
      isDanger: balance < -dailyBase * 7,
    });
  }
  return { data, dailyBase, scheduledCount: scheduled.length };
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO_RECURRING = [
  { isActive: true, amount: 649,  recipientUPI: 'netflix@icici', frequency: 'monthly', nextRun: { toDate: () => new Date(Date.now() + 5 * 86400000) } },
  { isActive: true, amount: 999,  recipientUPI: 'gym@paytm',     frequency: 'monthly', nextRun: { toDate: () => new Date(Date.now() + 12 * 86400000) } },
  { isActive: true, amount: 119,  recipientUPI: 'spotify@ybl',   frequency: 'monthly', nextRun: { toDate: () => new Date(Date.now() + 18 * 86400000) } },
  { isActive: true, amount: 299,  recipientUPI: 'cloud@amazon',  frequency: 'monthly', nextRun: { toDate: () => new Date(Date.now() + 25 * 86400000) } },
];

const fmt = n => Number(Math.abs(n)).toLocaleString('en-IN', { maximumFractionDigits: 0 });

// ── Custom tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="bg-gray-900 border border-white/[0.07] rounded-xl p-3 text-xs shadow-xl min-w-[160px]">
      <p className="text-slate-400 mb-2 font-medium">{d?.label}</p>
      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-slate-500">Base spend</span>
          <span className="text-white">₹{fmt(d?.daily)}</span>
        </div>
        {d?.scheduled > 0 && (
          <div className="flex justify-between gap-4">
            <span className="text-amber-400">Scheduled</span>
            <span className="text-amber-300">₹{fmt(d?.scheduled)}</span>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-white/[0.07] pt-1 mt-1">
          <span className="text-slate-400">Net flow</span>
          <span className={d?.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}>
            {d?.balance >= 0 ? '+' : ''}₹{fmt(d?.balance)}
          </span>
        </div>
      </div>
      {d?.scheduledItems?.length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/[0.07] space-y-0.5">
          {d.scheduledItems.map((s, i) => (
            <p key={i} className="text-amber-300">⚡ {s.label} ₹{fmt(s.amount)}</p>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function CashFlowForecast() {
  const navigate = useNavigate();
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState(null);
  const [isDemo, setIsDemo]   = useState(false);

  useEffect(() => { const u = onAuthStateChanged(auth, setUser); return u; }, []);

  const load = async (uid) => {
    setLoading(true);
    try {
      const [recSnap, txnSnap] = await Promise.all([
        getDocs(query(collection(db, 'recurringPayments'), where('userId', '==', uid))),
        getDocs(query(collection(db, 'transactions'),      where('userId', '==', uid))),
      ]);
      const recurring = recSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const txns      = txnSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      const hasRealData = recurring.length > 0 || txns.length > 0;
      const fc = buildForecast(
        recurring.length > 0 ? recurring : DEMO_RECURRING,
        txns,
      );
      setForecast(fc);
      // Only show demo banner when user has NO transactions AND no recurring payments
      setIsDemo(!hasRealData);
    } catch {
      setForecast(buildForecast(DEMO_RECURRING, []));
      setIsDemo(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user) load(user.uid);
    else { setForecast(buildForecast(DEMO_RECURRING, [])); setIsDemo(true); setLoading(false); }
  }, [user]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <CalendarClock className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
        <p className="text-slate-400 text-sm">Building your 30-day forecast…</p>
      </div>
    </div>
  );

  if (!forecast) return null;

  const { data, dailyBase, scheduledCount } = forecast;
  const dangerDays   = data.filter(d => d.isDanger).length;
  const totalOutflow = data.reduce((s, d) => s + d.total, 0);
  const peakDay      = data.reduce((max, d) => d.total > max.total ? d : max, data[0]);
  const scheduledTotal = data.reduce((s, d) => s + d.scheduled, 0);

  // Determine chart gradient (red if many danger days)
  const gradientColor = dangerDays > 10 ? '#ef4444' : dangerDays > 5 ? '#f59e0b' : '#3b82f6';

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.1] transition-all flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <CalendarClock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">30-Day Cash Flow Forecast</h1>
            <p className="text-xs text-slate-400">Predictive spending trajectory for the next month</p>
          </div>
        </div>
        {user && (
          <Button onClick={() => load(user.uid)} variant="ghost" size="sm"
            className="text-slate-400 hover:text-white gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </Button>
        )}
      </div>

      {isDemo && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-3 py-2.5 bg-amber-900/20 border border-amber-700/30 rounded-xl text-xs text-amber-300">
          <Info className="w-3.5 h-3.5 shrink-0" />
          Showing sample forecast — set up recurring payments and transactions for your real data.
        </motion.div>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Avg Daily Spend',   value: `₹${fmt(dailyBase)}`,      Icon: TrendingDown, color: 'text-cyan-400' },
          { label: 'Scheduled Bills',   value: `₹${fmt(scheduledTotal)}`,  Icon: CalendarClock, color: 'text-amber-400' },
          { label: '30-Day Outflow',    value: `₹${fmt(totalOutflow)}`,   Icon: IndianRupee,  color: 'text-red-400' },
          { label: 'Danger Days',       value: dangerDays,                  Icon: AlertTriangle, color: dangerDays > 5 ? 'text-red-400' : 'text-emerald-400' },
        ].map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-gray-900 border border-white/[0.05] rounded-2xl p-4">
            <c.Icon className={`w-4 h-4 ${c.color} mb-2`} />
            <p className="text-xl font-bold text-white">{c.value}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{c.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Area Chart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-gray-900 border border-white/[0.05] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold text-white">Cumulative Spending Curve</p>
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-400 inline-block" /> Daily</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-amber-400 inline-block" /> Scheduled</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
            <defs>
              <linearGradient id="balGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={gradientColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={gradientColor} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#6b7280' }}
              tickFormatter={(v, i) => i % 5 === 0 ? v : ''} />
            <YAxis tick={{ fontSize: 9, fill: '#6b7280' }}
              tickFormatter={v => `₹${Math.abs(v) >= 1000 ? `${(Math.abs(v)/1000).toFixed(0)}k` : Math.abs(v)}`} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#374151" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="balance" stroke={gradientColor} strokeWidth={2}
              fill="url(#balGrad)" />
          </AreaChart>
        </ResponsiveContainer>
        <p className="text-xs text-slate-500 mt-2 text-center">Cumulative net cash flow relative to today (negative = total spent)</p>
      </motion.div>

      {/* Upcoming scheduled payments */}
      {scheduledCount > 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-gray-900 border border-white/[0.05] rounded-2xl p-5">
          <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> Upcoming Scheduled Payments
          </p>
          <div className="space-y-2">
            {data.filter(d => d.hasScheduled).map(d => (
              d.scheduledItems.map((item, i) => (
                <div key={`${d.day}-${i}`}
                  className="flex items-center justify-between py-2.5 px-3 bg-gray-800/60 rounded-xl text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-white">{item.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-300 font-semibold">₹{fmt(item.amount)}</span>
                    <span className="text-slate-500 text-xs ml-2">{d.label}</span>
                  </div>
                </div>
              ))
            ))}
          </div>
        </motion.div>
      )}

      {/* Danger alert */}
      {dangerDays > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="flex items-start gap-3 p-4 bg-red-900/20 border border-red-700/30 rounded-2xl">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-200">Cash Flow Warning</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Your spending trajectory shows {dangerDays} days with high outflow risk.
              Consider reducing discretionary spending or delaying non-essential purchases.
            </p>
          </div>
        </motion.div>
      )}

      {dangerDays === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}
          className="flex items-center gap-3 p-4 bg-emerald-900/20 border border-emerald-700/30 rounded-2xl">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-emerald-200">Healthy Cash Flow</p>
            <p className="text-xs text-slate-400 mt-0.5">Your spending pattern looks manageable over the next 30 days.</p>
          </div>
        </motion.div>
      )}

      {/* Peak spend day */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="flex items-center gap-3 p-4 bg-gray-900 border border-white/[0.05] rounded-2xl text-xs text-slate-400">
        <Info className="w-4 h-4 text-cyan-400 shrink-0" />
        <p>Peak outflow day: <span className="text-white font-semibold">{peakDay?.label}</span> — ₹{fmt(peakDay?.total)} (includes ₹{fmt(peakDay?.scheduled)} in scheduled bills). Plan ahead.</p>
      </motion.div>
    </div>
  );
}
