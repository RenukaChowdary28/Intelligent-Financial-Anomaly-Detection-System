import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';
import {
  Brain, RefreshCw, Info, Star, TrendingDown,
  Moon, Zap, Target, Sparkles, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Personality archetypes ─────────────────────────────────────────────────────
const ARCHETYPES = {
  nightOwl: {
    name: 'Night Owl Buyer',
    emoji: '🦉',
    tagline: 'You live in the dark hours',
    color: '#7c3aed',
    gradient: 'from-violet-900 to-indigo-900',
    border: 'border-violet-700/40',
    strengths: ['Avoids impulse buying during busy daytime', 'Often catches late-night deals', 'Lower social pressure to spend'],
    blindspots: ['Fatigue-driven impulse purchases late at night', 'Harder to dispute charges at odd hours', 'May miss business-hours-only offers'],
    tips: ['Set a spending curfew after midnight', 'Use cart wishlists — sleep on it before buying', 'Enable bank spending alerts for night hours'],
  },
  weekendWarrior: {
    name: 'Weekend Warrior',
    emoji: '⚔️',
    tagline: 'You save up and splurge on weekends',
    color: '#f59e0b',
    gradient: 'from-amber-900 to-orange-900',
    border: 'border-amber-700/40',
    strengths: ['Controlled weekday spending', 'Weekend experiences create lasting memories', 'Natural budget cycle'],
    blindspots: ['Weekend emotional spending spikes', 'FOMO-driven purchases on Saturday nights', 'Harder to track cumulative weekend outflows'],
    tips: ['Set a "weekend budget" envelope each Friday', 'Review Sunday what you spent Saturday', 'Avoid shopping apps after social outings'],
  },
  impulseEngine: {
    name: 'Impulse Engine',
    emoji: '⚡',
    tagline: 'You act fast and think later',
    color: '#ef4444',
    gradient: 'from-red-900 to-rose-900',
    border: 'border-red-700/40',
    strengths: ['Quick decision maker', 'Never misses a time-sensitive deal', 'High transaction diversity'],
    blindspots: ['Frequent small leaks add up fast', 'Buyer\'s remorse common', 'Hard to build savings momentum'],
    tips: ['Add a 15-minute "cooling off" rule for purchases over ₹500', 'Auto-save 10% of every incoming transfer', 'Review your last 10 transactions weekly'],
  },
  strategicSaver: {
    name: 'Strategic Saver',
    emoji: '🎯',
    tagline: 'Deliberate, intentional, disciplined',
    color: '#10b981',
    gradient: 'from-emerald-900 to-teal-900',
    border: 'border-emerald-700/40',
    strengths: ['High savings rate', 'Low transaction noise', 'Clear financial priorities'],
    blindspots: ['May miss spontaneous opportunities', 'Occasional large splurge after long restraint', 'Under-invests in experiences'],
    tips: ['Allocate a guilt-free "fun fund" each month', 'Automate savings so you can spend the rest freely', 'Track goals visually — celebrate milestones'],
  },
  microMaster: {
    name: 'Micro Transaction Master',
    emoji: '🔬',
    tagline: 'Many small moves, always in motion',
    color: '#3b82f6',
    gradient: 'from-blue-900 to-cyan-900',
    border: 'border-blue-700/40',
    strengths: ['Spreads risk across many small payments', 'Rarely commits to large irreversible buys', 'Comfortable with digital payments'],
    blindspots: ['Death by a thousand cuts — small amounts add up', 'Difficult to track individual expense categories', 'Subscription fatigue'],
    tips: ['Use a monthly spending dump — list every ₹ spent', 'Set category budgets not transaction limits', 'Consolidate micro-subscriptions into bundles'],
  },
  balancedPlanner: {
    name: 'Balanced Planner',
    emoji: '⚖️',
    tagline: 'Steady, consistent, and reliable',
    color: '#06b6d4',
    gradient: 'from-cyan-900 to-blue-900',
    border: 'border-cyan-700/40',
    strengths: ['Predictable spending rhythm', 'Low financial anxiety', 'Good mix of saving and spending'],
    blindspots: ['May become complacent about optimization', 'Slower to adapt to changing financial situations', 'Occasionally misses high-return opportunities'],
    tips: ['You\'re doing well — focus on investing the surplus', 'Increase savings rate by 1% every quarter', 'Explore index funds or recurring SIPs'],
  },
};

// ── Classify archetype from transaction data ──────────────────────────────────
function classify(transactions) {
  if (!transactions.length) return 'balancedPlanner';

  const hours   = Array(24).fill(0);
  const days    = Array(7).fill(0);
  const amounts = [];

  transactions.forEach(t => {
    const ts = t.timestamp?.toDate?.() || new Date(t.timestamp || 0);
    hours[ts.getHours()]++;
    days[ts.getDay()]++;
    const a = parseFloat(t.amount) || 0;
    if (a > 0) amounts.push(a);
  });

  const total = transactions.length;
  const nightTxns   = hours.slice(21).concat(hours.slice(0, 5)).reduce((s, v) => s + v, 0);
  const weekendTxns = (days[0] + days[6]) / total;
  const nightRatio  = nightTxns / total;
  const avgAmount   = amounts.length ? amounts.reduce((s, v) => s + v, 0) / amounts.length : 0;
  const txnPerDay   = total / 30;

  if (nightRatio > 0.35)           return 'nightOwl';
  if (weekendTxns > 0.45)          return 'weekendWarrior';
  if (txnPerDay > 4)               return 'impulseEngine';
  if (avgAmount > 5000 && txnPerDay < 1) return 'strategicSaver';
  if (avgAmount < 300 && txnPerDay > 2)  return 'microMaster';
  return 'balancedPlanner';
}

// Build radar dimensions for the archetype
function buildRadar(transactions, archetype) {
  const total   = transactions.length || 1;
  const hours   = Array(24).fill(0);
  const days    = Array(7).fill(0);
  const amounts = [];
  transactions.forEach(t => {
    const ts = t.timestamp?.toDate?.() || new Date(t.timestamp || 0);
    hours[ts.getHours()]++;
    days[ts.getDay()]++;
    const a = parseFloat(t.amount) || 0;
    if (a > 0) amounts.push(a);
  });

  const nightR   = Math.round((hours.slice(21).concat(hours.slice(0, 5)).reduce((s,v)=>s+v,0)/total)*100);
  const weekendR = Math.round(((days[0]+days[6])/total)*100);
  const avgAmt   = amounts.length ? amounts.reduce((s,v)=>s+v,0)/amounts.length : 0;
  const consistency = Math.round(Math.max(0, 100 - (transactions.length % 30) * 3));

  return [
    { dim: 'Night Activity', score: Math.min(nightR, 100) },
    { dim: 'Weekend Spend',  score: Math.min(weekendR, 100) },
    { dim: 'Impulsiveness',  score: Math.min(Math.round((transactions.length / 30) * 10), 100) },
    { dim: 'Avg Amount',     score: Math.min(Math.round(avgAmt / 200), 100) },
    { dim: 'Consistency',    score: consistency },
    { dim: 'Variety',        score: Math.min(Math.round((new Set(transactions.map(t=>t.recipientUPI)).size / total)*100, 100)) },
  ];
}

// Day-of-week bar data
function buildDayData(transactions) {
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const counts = Array(7).fill(0);
  transactions.forEach(t => {
    const ts = t.timestamp?.toDate?.() || new Date(t.timestamp || 0);
    counts[ts.getDay()]++;
  });
  return DAYS.map((d, i) => ({ day: d, count: counts[i] }));
}

// Hour-range data
function buildHourData(transactions) {
  const SLOTS = [
    { label: '12AM–6AM', from: 0, to: 6 },
    { label: '6AM–12PM', from: 6, to: 12 },
    { label: '12PM–6PM', from: 12, to: 18 },
    { label: '6PM–12AM', from: 18, to: 24 },
  ];
  return SLOTS.map(s => {
    const count = transactions.filter(t => {
      const h = (t.timestamp?.toDate?.() || new Date(t.timestamp || 0)).getHours();
      return h >= s.from && h < s.to;
    }).length;
    return { label: s.label, count };
  });
}

// ── Demo transactions ─────────────────────────────────────────────────────────
const DEMO_TXNS = Array.from({ length: 40 }, (_, i) => ({
  amount: [150, 499, 1200, 89, 2999, 320, 75, 850][i % 8],
  status: 'completed',
  recipientUPI: ['netflix@icici', 'zomato@paytm', 'friend@ybl', 'amazon@icici'][i % 4],
  timestamp: { toDate: () => new Date(Date.now() - i * 18 * 3600000 - (i % 3) * 7200000) },
}));

// ═══════════════════════════════════════════════════════════════════════════════
export default function FinancialPersonality() {
  const navigate = useNavigate();
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [archKey, setArchKey] = useState('balancedPlanner');
  const [radar, setRadar]     = useState([]);
  const [dayData, setDayData] = useState([]);
  const [hourData, setHourData] = useState([]);
  const [isDemo, setIsDemo]   = useState(false);
  const [txnCount, setTxnCount] = useState(0);

  useEffect(() => { const u = onAuthStateChanged(auth, setUser); return u; }, []);

  const analyze = (txns, demo = false) => {
    const key = classify(txns);
    setArchKey(key);
    setRadar(buildRadar(txns, key));
    setDayData(buildDayData(txns));
    setHourData(buildHourData(txns));
    setTxnCount(txns.length);
    setIsDemo(demo);
    setLoading(false);
  };

  const load = async (uid) => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'transactions'), where('userId', '==', uid)));
      const txns = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (txns.length >= 5) analyze(txns, false);
      else                  analyze(DEMO_TXNS, true);
    } catch {
      analyze(DEMO_TXNS, true);
    }
  };

  useEffect(() => {
    if (user) load(user.uid);
    else analyze(DEMO_TXNS, true);
  }, [user]);

  const arch = ARCHETYPES[archKey];
  const BAR_COLORS = ['#6366f1','#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4'];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-3">
        <Brain className="w-12 h-12 text-violet-400 mx-auto animate-pulse" />
        <p className="text-slate-400 text-sm">Analyzing your financial personality…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.1] transition-all flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-pink-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Financial Personality</h1>
            <p className="text-xs text-slate-400">AI-derived spending archetype</p>
          </div>
        </div>
        {user && (
          <Button onClick={() => load(user.uid)} variant="ghost" size="sm"
            className="text-slate-400 hover:text-white gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Re-analyze
          </Button>
        )}
      </div>

      {isDemo && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-3 py-2.5 bg-amber-900/20 border border-amber-700/30 rounded-xl text-xs text-amber-300">
          <Info className="w-3.5 h-3.5 shrink-0" />
          Showing sample personality — your real archetype appears after 5+ transactions.
        </motion.div>
      )}

      {/* Personality card */}
      <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className={`rounded-3xl bg-gradient-to-br ${arch.gradient} border ${arch.border} p-6 text-center relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-10"
          style={{ background: `radial-gradient(circle at 50% 0%, ${arch.color}, transparent 70%)` }} />
        <div className="relative z-10 space-y-3">
          <div className="text-5xl">{arch.emoji}</div>
          <div>
            <p className="text-2xl font-bold text-white">{arch.name}</p>
            <p className="text-sm text-slate-300 mt-1 italic">"{arch.tagline}"</p>
          </div>
          <div className="flex justify-center">
            <span className="text-xs px-3 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10">
              Based on {txnCount} transaction{txnCount !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Radar chart */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-gray-900 border border-white/[0.05] rounded-2xl p-5">
        <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-violet-400" /> Spending Profile Radar
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <RadarChart data={radar}>
            <PolarGrid stroke="#1f2937" />
            <PolarAngleAxis dataKey="dim" tick={{ fontSize: 10, fill: '#9ca3af' }} />
            <Radar dataKey="score" stroke={arch.color} fill={arch.color} fillOpacity={0.25} strokeWidth={2} />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Day of week distribution */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-gray-900 border border-white/[0.05] rounded-2xl p-5">
        <p className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" /> Transactions by Day of Week
        </p>
        <ResponsiveContainer width="100%" height={120}>
          <BarChart data={dayData} barSize={28}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip
              contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: '#9ca3af' }} itemStyle={{ color: '#fff' }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {dayData.map((_, i) => (
                <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Time of day */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
        className="bg-gray-900 border border-white/[0.05] rounded-2xl p-5">
        <p className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-400" /> When You Spend
        </p>
        <div className="space-y-2">
          {hourData.map((h, i) => {
            const max = Math.max(...hourData.map(x => x.count)) || 1;
            const pct = Math.round((h.count / max) * 100);
            return (
              <div key={i} className="flex items-center gap-3">
                <span className="text-xs text-slate-500 w-20 shrink-0">{h.label}</span>
                <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                    transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ background: arch.color }}
                  />
                </div>
                <span className="text-xs text-slate-500 w-8 text-right">{h.count}</span>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Strengths */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
        className="bg-gray-900 border border-white/[0.05] rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold text-white flex items-center gap-2">
          <Star className="w-4 h-4 text-emerald-400" /> Your Strengths
        </p>
        {arch.strengths.map((s, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mt-0.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <p className="text-sm text-slate-300">{s}</p>
          </div>
        ))}
      </motion.div>

      {/* Blind spots */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-gray-900 border border-white/[0.05] rounded-2xl p-5 space-y-3">
        <p className="text-sm font-semibold text-white flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-red-400" /> Blind Spots to Watch
        </p>
        {arch.blindspots.map((s, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-4 h-4 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center mt-0.5 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
            </div>
            <p className="text-sm text-slate-300">{s}</p>
          </div>
        ))}
      </motion.div>

      {/* AI Tips */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}
        className={`bg-gradient-to-br ${arch.gradient} border ${arch.border} rounded-2xl p-5 space-y-3`}>
        <p className="text-sm font-semibold text-white flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" /> Personalized Tips for You
        </p>
        {arch.tips.map((t, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="text-yellow-400 text-xs font-bold mt-0.5 shrink-0">{i + 1}.</span>
            <p className="text-sm text-slate-300">{t}</p>
          </div>
        ))}
      </motion.div>

    </div>
  );
}
