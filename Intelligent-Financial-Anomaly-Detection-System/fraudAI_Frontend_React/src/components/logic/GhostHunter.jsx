import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import {
  Ghost, IndianRupee, AlertTriangle, RefreshCw, ChevronDown, ChevronUp,
  Eye, CheckCircle2, Info, TrendingDown, Sparkles, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// ── Ghost detection algorithm ─────────────────────────────────────────────────
function detectGhosts(transactions) {
  const groups = {};
  transactions.forEach(t => {
    const key = (t.recipientUPI || '').trim();
    if (!key || t.status !== 'completed') return;
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });

  const ghosts = [];
  Object.entries(groups).forEach(([upi, txns]) => {
    if (txns.length < 2) return;

    const sorted = [...txns].sort((a, b) => {
      const da = a.timestamp?.toDate?.() || new Date(a.timestamp || 0);
      const db_ = b.timestamp?.toDate?.() || new Date(b.timestamp || 0);
      return da - db_;
    });

    const intervals = [];
    for (let i = 1; i < sorted.length; i++) {
      const da = sorted[i - 1].timestamp?.toDate?.() || new Date(sorted[i - 1].timestamp || 0);
      const db_ = sorted[i].timestamp?.toDate?.() || new Date(sorted[i].timestamp || 0);
      intervals.push((db_ - da) / 86400000);
    }
    if (!intervals.length) return;
    const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    if (avgInterval > 100 || avgInterval < 1) return;

    const amounts = sorted.map(t => parseFloat(t.amount) || 0).filter(Boolean);
    if (!amounts.length) return;
    const avgAmount = amounts.reduce((s, v) => s + v, 0) / amounts.length;

    let frequency = 'irregular';
    let monthlyEstimate = 0;
    if (avgInterval <= 2)       { frequency = 'daily';     monthlyEstimate = avgAmount * 30; }
    else if (avgInterval <= 8)  { frequency = 'weekly';    monthlyEstimate = avgAmount * 4.3; }
    else if (avgInterval <= 18) { frequency = 'bi-weekly'; monthlyEstimate = avgAmount * 2; }
    else if (avgInterval <= 45) { frequency = 'monthly';   monthlyEstimate = avgAmount; }
    else                        { frequency = 'quarterly'; monthlyEstimate = avgAmount / 3; }

    const lastDate = sorted[sorted.length - 1].timestamp?.toDate?.() || new Date();
    const daysSince = Math.round((Date.now() - lastDate.getTime()) / 86400000);

    ghosts.push({
      id: upi,
      label: upi,
      frequency,
      avgAmount,
      monthlyEstimate,
      annualEstimate: monthlyEstimate * 12,
      count: sorted.length,
      lastDate,
      daysSince,
      active: daysSince < avgInterval * 1.5,
    });
  });

  return ghosts.sort((a, b) => b.monthlyEstimate - a.monthlyEstimate);
}

// ── Demo data ─────────────────────────────────────────────────────────────────
const DEMO = [
  { id: 'netflix@icici',   label: 'netflix@icici',   frequency: 'monthly',   avgAmount: 649, monthlyEstimate: 649,    annualEstimate: 7788,  count: 8,  daysSince: 8,  active: true  },
  { id: 'spotify@ybl',     label: 'spotify@ybl',     frequency: 'monthly',   avgAmount: 119, monthlyEstimate: 119,    annualEstimate: 1428,  count: 12, daysSince: 15, active: true  },
  { id: 'gym@paytm',       label: 'gym@paytm',       frequency: 'monthly',   avgAmount: 999, monthlyEstimate: 999,    annualEstimate: 11988, count: 5,  daysSince: 38, active: false },
  { id: 'vpn@razorpay',    label: 'vpn@razorpay',    frequency: 'quarterly', avgAmount: 299, monthlyEstimate: 99.7,   annualEstimate: 1196,  count: 3,  daysSince: 22, active: true  },
  { id: 'news@phonepe',    label: 'news@phonepe',    frequency: 'monthly',   avgAmount: 79,  monthlyEstimate: 79,     annualEstimate: 948,   count: 6,  daysSince: 45, active: false },
];

const FREQ_BADGE = {
  daily:      'bg-red-900/40 text-red-300 border-red-700/50',
  weekly:     'bg-orange-900/40 text-orange-300 border-orange-700/50',
  'bi-weekly':'bg-yellow-900/40 text-yellow-300 border-yellow-700/50',
  monthly:    'bg-blue-900/40 text-blue-300 border-blue-700/50',
  quarterly:  'bg-purple-900/40 text-purple-300 border-purple-700/50',
  irregular:  'bg-gray-800 text-gray-400 border-gray-700',
};

const fmt = n => Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 });

// ═══════════════════════════════════════════════════════════════════════════════
function GhostCard({ ghost, isExpanded, onToggle, onDismiss, dormant }) {
  const badge = FREQ_BADGE[ghost.frequency] || FREQ_BADGE.irregular;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border overflow-hidden ${dormant ? 'border-gray-800 bg-gray-900/40' : 'border-gray-700 bg-gray-900'}`}
    >
      <button onClick={onToggle} className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/5 transition-colors">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${dormant ? 'bg-gray-800' : 'bg-violet-900/40'}`}>
          <Ghost className={`w-5 h-5 ${dormant ? 'text-gray-500' : 'text-violet-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${dormant ? 'text-gray-400' : 'text-white'}`}>{ghost.label}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${badge}`}>{ghost.frequency}</span>
            <span className="text-xs text-gray-500">{ghost.count} payments detected</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0 mr-2">
          <p className={`text-sm font-bold ${dormant ? 'text-gray-400' : 'text-white'}`}>₹{fmt(ghost.avgAmount)}</p>
          <p className="text-[10px] text-gray-500">₹{fmt(ghost.annualEstimate)}/yr</p>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    : <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden border-t border-gray-800">
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  ['Last Payment', `${ghost.daysSince} days ago`],
                  ['Frequency',    ghost.frequency],
                  ['Monthly Cost', `₹${fmt(ghost.monthlyEstimate)}`],
                  ['Annual Cost',  `₹${fmt(ghost.annualEstimate)}`],
                ].map(([label, val]) => (
                  <div key={label} className="bg-gray-800/60 rounded-xl p-3">
                    <p className="text-gray-500 mb-0.5">{label}</p>
                    <p className="text-white font-semibold">{val}</p>
                  </div>
                ))}
              </div>
              {!dormant && (
                <div className="flex items-start gap-2 p-3 bg-amber-900/20 border border-amber-700/20 rounded-xl">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-200">This charge is still active. Verify you're still using this service to avoid paying for something you don't use.</p>
                </div>
              )}
              <Button onClick={onDismiss} variant="ghost" size="sm"
                className="w-full border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 text-xs gap-2">
                <X className="w-3 h-3" /> Dismiss — I'm aware of this charge
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function GhostHunter() {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [ghosts, setGhosts]   = useState([]);
  const [isDemo, setIsDemo]   = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => { const u = onAuthStateChanged(auth, setUser); return u; }, []);

  const load = async (uid) => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'transactions'), where('userId', '==', uid)));
      const txns = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const detected = detectGhosts(txns);
      if (detected.length > 0) { setGhosts(detected); setIsDemo(false); }
      else                     { setGhosts(DEMO); setIsDemo(true); }
    } catch { setGhosts(DEMO); setIsDemo(true); }
    setLoading(false);
  };

  useEffect(() => {
    if (user) load(user.uid);
    else { setGhosts(DEMO); setIsDemo(true); setLoading(false); }
  }, [user]);

  const dismiss  = id => setDismissed(d => new Set([...d, id]));
  const visible  = ghosts.filter(g => !dismissed.has(g.id));
  const active   = visible.filter(g => g.active);
  const dormant  = visible.filter(g => !g.active);
  const totalMo  = visible.reduce((s, g) => s + g.monthlyEstimate, 0);
  const totalYr  = visible.reduce((s, g) => s + g.annualEstimate, 0);

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center space-y-3">
        <Ghost className="w-12 h-12 text-violet-400 mx-auto animate-bounce" />
        <p className="text-gray-400 text-sm">Hunting ghost subscriptions…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
            <Ghost className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Ghost Hunter</h1>
            <p className="text-xs text-gray-400">Recurring charges you may have forgotten</p>
          </div>
        </div>
        {user && (
          <Button onClick={() => load(user.uid)} variant="ghost" size="sm"
            className="text-gray-400 hover:text-white gap-1.5 text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Rescan
          </Button>
        )}
      </div>

      {isDemo && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-2 px-3 py-2.5 bg-amber-900/20 border border-amber-700/30 rounded-xl text-xs text-amber-300">
          <Info className="w-3.5 h-3.5 shrink-0" />
          Showing sample data — your real ghost charges appear after transactions accumulate.
        </motion.div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Ghosts Found',      value: visible.length,         sub: `${active.length} still active` },
          { label: 'Monthly Drain',     value: `₹${fmt(totalMo)}`,     sub: 'ghost charges/month' },
          { label: 'Potential Savings', value: `₹${fmt(totalYr)}`,     sub: 'per year if cancelled' },
        ].map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-4 text-center">
            <p className="text-xl font-bold text-white">{c.value}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">{c.label}</p>
            <p className="text-[10px] text-gray-600 mt-1">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Insight banner */}
      {totalYr > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center gap-3 p-4 bg-gradient-to-r from-violet-900/40 to-blue-900/40 border border-violet-700/30 rounded-2xl">
          <Sparkles className="w-5 h-5 text-violet-400 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-white">You could save ₹{fmt(totalYr)} this year</p>
            <p className="text-xs text-gray-400">by reviewing and cancelling forgotten subscriptions.</p>
          </div>
        </motion.div>
      )}

      {/* Active ghosts */}
      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            Active Ghost Charges
          </h2>
          {active.map(g => (
            <GhostCard key={g.id} ghost={g}
              isExpanded={expanded === g.id}
              onToggle={() => setExpanded(expanded === g.id ? null : g.id)}
              onDismiss={() => dismiss(g.id)} />
          ))}
        </section>
      )}

      {/* Dormant ghosts */}
      {dormant.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5" /> Dormant / Inactive
          </h2>
          {dormant.map(g => (
            <GhostCard key={g.id} ghost={g} dormant
              isExpanded={expanded === g.id}
              onToggle={() => setExpanded(expanded === g.id ? null : g.id)}
              onDismiss={() => dismiss(g.id)} />
          ))}
        </section>
      )}

      {visible.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4 py-16 text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-400" />
          <p className="text-white font-semibold">All Ghosts Dismissed</p>
          <p className="text-sm text-gray-500">You've reviewed all recurring charges.</p>
        </motion.div>
      )}

      {/* Tip */}
      <div className="flex items-start gap-3 p-4 bg-gray-900 border border-gray-800 rounded-2xl text-xs text-gray-400">
        <TrendingDown className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <p>Ghost charges are detected by finding recurring payments to the same UPI ID with consistent amounts and intervals. They often represent subscriptions you forgot to cancel.</p>
      </div>
    </div>
  );
}
