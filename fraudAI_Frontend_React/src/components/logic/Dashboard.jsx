import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "./firebase.js";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import Header from "./Header.jsx";
import SidebarContent from "./SidebarContent";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DollarSign, CreditCard, Activity, Zap, Send, ShieldCheck,
  ArrowUpRight, AlertTriangle, TrendingUp, ShieldAlert,
  BrainCircuit, ShieldX, Map, Lock, Unlock, LogOut,
  ArrowDownLeft, Cpu, Fingerprint, Radio,
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import axios from "axios";

const COLORS = ['#4cd7f6', '#d0bcff', '#4edea3', '#ffb4ab', '#f59e0b', '#ec4899'];
const API    = import.meta.env.VITE_API_URL || "http://localhost:5000";

/* ─────────────────────── Glass Card ─────────────────────── */
const GlassCard = ({ children, className = "", onClick, glowColor }) => {
  const glowMap = {
    cyan:    'hover:shadow-[0_0_32px_rgba(76,215,246,0.10)]  hover:border-[rgba(76,215,246,0.18)]',
    violet:  'hover:shadow-[0_0_32px_rgba(208,188,255,0.10)] hover:border-[rgba(208,188,255,0.18)]',
    emerald: 'hover:shadow-[0_0_32px_rgba(78,222,163,0.10)]  hover:border-[rgba(78,222,163,0.18)]',
    red:     'hover:shadow-[0_0_32px_rgba(255,180,171,0.10)] hover:border-[rgba(255,180,171,0.18)]',
  };
  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl overflow-hidden
        bg-[rgba(25,31,49,0.65)] backdrop-blur-xl
        border border-[rgba(220,225,251,0.08)]
        shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_4px_24px_rgba(0,0,0,0.3)]
        transition-all duration-200
        ${onClick ? `cursor-pointer ${glowMap[glowColor] || 'hover:border-[rgba(255,255,255,0.13)]'}` : ''}
        ${className}
      `}
    >
      {/* Hex watermark top-right */}
      <div className="pointer-events-none absolute top-0 right-0 w-20 h-20 opacity-40" aria-hidden>
        <svg viewBox="0 0 100 100" fill="none">
          <path d="M50 8L92 31v38L50 92 8 69V31z" stroke="rgba(220,225,251,0.07)" strokeWidth="2"/>
        </svg>
      </div>
      {children}
    </div>
  );
};

/* ─────────────────────── Stat Card ─────────────────────── */
const StatCard = ({ title, value, icon: Icon, gradient, iconColor, valueColor, glow, sub, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
  >
    <div className={`relative overflow-hidden rounded-2xl border border-[rgba(220,225,251,0.08)] bg-[rgba(25,31,49,0.65)] backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.10),0_4px_24px_rgba(0,0,0,0.3)] p-5 transition-all duration-200 group ${glow}`}>
      {/* gradient wash */}
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-100 group-hover:opacity-150 transition-opacity pointer-events-none`} />
      {/* hex watermark */}
      <div className="pointer-events-none absolute -bottom-3 -right-3 w-16 h-16 opacity-30" aria-hidden>
        <svg viewBox="0 0 100 100" fill="none">
          <path d="M50 8L92 31v38L50 92 8 69V31z" stroke="rgba(220,225,251,0.12)" strokeWidth="3"/>
        </svg>
      </div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <span className="label-caps text-[rgba(188,201,205,0.7)]">{title}</span>
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.08)]`}>
            <Icon className={`h-4 w-4 ${iconColor}`} />
          </div>
        </div>
        <p className={`text-2xl font-bold font-mono tabular-nums ${valueColor}`}>{value}</p>
        {sub && <p className="text-xs text-[rgba(188,201,205,0.6)] mt-1.5 font-mono">{sub}</p>}
      </div>
    </div>
  </motion.div>
);

/* ─────────────────────── Custom Tooltip ─────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[rgba(19,24,40,0.95)] border border-[rgba(76,215,246,0.2)] rounded-xl px-3 py-2 text-xs shadow-[0_0_20px_rgba(76,215,246,0.08)] backdrop-blur-xl">
      {label && <p className="text-[rgba(188,201,205,0.6)] mb-1 font-mono">{label}</p>}
      <p className="text-[#4cd7f6] font-semibold font-mono">₹{Number(payload[0].value).toLocaleString('en-IN')}</p>
    </div>
  );
};

/* ─────────────────────── MAIN COMPONENT ─────────────────────── */
const Dashboard = () => {
  const [user,          setUser]          = useState(null);
  const [upiId,         setUpiId]         = useState("");
  const [balance,       setBalance]       = useState(50000);
  const [transactions,  setTransactions]  = useState([]);
  const [recentTx,      setRecentTx]      = useState([]);
  const [mlStats,       setMlStats]       = useState(null);
  const [frozen,        setFrozen]        = useState(false);
  const [freezeLoading, setFreezeLoading] = useState(false);
  const navigate = useNavigate();

  const toggleFreeze = async () => {
    const cu = auth.currentUser;
    if (!cu) return;
    setFreezeLoading(true);
    try {
      const next = !frozen;
      await updateDoc(doc(db, "users", cu.uid), { frozen: next });
      setFrozen(next);
    } catch { /* ignore */ }
    finally { setFreezeLoading(false); }
  };

  const handleSignOut = async () => {
    try { await signOut(auth); setUser(null); setUpiId(""); }
    catch (e) { console.error("Sign-Out Error:", e); }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (cu) => {
      if (!cu) return;
      setUser(cu);
      const baseName   = (cu.displayName || cu.email || "user").split(/[ @]/)[0].toLowerCase().replace(/[^a-z0-9]/g, "");
      const fallbackUpi = `${baseName}${cu.uid.slice(-4).toLowerCase()}@yesbank`;
      const userRef = doc(db, "users", cu.uid);
      let resolvedUpi = fallbackUpi;
      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, { uid: cu.uid, name: cu.displayName, email: cu.email, photoURL: cu.photoURL, upiId: fallbackUpi, balance: 50000, createdAt: serverTimestamp() });
          setBalance(50000);
        } else {
          const d = snap.data();
          resolvedUpi = d.upiId || fallbackUpi;
          if (!d.upiId) await updateDoc(userRef, { upiId: fallbackUpi });
          setBalance(d.balance ?? 50000);
          setFrozen(d.frozen ?? false);
        }
      } catch { /* Firestore unavailable */ }
      setUpiId(resolvedUpi);
      const txSnap = await getDocs(query(collection(db, "transactions"), where("userId", "==", cu.uid)));
      const txList = txSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
      setTransactions(txList);
      setRecentTx(txList.slice(0, 6));
    });
    return unsub;
  }, []);

  useEffect(() => {
    axios.get(`${API}/explore`).then(res => setMlStats(res.data?.stats ?? null)).catch(() => setMlStats(null));
  }, []);

  /* ── Derived ── */
  const monthlyData = (() => {
    const map = {};
    transactions.forEach(tx => {
      if (!tx.createdAt) return;
      const key = new Date(tx.createdAt.seconds * 1000).toLocaleString('default', { month: 'short' });
      map[key] = (map[key] || 0) + (tx.amount ?? 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  const spendingData = (() => {
    const map = {};
    transactions.filter(t => t.type !== 'incoming').forEach(tx => {
      const cat = tx.remarks ? tx.remarks.charAt(0).toUpperCase() + tx.remarks.slice(1) : 'Other';
      map[cat] = (map[cat] || 0) + (tx.amount ?? 0);
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  })();

  const now = new Date();
  const monthlySpending = transactions.filter(tx => {
    if (!tx.createdAt || tx.type === 'incoming') return false;
    const d = new Date(tx.createdAt.seconds * 1000);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).reduce((sum, tx) => sum + (tx.amount ?? 0), 0);

  const totalReceived = transactions.filter(t => t.type === 'incoming').reduce((s, t) => s + (t.amount ?? 0), 0);
  const cashback      = transactions.filter(t => t.type !== 'incoming').reduce((sum, tx) => sum + (tx.amount ?? 0) * 0.02, 0);
  const spendingPct   = balance > 0 ? (monthlySpending / balance) * 100 : 0;
  const isHighSpending = spendingPct > 70;

  const fraudTx    = transactions.filter(tx => tx.fraudVerdict === "FRAUD");
  const total      = transactions.length;
  const fraudRate  = total > 0 ? (fraudTx.length / total) * 100 : 0;
  const secureScore = Math.max(0, Math.round(100 - fraudRate * 5));
  const riskLevel   = secureScore >= 85 ? "LOW" : secureScore >= 60 ? "MEDIUM" : "HIGH";

  const secStatus = secureScore >= 85
    ? { label: "SECURE",  color: "#4edea3", bg: "rgba(78,222,163,0.08)", border: "rgba(78,222,163,0.25)", Icon: ShieldCheck, textCls: "text-[#4edea3]" }
    : secureScore >= 60
    ? { label: "MONITOR", color: "#f59e0b", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", Icon: ShieldAlert, textCls: "text-amber-400" }
    : { label: "AT RISK", color: "#ffb4ab", bg: "rgba(255,180,171,0.08)", border: "rgba(255,180,171,0.25)", Icon: ShieldX,    textCls: "text-[#ffb4ab]" };

  const riskColors = riskLevel === "LOW"
    ? { text: "text-[#4edea3]",  badge: "bg-[rgba(78,222,163,0.10)] border-[rgba(78,222,163,0.25)]" }
    : riskLevel === "MEDIUM"
    ? { text: "text-amber-400",  badge: "bg-amber-500/10 border-amber-500/25" }
    : { text: "text-[#ffb4ab]", badge: "bg-[rgba(255,180,171,0.10)] border-[rgba(255,180,171,0.25)]" };

  const statCards = [
    {
      title: "Total Balance",       icon: DollarSign,
      value: `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      gradient: "from-[rgba(76,215,246,0.12)] to-[rgba(76,215,246,0.03)]",
      iconColor: "text-[#4cd7f6]", valueColor: "text-[#4cd7f6]",
      glow: "hover:shadow-[0_0_32px_rgba(76,215,246,0.10)]", delay: 0,
    },
    {
      title: "Monthly Spending",    icon: isHighSpending ? TrendingUp : CreditCard,
      value: `₹${monthlySpending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      gradient: isHighSpending ? "from-[rgba(255,180,171,0.12)] to-[rgba(255,180,171,0.03)]" : "from-[rgba(78,222,163,0.12)] to-[rgba(78,222,163,0.03)]",
      iconColor: isHighSpending ? "text-[#ffb4ab]" : "text-[#4edea3]",
      valueColor: isHighSpending ? "text-[#ffb4ab]" : "text-[#4edea3]",
      glow: isHighSpending ? "hover:shadow-[0_0_32px_rgba(255,180,171,0.10)]" : "hover:shadow-[0_0_32px_rgba(78,222,163,0.10)]",
      sub: isHighSpending ? `${spendingPct.toFixed(0)}% of balance` : undefined,
      delay: 0.06,
    },
    {
      title: "Total Received",      icon: ArrowDownLeft,
      value: `₹${totalReceived.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      gradient: "from-[rgba(208,188,255,0.12)] to-[rgba(208,188,255,0.03)]",
      iconColor: "text-[#d0bcff]", valueColor: "text-[#d0bcff]",
      glow: "hover:shadow-[0_0_32px_rgba(208,188,255,0.10)]", delay: 0.12,
    },
    {
      title: "Cashback Earned",     icon: Zap,
      value: `₹${cashback.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      gradient: "from-[rgba(245,158,11,0.12)] to-[rgba(245,158,11,0.03)]",
      iconColor: "text-amber-400", valueColor: "text-amber-300",
      glow: "hover:shadow-[0_0_32px_rgba(245,158,11,0.10)]", delay: 0.18,
    },
  ];

  const quickActions = [
    { label: "Send Money",        icon: Send,        path: "/send-money",       from: "#0e4166", to: "#0ea5e9", glow: "rgba(14,165,233,0.3)"  },
    { label: "Transactions",      icon: Activity,    path: "/transactions",     from: "#3b0764", to: "#a855f7", glow: "rgba(168,85,247,0.3)"   },
    { label: "Run Detection",     icon: ShieldCheck, path: "/run-detection",    from: "#064e3b", to: "#10b981", glow: "rgba(16,185,129,0.3)"   },
    { label: "Check Transaction", icon: Fingerprint, path: "/check-transaction",from: "#451a03", to: "#f59e0b", glow: "rgba(245,158,11,0.3)"   },
  ];

  return (
    <div
      className="flex min-h-screen"
      style={{ background: "radial-gradient(ellipse 80% 50% at 0% 0%, rgba(76,215,246,0.05) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(208,188,255,0.06) 0%, transparent 60%), #0c1324" }}
    >
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-72 min-h-screen flex-shrink-0 border-r border-[rgba(220,225,251,0.05)] bg-[rgba(7,13,31,0.6)] backdrop-blur-xl overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={user} />

        <main className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-5 max-w-7xl mx-auto">

            {/* ── Profile row ── */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-[#4cd7f6] to-[#d0bcff] opacity-60 blur-sm" />
                  <Avatar className="relative h-12 w-12 border-2 border-[rgba(76,215,246,0.3)]" style={{ height: 48, width: 48 }}>
                    <AvatarImage src={user?.photoURL} alt={user?.displayName} />
                    <AvatarFallback className="text-base font-bold text-white" style={{ background: "linear-gradient(135deg,#4cd7f6,#d0bcff)" }}>
                      {user?.displayName?.charAt(0) ?? "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#4edea3] border-2 border-[#0c1324] rounded-full shadow-[0_0_8px_rgba(78,222,163,0.6)]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[#dce1fb] leading-tight">{user?.displayName ?? "User"}</h2>
                  <p className="text-xs text-[rgba(188,201,205,0.5)] font-mono mt-0.5 tracking-wide">{upiId || "Loading…"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Freeze toggle */}
                <button
                  onClick={toggleFreeze}
                  disabled={freezeLoading}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200 ${
                    frozen
                      ? "border-[rgba(255,180,171,0.35)] bg-[rgba(255,180,171,0.08)] text-[#ffb4ab] hover:bg-[rgba(255,180,171,0.14)]"
                      : "border-[rgba(220,225,251,0.10)] bg-[rgba(220,225,251,0.04)] text-[rgba(220,225,251,0.7)] hover:bg-[rgba(220,225,251,0.08)] hover:text-[#dce1fb]"
                  }`}
                >
                  {frozen ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                  {freezeLoading ? "…" : frozen ? "Frozen" : "Freeze Account"}
                </button>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-[rgba(220,225,251,0.08)] bg-[rgba(220,225,251,0.03)] text-[rgba(188,201,205,0.6)] hover:bg-[rgba(255,180,171,0.08)] hover:border-[rgba(255,180,171,0.25)] hover:text-[#ffb4ab] transition-all duration-200"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  Sign Out
                </button>
              </div>
            </motion.div>

            {/* ── Alert banners ── */}
            <AnimatePresence>
              {frozen && (
                <motion.div key="frozen" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-3 rounded-2xl p-4 border"
                  style={{ background: "rgba(255,180,171,0.07)", borderColor: "rgba(255,180,171,0.3)" }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,180,171,0.12)" }}>
                    <Lock className="h-4 w-4 text-[#ffb4ab]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#ffb4ab]">Account Frozen</p>
                    <p className="text-xs text-[rgba(255,180,171,0.55)] mt-0.5">All outgoing payments are blocked. Click &quot;Frozen&quot; to unfreeze.</p>
                  </div>
                </motion.div>
              )}
              {isHighSpending && !frozen && (
                <motion.div key="highspend" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="flex items-center gap-3 rounded-2xl p-4 border"
                  style={{ background: "rgba(245,158,11,0.07)", borderColor: "rgba(245,158,11,0.25)" }}
                >
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(245,158,11,0.12)" }}>
                    <AlertTriangle className="h-4 w-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-300">High Spending Alert</p>
                    <p className="text-xs text-amber-400/55 mt-0.5">
                      ₹{monthlySpending.toLocaleString('en-IN')} spent this month — {spendingPct.toFixed(0)}% of balance.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Stat cards ── */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statCards.map(card => (
                <StatCard key={card.title} {...card} />
              ))}
            </div>

            {/* ── Quick actions ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {quickActions.map((action, i) => (
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35, delay: 0.1 + i * 0.07 }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(action.path)}
                  className="relative overflow-hidden rounded-2xl p-4 flex flex-col items-center gap-3 text-white transition-all duration-200 group"
                  style={{ background: `linear-gradient(145deg, ${action.from}, ${action.to})`, boxShadow: `0 4px 20px ${action.glow}` }}
                >
                  {/* Rim shine */}
                  <div className="absolute inset-0 rounded-2xl" style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.20), inset 0 -1px 0 rgba(0,0,0,0.20)" }} />
                  {/* Glass overlay on hover */}
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-colors duration-200 rounded-2xl" />
                  <div className="relative w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <span className="relative text-xs font-semibold text-center leading-tight">{action.label}</span>
                </motion.button>
              ))}
            </div>

            {/* ── ML Fraud Stats ── */}
            <AnimatePresence>
              {mlStats && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                  <GlassCard glowColor="cyan">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(220,225,251,0.06)]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[rgba(76,215,246,0.12)] border border-[rgba(76,215,246,0.15)] flex items-center justify-center">
                          <Cpu className="h-4 w-4 text-[#4cd7f6]" />
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-[#dce1fb]">ML Fraud Detection</span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="inline-flex w-1.5 h-1.5 rounded-full bg-[#4edea3] shadow-[0_0_6px_rgba(78,222,163,0.8)] animate-pulse" />
                            <span className="label-caps text-[rgba(78,222,163,0.7)]">Live Engine</span>
                          </div>
                        </div>
                      </div>
                      <button onClick={() => navigate("/detection-results")} className="text-xs text-[#4cd7f6] hover:text-[rgba(76,215,246,0.8)] flex items-center gap-1 transition-colors font-mono">
                        Full Results <ArrowUpRight className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[rgba(220,225,251,0.05)]">
                      {[
                        { label: "Records Analyzed", value: mlStats.total_transactions?.toLocaleString() ?? "—", color: "text-[#4cd7f6]" },
                        { label: "Features Used",    value: mlStats.num_features ?? "—",                        color: "text-[#d0bcff]" },
                        { label: "Fraud Cases",      value: mlStats.fraud_count ?? "—",                         color: "text-[#ffb4ab]" },
                        { label: "Fraud Rate",       value: mlStats.fraud_rate !== undefined ? `${mlStats.fraud_rate}%` : "—", color: "text-amber-400" },
                      ].map(s => (
                        <div key={s.label} className="p-5">
                          <p className="label-caps text-[rgba(188,201,205,0.5)] mb-2">{s.label}</p>
                          <p className={`text-2xl font-bold font-mono tabular-nums ${s.color}`}>{s.value}</p>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── AI Security Status ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.15 }}>
              <div
                className="relative rounded-2xl overflow-hidden border backdrop-blur-xl"
                style={{ background: secStatus.bg, borderColor: secStatus.border, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 4px 24px rgba(0,0,0,0.3), 0 0 40px ${secStatus.color}12` }}
              >
                {/* Hex watermark */}
                <div className="pointer-events-none absolute top-0 right-0 w-32 h-32 opacity-20" aria-hidden>
                  <svg viewBox="0 0 100 100" fill="none">
                    <path d="M50 8L92 31v38L50 92 8 69V31z" stroke={secStatus.color} strokeWidth="2"/>
                    <path d="M50 22L80 38v30L50 84 20 68V38z" stroke={secStatus.color} strokeWidth="1.5" opacity="0.5"/>
                  </svg>
                </div>

                <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(220,225,251,0.06)]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[rgba(255,255,255,0.07)] border border-[rgba(255,255,255,0.08)] flex items-center justify-center">
                      <BrainCircuit className="h-4 w-4 text-[rgba(220,225,251,0.7)]" />
                    </div>
                    <span className="text-sm font-semibold text-[#dce1fb]">AI Security Status</span>
                  </div>
                  <span className={`label-caps px-3 py-1 rounded-full border font-mono ${secStatus.textCls}`} style={{ borderColor: secStatus.border, background: `${secStatus.color}14` }}>
                    {secStatus.label}
                  </span>
                </div>

                <div className="p-5 flex flex-col sm:flex-row items-center gap-6">
                  {/* Score ring */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="relative w-24 h-24">
                      <svg width="96" height="96" viewBox="0 0 96 96">
                        <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="9"/>
                        <circle cx="48" cy="48" r="38" fill="none"
                          stroke={secStatus.color} strokeWidth="9" strokeLinecap="round"
                          strokeDasharray={`${(secureScore / 100) * 238.8} 238.8`}
                          strokeDashoffset="60"
                          style={{ filter: `drop-shadow(0 0 8px ${secStatus.color}88)`, transition: 'stroke-dasharray 1s ease' }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-bold font-mono tabular-nums ${secStatus.textCls}`}>{secureScore}</span>
                        <span className="text-[9px] font-mono text-[rgba(188,201,205,0.4)] tracking-wider">SCORE</span>
                      </div>
                    </div>
                    <p className="label-caps text-[rgba(188,201,205,0.4)] mt-2">Security Index</p>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 flex-1 w-full">
                    {[
                      { label: "Total Transactions", value: total,                             color: "text-[#dce1fb]" },
                      { label: "Flagged as Fraud",   value: fraudTx.length,                   color: fraudTx.length > 0 ? "text-[#ffb4ab]" : "text-[#4edea3]" },
                      { label: "Fraud Rate",         value: `${fraudRate.toFixed(1)}%`,        color: fraudRate > 5 ? "text-[#ffb4ab]" : "text-[#4edea3]" },
                    ].map(s => (
                      <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(220,225,251,0.06)" }}>
                        <p className="label-caps text-[rgba(188,201,205,0.45)] leading-tight mb-1.5">{s.label}</p>
                        <p className={`text-xl font-bold font-mono tabular-nums ${s.color}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {fraudTx.length > 0 && (
                  <div className="mx-5 mb-5 flex items-start gap-2.5 rounded-xl px-4 py-3" style={{ background: "rgba(255,180,171,0.07)", border: "1px solid rgba(255,180,171,0.20)" }}>
                    <AlertTriangle className="h-3.5 w-3.5 text-[#ffb4ab] flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-[rgba(255,180,171,0.8)] leading-relaxed">
                      {fraudTx.length} transaction{fraudTx.length > 1 ? "s were" : " was"} flagged as fraudulent.
                      Review your recent activity immediately.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* ── Risk Profile + Heatmap shortcuts ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.2 }}>
                <GlassCard onClick={() => navigate("/risk-profile")} glowColor={riskLevel === "LOW" ? "emerald" : riskLevel === "MEDIUM" ? undefined : "red"}>
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center border ${riskColors.badge}`}>
                          <ShieldAlert className={`h-3.5 w-3.5 ${riskColors.text}`} />
                        </div>
                        <span className="label-caps text-[rgba(188,201,205,0.55)]">Risk Profile</span>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-[rgba(188,201,205,0.3)] group-hover:text-[rgba(220,225,251,0.6)] transition-colors" />
                    </div>
                    <div className="flex items-end gap-3">
                      <p className={`text-5xl font-black font-mono tabular-nums ${riskColors.text}`}>{secureScore}</p>
                      <div className="pb-1">
                        <span className={`label-caps px-2 py-0.5 rounded-full border ${riskColors.badge} ${riskColors.text}`}>{riskLevel} RISK</span>
                        <p className="text-[10px] text-[rgba(188,201,205,0.3)] mt-1 font-mono">View full profile →</p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.26 }}>
                <GlassCard onClick={() => navigate("/fraud-heatmap")} className="group">
                  <div className="p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                          <Map className="h-3.5 w-3.5 text-amber-400" />
                        </div>
                        <span className="label-caps text-[rgba(188,201,205,0.55)]">Fraud Heatmap</span>
                      </div>
                      <ArrowUpRight className="h-3.5 w-3.5 text-[rgba(188,201,205,0.3)] group-hover:text-[rgba(220,225,251,0.6)] transition-colors" />
                    </div>
                    <p className="text-base font-semibold text-[#dce1fb] mb-1">Category & Hour Analysis</p>
                    <p className="text-xs text-[rgba(188,201,205,0.4)] leading-relaxed">
                      See which spending categories and times carry the highest fraud risk
                    </p>
                  </div>
                </GlassCard>
              </motion.div>
            </div>

            {/* ── Charts ── */}
            <div className="grid gap-5 md:grid-cols-2">
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.28 }}>
                <GlassCard glowColor="cyan">
                  <div className="px-5 py-4 border-b border-[rgba(220,225,251,0.06)]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[rgba(76,215,246,0.12)] border border-[rgba(76,215,246,0.15)] flex items-center justify-center">
                        <Radio className="h-3.5 w-3.5 text-[#4cd7f6]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#dce1fb]">Transaction History</h3>
                        <p className="label-caps text-[rgba(188,201,205,0.4)]">Monthly volume</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={monthlyData.length ? monthlyData : [{ name: 'No data', value: 0 }]}>
                        <defs>
                          <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#4cd7f6" stopOpacity={0.3}/>
                            <stop offset="100%" stopColor="#4cd7f6" stopOpacity={0.02}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" stroke="rgba(188,201,205,0.25)" fontSize={10} tickLine={false} axisLine={false} fontFamily="JetBrains Mono" />
                        <YAxis stroke="rgba(188,201,205,0.25)" fontSize={10} tickLine={false} axisLine={false} tickFormatter={v => `₹${v}`} fontFamily="JetBrains Mono" />
                        <Tooltip content={<ChartTooltip />} />
                        <Area type="monotone" dataKey="value" stroke="#4cd7f6" strokeWidth={2} fill="url(#cyanGrad)"
                          dot={false} activeDot={{ r: 4, fill: "#4cd7f6", strokeWidth: 0, filter: "drop-shadow(0 0 6px rgba(76,215,246,0.8))" }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </GlassCard>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.34 }}>
                <GlassCard glowColor="violet">
                  <div className="px-5 py-4 border-b border-[rgba(220,225,251,0.06)]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[rgba(208,188,255,0.12)] border border-[rgba(208,188,255,0.15)] flex items-center justify-center">
                        <Activity className="h-3.5 w-3.5 text-[#d0bcff]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#dce1fb]">Spending Categories</h3>
                        <p className="label-caps text-[rgba(188,201,205,0.4)]">Breakdown by type</p>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie
                          cx="50%" cy="50%" outerRadius={76} innerRadius={44}
                          dataKey="value" paddingAngle={3}
                          data={spendingData.length ? spendingData : [{ name: 'No transactions', value: 1 }]}
                          stroke="none"
                        >
                          {(spendingData.length ? spendingData : [{ name: 'No transactions', value: 1 }]).map((_, i) => (
                            <Cell key={i} fill={COLORS[i % COLORS.length]} style={{ filter: `drop-shadow(0 0 6px ${COLORS[i % COLORS.length]}66)` }} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                    {/* Legend */}
                    {spendingData.length > 0 && (
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center mt-2">
                        {spendingData.slice(0, 5).map((d, i) => (
                          <div key={d.name} className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length], boxShadow: `0 0 6px ${COLORS[i % COLORS.length]}88` }} />
                            <span className="text-[10px] text-[rgba(188,201,205,0.5)] font-mono">{d.name}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </GlassCard>
              </motion.div>
            </div>

            {/* ── Neural Activity Feed (Recent Transactions) ── */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4 }}>
              <GlassCard>
                <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(220,225,251,0.06)]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[rgba(76,215,246,0.10)] border border-[rgba(76,215,246,0.15)] flex items-center justify-center">
                      <Zap className="h-3.5 w-3.5 text-[#4cd7f6]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#dce1fb]">Neural Activity Feed</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse shadow-[0_0_6px_rgba(78,222,163,0.8)]" />
                        <span className="label-caps text-[rgba(78,222,163,0.6)]">Real-time</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => navigate("/transactions")} className="text-xs text-[#4cd7f6] hover:text-[rgba(76,215,246,0.7)] flex items-center gap-1 transition-colors font-mono">
                    View All <ArrowUpRight className="h-3 w-3" />
                  </button>
                </div>

                <div className="p-4">
                  {recentTx.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-[rgba(188,201,205,0.3)]">
                      <Activity className="h-8 w-8 mb-3 opacity-30" />
                      <p className="text-sm font-medium">No transactions yet</p>
                      <button onClick={() => navigate("/send-money")} className="mt-2 text-xs text-[#4cd7f6] hover:text-[rgba(76,215,246,0.7)] transition-colors font-mono">
                        Send your first payment →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {recentTx.map((tx, i) => {
                        const isFlagged  = tx.fraudVerdict === "FRAUD";
                        const isIncoming = tx.type === "incoming";
                        const counterparty = isIncoming ? tx.senderUPI : tx.recipientUPI;
                        return (
                          <motion.div
                            key={tx.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.05 }}
                            className={`flex items-center justify-between p-3.5 rounded-xl transition-all duration-150 border ${
                              isFlagged
                                ? "bg-[rgba(255,180,171,0.05)] border-[rgba(255,180,171,0.18)] hover:bg-[rgba(255,180,171,0.09)]"
                                : "bg-[rgba(255,255,255,0.02)] border-[rgba(220,225,251,0.05)] hover:bg-[rgba(255,255,255,0.04)] hover:border-[rgba(220,225,251,0.09)]"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isIncoming ? "bg-[rgba(78,222,163,0.12)] border border-[rgba(78,222,163,0.18)]" : "bg-[rgba(255,180,171,0.10)] border border-[rgba(255,180,171,0.15)]"
                              }`}>
                                {isIncoming
                                  ? <ArrowDownLeft className="h-4 w-4 text-[#4edea3]" />
                                  : <ArrowUpRight  className="h-4 w-4 text-[#ffb4ab]" />
                                }
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono ${
                                    isIncoming ? "bg-[rgba(78,222,163,0.12)] text-[#4edea3]" : "bg-[rgba(255,180,171,0.10)] text-[#ffb4ab]"
                                  }`}>{isIncoming ? "FROM" : "TO"}</span>
                                  <p className="text-sm font-medium text-[#dce1fb] leading-tight font-mono truncate max-w-[140px]">{counterparty || "—"}</p>
                                </div>
                                <p className="text-[10px] text-[rgba(188,201,205,0.4)] mt-0.5 font-mono">
                                  {tx.createdAt ? new Date(tx.createdAt.seconds * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                                  {tx.remarks ? ` · ${tx.remarks}` : ""}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className={`text-sm font-bold font-mono tabular-nums ${isIncoming ? "text-[#4edea3]" : "text-[#ffb4ab]"}`}>
                                {isIncoming ? "+" : "-"}₹{(tx.amount ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                              </span>
                              <span className={`text-[9px] px-2 py-1 rounded-lg font-bold border font-mono ${
                                isFlagged
                                  ? "bg-[rgba(255,180,171,0.12)] text-[#ffb4ab] border-[rgba(255,180,171,0.25)]"
                                  : "bg-[rgba(78,222,163,0.10)] text-[#4edea3] border-[rgba(78,222,163,0.20)]"
                              }`}>
                                {isFlagged ? "⚠ FLAGGED" : "✓ SAFE"}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </GlassCard>
            </motion.div>

          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
