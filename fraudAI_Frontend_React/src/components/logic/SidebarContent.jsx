import { Link, useNavigate, useLocation } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { auth } from './firebase';
import { signOut } from 'firebase/auth';
import {
  Home, Ghost, Send, History, FileText, Users, Settings,
  HelpCircle as Help, LogOut, Upload, BarChart2, Play, Activity,
  GitCompare, ScanSearch, Layers, Brain, Microscope, ShieldAlert,
  Map, Calendar, Network, Eye, MessageSquare, TrendingDown, Zap,
  Shield, RefreshCw, Blend, Clock, QrCode, Wallet, HandCoins,
  BotMessageSquare, Bell, SplitSquareHorizontal, Target, Calculator,
  FileWarning, PiggyBank, Fingerprint, Flag, TrendingUp, HeartPulse,
  Trophy, Mic, Dna, Crosshair, BookOpen, ScanLine, GitFork,
  HeartHandshake, ShieldCheck, Phone, CreditCard, CalendarClock, Sparkles,
} from 'lucide-react';

/* ── Navigation structure ── */
const navGroups = [
  {
    label: null,
    items: [
      { icon: Home,           label: "Dashboard",    path: "/dashboard" },
      { icon: Bell,           label: "Notifications",path: "/notifications" },
    ],
  },
  {
    label: "Payments",
    items: [
      { icon: Send,                  label: "Send Money",        path: "/send-money" },
      { icon: QrCode,                label: "QR Pay",            path: "/qr-pay" },
      { icon: Phone,                 label: "Pay by Phone",      path: "/pay-by-phone" },
      { icon: HandCoins,             label: "Request Money",     path: "/request-money" },
      { icon: SplitSquareHorizontal, label: "Split Bill",        path: "/split-bill" },
      { icon: RefreshCw,             label: "Recurring",         path: "/recurring-payments" },
    ],
  },
  {
    label: "Finance",
    items: [
      { icon: Wallet,       label: "Budget",           path: "/budget" },
      { icon: Target,       label: "Savings Goals",    path: "/savings-goals" },
      { icon: Calculator,   label: "EMI Calculator",   path: "/emi-calculator" },
      { icon: PiggyBank,    label: "Budget Predictor", path: "/budget-predictor" },
      { icon: CalendarClock,label: "Cash Flow",        path: "/cashflow-forecast" },
      { icon: CreditCard,   label: "Link Bank",        path: "/bank-linking" },
    ],
  },
  {
    label: "Records",
    items: [
      { icon: History,  label: "Transactions",  path: "/transactions" },
      { icon: FileText, label: "Statements",    path: "/statements" },
      { icon: Users,    label: "Beneficiaries", path: "/beneficiaries" },
    ],
  },
  {
    label: "Security",
    items: [
      { icon: Zap,         label: "Live Fraud Feed",   path: "/live-fraud-feed" },
      { icon: FileWarning, label: "Dispute Center",    path: "/dispute-center" },
      { icon: Fingerprint, label: "Biometric Guard",   path: "/biometric-guard" },
      { icon: ShieldCheck, label: "Pre-Payment Shield",path: "/prepayment-shield" },
      { icon: Ghost,       label: "Ghost Hunter",      path: "/ghost-hunter" },
    ],
  },
  {
    label: "AI Intelligence",
    items: [
      { icon: BotMessageSquare, label: "AI Assistant",    path: "/ai-assistant" },
      { icon: Brain,            label: "Spending Coach",  path: "/spending-coach" },
      { icon: Mic,              label: "Voice Pay",       path: "/voice-pay" },
      { icon: Dna,              label: "Spending DNA",    path: "/spending-dna" },
      { icon: BookOpen,         label: "AI Chronicle",    path: "/financial-story" },
      { icon: ScanLine,         label: "Anomaly Explainer",path: "/anomaly-explainer" },
      { icon: Sparkles,         label: "Fin. Personality", path: "/financial-personality" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { icon: TrendingUp,   label: "Fraud Timeline",  path: "/fraud-timeline" },
      { icon: HeartPulse,   label: "Payment Health",  path: "/payment-health" },
      { icon: Crosshair,    label: "Future Risk AI",  path: "/future-risk" },
      { icon: GitFork,      label: "Fraud Ring",      path: "/fraud-ring" },
      { icon: HeartHandshake,label: "Health Score",   path: "/health-score" },
      { icon: Users,        label: "Contact Trust",   path: "/contact-trust" },
      { icon: Flag,         label: "Community",       path: "/community-reports" },
      { icon: ShieldAlert,  label: "Risk Profile",    path: "/risk-profile" },
      { icon: Map,          label: "Fraud Heatmap",   path: "/fraud-heatmap" },
      { icon: Trophy,       label: "Achievements",    path: "/security-badges" },
    ],
  },
  {
    label: "System",
    items: [
      { icon: Settings, label: "Settings",     path: "/settings" },
      { icon: Help,     label: "Help & Support",path: "/help-support" },
    ],
  },
];

const mlNavItems = [
  { icon: Upload,      label: "Upload Data",       path: "/upload-data" },
  { icon: BarChart2,   label: "Explore Data",      path: "/explore-data" },
  { icon: Play,        label: "Run Detection",     path: "/run-detection" },
  { icon: Activity,    label: "Results",           path: "/detection-results" },
  { icon: GitCompare,  label: "Model Comparison",  path: "/model-comparison" },
  { icon: ScanSearch,  label: "Check Transaction", path: "/check-transaction" },
  { icon: Layers,      label: "Batch Check",       path: "/batch-check" },
  { icon: Brain,       label: "AI Hub",            path: "/ai-hub" },
  { icon: Microscope,  label: "Feature Insights",  path: "/feature-insights" },
  { icon: Brain,       label: "Bulk Explain",      path: "/bulk-explain" },
  { icon: Clock,       label: "Score History",     path: "/score-history" },
  { icon: Eye,         label: "Watchlist",         path: "/watchlist" },
  { icon: Calendar,    label: "Fraud Calendar",    path: "/fraud-calendar" },
  { icon: Network,     label: "Network Analysis",  path: "/network-analysis" },
  { icon: TrendingDown,label: "Dataset Drift",     path: "/dataset-drift" },
  { icon: RefreshCw,   label: "Retrain Readiness", path: "/retraining-readiness" },
  { icon: Zap,         label: "Behavioral Analysis",path: "/behavioral-analysis" },
  { icon: Shield,      label: "Rule Engine",       path: "/rule-engine" },
  { icon: Blend,       label: "Risk Score Blend",  path: "/risk-score-blend" },
  { icon: MessageSquare,label: "Feedback Center",  path: "/feedback-center" },
];

/* ── Single nav item ── */
const NavItem = ({ icon: Icon, label, path, isActive }) => (
  <Link to={path}>
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 group cursor-pointer",
        isActive
          ? "text-[#dce1fb] border"
          : "text-[rgba(188,201,205,0.55)] hover:text-[#dce1fb] hover:bg-[rgba(220,225,251,0.05)]"
      )}
      style={isActive ? {
        background: "linear-gradient(90deg, rgba(76,215,246,0.12), rgba(208,188,255,0.06))",
        borderColor: "rgba(76,215,246,0.22)",
        boxShadow: "0 0 16px rgba(76,215,246,0.06), inset 0 1px 0 rgba(255,255,255,0.08)",
      } : {}}
    >
      <div
        className={cn(
          "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150",
          isActive
            ? "bg-[rgba(76,215,246,0.15)] text-[#4cd7f6]"
            : "text-[rgba(134,147,151,0.6)] group-hover:text-[rgba(188,201,205,0.8)] group-hover:bg-[rgba(220,225,251,0.06)]"
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="flex-1 truncate leading-none">{label}</span>
      {isActive && (
        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "#4cd7f6", boxShadow: "0 0 8px rgba(76,215,246,0.7)" }} />
      )}
    </div>
  </Link>
);

/* ── Section label colour map ── */
const SECTION_COLORS = {
  "Payments":       "linear-gradient(90deg,#38bdf8,#6366f1)",
  "Finance":        "linear-gradient(90deg,#34d399,#06b6d4)",
  "Records":        "linear-gradient(90deg,#a78bfa,#818cf8)",
  "Security":       "linear-gradient(90deg,#f87171,#fb923c)",
  "AI Intelligence":"linear-gradient(90deg,#e879f9,#a855f7)",
  "Analytics":      "linear-gradient(90deg,#fbbf24,#f59e0b)",
  "System":         "linear-gradient(90deg,#94a3b8,#64748b)",
  "ML Analytics":   "linear-gradient(90deg,#2dd4bf,#06b6d4)",
};

/* ── Section label ── */
const SectionLabel = ({ label }) => {
  const gradient = SECTION_COLORS[label] || "linear-gradient(90deg,#94a3b8,#64748b)";
  return (
    <p
      className="text-[10px] font-extrabold uppercase tracking-[0.2em] px-3 pt-5 pb-1.5 first:pt-2"
      style={{ background: gradient, WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent", display: "inline-block" }}
    >
      {label}
    </p>
  );
};

export default function SidebarContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* ── Brand ── */}
      <div className="px-5 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          {/* Shield logo mark */}
          <div className="relative flex-shrink-0 w-11 h-11">
            {/* Glow layers aligned to design system */}
            <div className="absolute inset-0 rounded-2xl blur-2xl opacity-55 scale-110" style={{ background: "linear-gradient(135deg,#4cd7f6,#d0bcff,#4edea3)" }} />
            <div className="absolute inset-0 rounded-2xl blur-md opacity-25" style={{ background: "linear-gradient(135deg,#4cd7f6,#d0bcff)" }} />
            <div
              className="relative w-11 h-11 flex items-center justify-center rounded-2xl shadow-xl"
              style={{ background: "linear-gradient(145deg, #4cd7f6 0%, #d0bcff 55%, #4edea3 100%)" }}
            >
              {/* Shield SVG with "A" lettermark */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <defs>
                  <linearGradient id="shieldInner" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
                    <stop offset="100%" stopColor="rgba(255,255,255,0.7)" />
                  </linearGradient>
                </defs>
                {/* Shield outline */}
                <path
                  d="M12 2L4 5.5V11c0 4.5 3.3 8.7 8 9.9 4.7-1.2 8-5.4 8-9.9V5.5L12 2z"
                  fill="rgba(255,255,255,0.15)"
                  stroke="rgba(255,255,255,0.5)"
                  strokeWidth="0.8"
                  strokeLinejoin="round"
                />
                {/* "A" lettermark inside shield */}
                <text x="12" y="15.5" textAnchor="middle" fontSize="9" fontWeight="900"
                  fontFamily="Arial,sans-serif" fill="url(#shieldInner)" letterSpacing="-0.5">A</text>
                {/* Top shield shine */}
                <path d="M9 6.5L12 5l3 1.5V10c0 1.5-1.1 2.9-3 3.3C9.1 12.9 8 11.5 8 10V6.5z"
                  fill="rgba(255,255,255,0.08)" />
              </svg>
            </div>
            {/* Live indicator */}
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 border-2 border-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/40">
              <span className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-50" />
            </span>
          </div>

          {/* Wordmark */}
          <div className="flex flex-col leading-none">
            <div className="flex items-end gap-0.5">
              <span className="text-xl font-black tracking-tight" style={{ background: "linear-gradient(90deg,#4cd7f6,#d0bcff)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent", display: "inline-block" }}>
                Aegis
              </span>
              <span className="text-xl font-black tracking-tight" style={{ background: "linear-gradient(90deg,#d0bcff,#4edea3)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent", display: "inline-block" }}>
                AI
              </span>
            </div>
            <span className="mt-0.5" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", background: "linear-gradient(90deg,#4cd7f6,#d0bcff)", WebkitBackgroundClip: "text", backgroundClip: "text", WebkitTextFillColor: "transparent", color: "transparent", display: "inline-block" }}>
              Neural Fraud Defense
            </span>
          </div>
        </div>

        {/* Status pill */}
        <div className="flex items-center justify-between px-3 py-2 rounded-xl border" style={{ background: "rgba(78,222,163,0.07)", borderColor: "rgba(78,222,163,0.18)" }}>
          <div className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: "#4edea3" }} />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: "#4edea3", boxShadow: "0 0 6px rgba(78,222,163,0.8)" }} />
            </span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: "#4edea3" }}>AI ENGINE LIVE</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap className="h-2.5 w-2.5 text-amber-400" />
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", color: "rgba(134,147,151,0.6)", fontWeight: 500 }}>Real-time</span>
          </div>
        </div>
      </div>

      {/* ── Scrollable nav ── */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-0.5">
        {navGroups.map((group, gi) => (
          <div key={gi}>
            {group.label && <SectionLabel label={group.label} />}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavItem
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  path={item.path}
                  isActive={location.pathname === item.path}
                />
              ))}
            </div>
          </div>
        ))}

        {/* ML Analytics section */}
        <div className="pt-4 mt-2 border-t border-white/[0.06]">
          <SectionLabel label="ML Analytics" />
          <div className="space-y-0.5">
            {mlNavItems.map((item) => (
              <NavItem
                key={item.path}
                icon={item.icon}
                label={item.label}
                path={item.path}
                isActive={location.pathname === item.path}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Logout ── */}
      <div className="flex-shrink-0 px-3 py-4 border-t" style={{ borderColor: "rgba(220,225,251,0.06)" }}>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 group"
          style={{ color: "rgba(134,147,151,0.6)" }}
          onMouseEnter={e => { e.currentTarget.style.color = "#ffb4ab"; e.currentTarget.style.background = "rgba(255,180,171,0.07)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "rgba(134,147,151,0.6)"; e.currentTarget.style.background = ""; }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ background: "rgba(220,225,251,0.04)" }}>
            <LogOut className="h-3.5 w-3.5" />
          </div>
          Logout
        </button>
      </div>
    </div>
  );
}
