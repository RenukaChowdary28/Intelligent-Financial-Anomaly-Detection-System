import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import {
  CreditCard, Smartphone, ShieldCheck, CheckCircle2,
  Loader, Eye, EyeOff, Lock, Wifi, Search,
  AlertCircle, Hash, IndianRupee, Copy, Check, Star, Zap,
  Shield, ArrowRight, RotateCcw, Sparkles, BadgeCheck, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ══════════════════════════════════════════════════════════════════════════════
// ALL INDIAN BANKS — Public, Private, Small Finance, Payment Banks
// ══════════════════════════════════════════════════════════════════════════════
const ALL_BANKS = [
  // ── Popular (shown first) ──────────────────────────────────────────────────
  { code:'HDFC',  name:'HDFC Bank',                   handle:'hdfcbank',   color:'#004C8F', tag:'private',  popular:true  },
  { code:'ICICI', name:'ICICI Bank',                  handle:'icici',      color:'#F7941D', tag:'private',  popular:true  },
  { code:'SBI',   name:'State Bank of India',         handle:'sbi',        color:'#22577A', tag:'public',   popular:true  },
  { code:'AXIS',  name:'Axis Bank',                   handle:'axisbank',   color:'#800000', tag:'private',  popular:true  },
  { code:'KOTAK', name:'Kotak Mahindra Bank',         handle:'kotak',      color:'#EF3E23', tag:'private',  popular:true  },
  { code:'PNB',   name:'Punjab National Bank',        handle:'pnb',        color:'#F15A29', tag:'public',   popular:true  },
  // ── Public Sector Banks ────────────────────────────────────────────────────
  { code:'BOB',   name:'Bank of Baroda',              handle:'barodampay', color:'#F26522', tag:'public'  },
  { code:'CAN',   name:'Canara Bank',                 handle:'canarabank', color:'#006837', tag:'public'  },
  { code:'UBI',   name:'Union Bank of India',         handle:'unionbank',  color:'#002060', tag:'public'  },
  { code:'BOI',   name:'Bank of India',               handle:'boi',        color:'#003399', tag:'public'  },
  { code:'IND',   name:'Indian Bank',                 handle:'indianbank', color:'#005A9C', tag:'public'  },
  { code:'CBI',   name:'Central Bank of India',       handle:'centralbank',color:'#CC0000', tag:'public'  },
  { code:'IOB',   name:'Indian Overseas Bank',        handle:'iob',        color:'#005B99', tag:'public'  },
  { code:'UCO',   name:'UCO Bank',                    handle:'ucobank',    color:'#003366', tag:'public'  },
  { code:'BOM',   name:'Bank of Maharashtra',         handle:'mahb',       color:'#1B6CA8', tag:'public'  },
  { code:'PSB',   name:'Punjab & Sind Bank',          handle:'psb',        color:'#1F4E79', tag:'public'  },
  // ── Private Sector Banks ───────────────────────────────────────────────────
  { code:'YES',   name:'Yes Bank',                    handle:'yesbank',    color:'#003087', tag:'private' },
  { code:'IDFC',  name:'IDFC First Bank',             handle:'idfcbank',   color:'#1A3C6D', tag:'private' },
  { code:'INDUS', name:'IndusInd Bank',               handle:'indus',      color:'#6B2D8B', tag:'private' },
  { code:'FED',   name:'Federal Bank',                handle:'federal',    color:'#003087', tag:'private' },
  { code:'SIB',   name:'South Indian Bank',           handle:'sib',        color:'#003399', tag:'private' },
  { code:'KVB',   name:'Karur Vysya Bank',            handle:'kvb',        color:'#8B0000', tag:'private' },
  { code:'CUB',   name:'City Union Bank',             handle:'cityunion',  color:'#005B99', tag:'private' },
  { code:'BAN',   name:'Bandhan Bank',                handle:'bandhan',    color:'#E31E24', tag:'private' },
  { code:'RBL',   name:'RBL Bank',                    handle:'rbl',        color:'#E31E24', tag:'private' },
  { code:'DCB',   name:'DCB Bank',                    handle:'dcb',        color:'#004B87', tag:'private' },
  { code:'TAMI',  name:'Tamilnad Mercantile Bank',    handle:'tmb',        color:'#003366', tag:'private' },
  { code:'KARU',  name:'Karnataka Bank',              handle:'kbl',        color:'#004B87', tag:'private' },
  { code:'NAIN',  name:'Nainital Bank',               handle:'nainital',   color:'#006837', tag:'private' },
  { code:'CSB',   name:'CSB Bank',                    handle:'csb',        color:'#CC0000', tag:'private' },
  { code:'DHANA', name:'Dhanlaxmi Bank',              handle:'dhanbank',   color:'#F26522', tag:'private' },
  { code:'LAXMI', name:'Lakshmi Vilas Bank',          handle:'lvbank',     color:'#005A9C', tag:'private' },
  // ── Small Finance Banks ────────────────────────────────────────────────────
  { code:'AU',    name:'AU Small Finance Bank',       handle:'aubank',     color:'#E31E24', tag:'small'   },
  { code:'UJJ',   name:'Ujjivan Small Finance Bank',  handle:'ujjivan',    color:'#FF6B00', tag:'small'   },
  { code:'JANA',  name:'Jana Small Finance Bank',     handle:'janabank',   color:'#004B87', tag:'small'   },
  { code:'ESAF',  name:'ESAF Small Finance Bank',     handle:'esaf',       color:'#009900', tag:'small'   },
  { code:'EQUI',  name:'Equitas Small Finance Bank',  handle:'equitas',    color:'#FF4500', tag:'small'   },
  { code:'SURYOD',name:'Suryoday Small Finance Bank', handle:'suryoday',   color:'#FF8C00', tag:'small'   },
  { code:'NORTH', name:'North East Small Fin Bank',   handle:'nesfb',      color:'#2E8B57', tag:'small'   },
  { code:'UTKAR', name:'Utkarsh Small Finance Bank',  handle:'utkarsh',    color:'#8B008B', tag:'small'   },
  { code:'FINC',  name:'Fincare Small Finance Bank',  handle:'fincarebank',color:'#20B2AA', tag:'small'   },
  // ── Payment Banks ──────────────────────────────────────────────────────────
  { code:'AIR',   name:'Airtel Payments Bank',        handle:'airtel',     color:'#E40000', tag:'payment' },
  { code:'IPPB',  name:'India Post Payments Bank',    handle:'ippb',       color:'#CC0000', tag:'payment' },
  { code:'FINO',  name:'Fino Payments Bank',          handle:'fino',       color:'#FF6B00', tag:'payment' },
  { code:'JIO',   name:'Jio Payments Bank',           handle:'jio',        color:'#0066CC', tag:'payment' },
  { code:'NSDL',  name:'NSDL Payments Bank',          handle:'nsdl',       color:'#003366', tag:'payment' },
];

const TAG_LABEL = { public:'Public', private:'Private', small:'Small Finance', payment:'Payment Bank' };
const TAG_STYLE = {
  public:  'bg-blue-900/40 text-blue-300 border-blue-700/40',
  private: 'bg-violet-900/40 text-violet-300 border-violet-700/40',
  small:   'bg-amber-900/40 text-amber-300 border-amber-700/40',
  payment: 'bg-emerald-900/40 text-emerald-300 border-emerald-700/40',
};

// ── Luhn check ────────────────────────────────────────────────────────────────
function luhnCheck(num) {
  const d = num.replace(/\D/g, '');
  if (d.length < 13) return false;
  let sum = 0, alt = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = parseInt(d[i], 10);
    if (alt) { n *= 2; if (n > 9) n -= 9; }
    sum += n; alt = !alt;
  }
  return sum % 10 === 0;
}

// ── Card network from first digits ────────────────────────────────────────────
function detectNetwork(num) {
  const d = num.replace(/\D/g, '');
  if (!d) return null;
  if (d[0] === '4') return 'Visa';
  if (d[0] === '5') return 'Mastercard';
  if (d.startsWith('2') && parseInt(d.slice(0,4)) >= 2221 && parseInt(d.slice(0,4)) <= 2720) return 'Mastercard';
  if (d[0] === '6') return 'RuPay';
  if (d.startsWith('34') || d.startsWith('37')) return 'Amex';
  return null;
}

const NET_CFG = {
  Visa:       { bg: '#1A1F71', label: 'VISA',   cls: 'italic text-white font-black tracking-tight' },
  Mastercard: { bg: '#1c1c1c', label: '●●',     cls: 'text-orange-400 font-black text-lg' },
  RuPay:      { bg: '#0051a2', label: 'RuPay',  cls: 'text-white font-bold text-[9px]' },
  Amex:       { bg: '#006FCF', label: 'AMEX',   cls: 'text-white font-bold text-[9px]' },
};

function NetBadge({ network, size = 'sm' }) {
  const cfg = NET_CFG[network];
  if (!cfg) return null;
  return (
    <span className={`${size==='lg' ? 'px-2.5 py-1 text-xs' : 'px-1.5 py-0.5 text-[9px]'} rounded font-bold inline-flex items-center ${cfg.cls}`}
      style={{ background: cfg.bg }}>{cfg.label}</span>
  );
}

// ── Step bar ──────────────────────────────────────────────────────────────────
const STEPS = ['Mobile','OTP','Bank','Card','UPI PIN'];
function StepBar({ current }) {
  return (
    <div className="flex items-start gap-0 mb-8">
      {STEPS.map((s, i) => {
        const id = i + 1;
        const done = current > id;
        const active = current === id;
        return (
          <div key={id} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1 flex-shrink-0">
              <motion.div animate={{ scale: active ? 1.12 : 1 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                  ${done   ? 'bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30'
                  : active ? 'bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-500/30'
                  :          'bg-slate-950 border-white/[0.08] text-slate-500'}`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : id}
              </motion.div>
              <span className={`text-[9px] font-medium whitespace-nowrap ${active ? 'text-blue-300' : done ? 'text-emerald-400' : 'text-slate-600'}`}>{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 mb-4 rounded transition-all duration-500 ${done ? 'bg-emerald-500' : 'bg-gray-800'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 3-D Flipping ATM Card ─────────────────────────────────────────────────────
function ATMCard({ number, expiry, name, network, bankColor, flipped }) {
  const raw  = number.replace(/\s/g, '');
  const bg   = bankColor ? (bankColor.startsWith('#') ? bankColor : `#${bankColor}`) : '#1e3a8a';
  // Render 4 fixed groups of 4 — digits or dots — no spacing inconsistency
  const groups = [0, 4, 8, 12].map(i => raw.slice(i, i + 4).padEnd(4, '•'));

  return (
    <div className="relative w-full h-48 perspective-1000">
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 80, damping: 15 }}
        className="relative w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Front */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
          style={{ backfaceVisibility: 'hidden', background: `linear-gradient(135deg, ${bg}ee, ${bg}88)` }}>
          {/* Shine overlay */}
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(120deg, rgba(255,255,255,0.12) 0%, transparent 60%)' }} />
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-[0.06]"
            style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 28px,white 28px,white 29px),repeating-linear-gradient(90deg,transparent,transparent 28px,white 28px,white 29px)' }} />
          <div className="relative z-10 p-5 h-full flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-white/50 uppercase tracking-widest font-medium">AegisAI Bank</p>
                <p className="text-xs text-white/80 font-semibold truncate max-w-[160px]">{name || 'Account Holder'}</p>
              </div>
              {network && <NetBadge network={network} size="lg" />}
            </div>
            {/* Chip + contactless */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-7 rounded-md border border-yellow-300/30 grid grid-cols-2 grid-rows-3 gap-px p-1"
                style={{ background: 'linear-gradient(135deg,#d4a843,#f0c040)' }}>
                {Array(6).fill(0).map((_,i) => <div key={i} className="rounded-sm bg-yellow-600/40" />)}
              </div>
              <Wifi className="w-5 h-5 text-white/40 rotate-90" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                {groups.map((g, i) => (
                  <span key={i} className="text-[17px] font-mono text-white tracking-widest leading-none">{g}</span>
                ))}
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[8px] text-white/40 uppercase tracking-widest">Valid Thru</p>
                  <p className="text-sm text-white font-mono">{expiry || 'MM/YY'}</p>
                </div>
                <div className="text-right">
                  <p className="text-[8px] text-white/40 uppercase tracking-widest">Type</p>
                  <p className="text-xs text-white/70">Debit</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 rounded-3xl overflow-hidden shadow-2xl"
          style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)',
            background: `linear-gradient(135deg, ${bg}ee, ${bg}88)` }}>
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(120deg, rgba(255,255,255,0.08) 0%, transparent 60%)' }} />
          <div className="relative z-10 h-full flex flex-col">
            <div className="h-10 w-full mt-7 bg-gray-900/70" />
            <div className="px-5 mt-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 h-9 bg-gray-200/10 rounded" />
                <div className="w-14 h-9 bg-white/90 rounded flex items-center justify-center">
                  <p className="text-slate-200 font-mono text-sm font-bold">CVV</p>
                </div>
              </div>
              <p className="text-[9px] text-white/30 text-center leading-relaxed">
                This card is issued by AegisAI Financial Services.<br />
                Use of this card is subject to the cardholder agreement.
              </p>
              {network && <div className="flex justify-end"><NetBadge network={network} size="lg" /></div>}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// ── Bank grid card ─────────────────────────────────────────────────────────────
function BankCard({ bank, selected, onSelect }) {
  const initials = bank.name.split(' ').map(w => w[0]).slice(0,2).join('');
  return (
    <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
      onClick={() => onSelect(bank)}
      className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border text-center transition-all
        ${selected ? 'border-blue-500 bg-blue-900/30 shadow-lg shadow-blue-500/20' : 'border-white/[0.05] bg-gray-900/60 hover:border-white/[0.09] hover:bg-white/[0.04]/60'}`}>
      {bank.popular && !selected && (
        <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center">
          <Star className="w-2.5 h-2.5 text-white" />
        </div>
      )}
      {selected && (
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <Check className="w-3 h-3 text-white" />
        </div>
      )}
      <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg flex-shrink-0"
        style={{ background: bank.color.startsWith('#') ? bank.color : `#${bank.color}` }}>
        {initials}
      </div>
      <p className={`text-[10px] font-semibold leading-tight ${selected ? 'text-blue-200' : 'text-slate-300'}`}>
        {bank.name.replace('Bank','').replace('Mahindra','').trim()}
      </p>
      <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-medium ${TAG_STYLE[bank.tag] || 'bg-gray-800 text-slate-400 border-white/[0.07]'}`}>
        {TAG_LABEL[bank.tag]}
      </span>
    </motion.button>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export default function BankLinking() {
  const navigate = useNavigate();
  const [user, setUser]     = useState(null);
  const [step, setStep]     = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');

  // Step 1
  const [mobile, setMobile] = useState('');
  const [demoOtp, setDemoOtp] = useState('');

  // Step 2
  const [otp, setOtp]       = useState(['','','','','','']);
  const otpRefs             = useRef([]);

  // Step 3 — bank
  const [bankSearch, setBankSearch]   = useState('');
  const [bankFilter, setBankFilter]   = useState('all');
  const [selBank, setSelBank]         = useState(null);

  // Step 4 — card
  const [cardNum, setCardNum]   = useState('');
  const [cardExp, setCardExp]   = useState('');
  const [cardCvv, setCardCvv]   = useState('');
  const [cardFlipped, setCardFlipped] = useState(false);
  const [cardName, setCardName] = useState('');
  const [accountType, setAccType] = useState('savings');
  const [network, setNetwork]   = useState(null);
  const [luhnOk, setLuhnOk]     = useState(null); // null|true|false
  const [binBank, setBinBank]   = useState(null);
  const [binLoading, setBinLoading] = useState(false);

  // Step 5 — UPI
  const [upiChoice, setUpiChoice] = useState(0); // index of suggestion
  const [customUpi, setCustomUpi] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [upiPin, setUpiPin]       = useState('');
  const [upiPin2, setUpiPin2]     = useState('');
  const [showPin, setShowPin]     = useState(false);
  const [secScore, setSecScore]   = useState(0);

  // Success
  const [linked, setLinked] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => { const u = onAuthStateChanged(auth, u => { setUser(u); if (u) setCardName(u.displayName || ''); }); return u; }, []);

  // Security score
  useEffect(() => {
    let s = 0;
    if (upiPin.length === 6) s += 40;
    if (upiPin === upiPin2 && upiPin.length === 6) s += 30;
    if (!/^(\d)\1{5}$/.test(upiPin) && upiPin.length === 6) s += 20; // no all-same digits
    if (upiPin !== '123456' && upiPin !== '654321' && upiPin.length === 6) s += 10;
    setSecScore(s);
  }, [upiPin, upiPin2]);

  // UPI ID suggestions
  const m10 = mobile.replace(/\D/g,'').slice(-10);
  const handle = selBank?.handle || 'bank';
  const displayName = (user?.displayName || cardName || 'user').toLowerCase().replace(/\s/g,'').slice(0,15);
  const UPI_SUGGESTIONS = [
    `${m10}@${handle}`,
    `${displayName}@${handle}`,
    `${displayName}${m10.slice(-4)}@${handle}`,
  ];
  const finalUpi = useCustom ? customUpi : UPI_SUGGESTIONS[upiChoice] || UPI_SUGGESTIONS[0];

  // ── Step 1: send OTP ───────────────────────────────────────────────────────
  const sendOtp = async () => {
    const m = mobile.replace(/\D/g,'').slice(-10);
    if (m.length !== 10) { setError('Enter a valid 10-digit mobile number'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/api/otp/send`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mobile: m }) });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Failed to send OTP'); setLoading(false); return; }
      setDemoOtp(d.demo_otp || '');
      if (d.demo_otp) setOtp(d.demo_otp.split(''));
      setStep(2);
    } catch { setError('Backend not reachable — check if Flask server is running'); }
    setLoading(false);
  };

  // ── Step 2: verify OTP ─────────────────────────────────────────────────────
  const verifyOtp = async () => {
    const code = otp.join('');
    if (code.length < 6) { setError('Enter the 6-digit OTP'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/api/otp/verify`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ mobile: m10, otp: code }) });
      const d = await res.json();
      if (!res.ok || !d.verified) { setError(d.error || 'Incorrect OTP'); setLoading(false); return; }
      setStep(3);
    } catch { setError('Network error'); }
    setLoading(false);
  };

  const handleOtpKey = (i, e) => {
    const val = e.target.value.replace(/\D/g,'').slice(-1);
    const n = [...otp]; n[i] = val; setOtp(n);
    if (val && i < 5) otpRefs.current[i+1]?.focus();
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i-1]?.focus();
  };

  // ── Card number change — BIN + Luhn ───────────────────────────────────────
  const onCardNum = async (raw) => {
    const digits = raw.replace(/\D/g,'').slice(0,16);
    const spaced = digits.replace(/(.{4})/g,'$1 ').trim();
    setCardNum(spaced);
    const net = detectNetwork(digits);
    setNetwork(net);
    if (digits.length === 16) { setLuhnOk(luhnCheck(digits)); }
    else setLuhnOk(null);
    if (digits.length >= 6) {
      setBinLoading(true);
      try {
        const res = await fetch(`${API}/api/card/bin`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ cardNumber: digits }) });
        const d = await res.json();
        setBinBank(d.found ? d : null);
      } catch { setBinBank(null); }
      setBinLoading(false);
    } else { setBinBank(null); }
  };

  // ── Step 5: link account ───────────────────────────────────────────────────
  const linkAccount = async () => {
    if (upiPin.length < 6)     { setError('UPI PIN must be 6 digits'); return; }
    if (upiPin !== upiPin2)    { setError('PINs do not match'); return; }
    if (!finalUpi.includes('@')) { setError('Invalid UPI ID'); return; }
    setError(''); setLoading(true);
    try {
      const res = await fetch(`${API}/api/account/link`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ uid: user?.uid || 'demo', mobile: m10, bank: selBank, upiId: finalUpi, cardLast4: cardNum.replace(/\s/g,'').slice(-4) }),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.error || 'Linking failed'); setLoading(false); return; }

      // Also save to Firestore directly
      if (user?.uid) {
        try {
          await setDoc(doc(db, 'users', user.uid), {
            phoneNumber: '+91' + m10,
            upiId: finalUpi,
            linkedBank: selBank?.name,
            upiHandle: selBank?.handle,
            cardLast4: cardNum.replace(/\s/g,'').slice(-4),
            cardNetwork: network,
            accountType,
            accountLinked: true,
            linkedAt: serverTimestamp(),
          }, { merge: true });
        } catch { /* Firestore optional */ }
      }

      setLinked({ upiId: finalUpi, bank: selBank, last4: cardNum.replace(/\s/g,'').slice(-4), network, accountType });
      setStep(6);
    } catch { setError('Network error'); }
    setLoading(false);
  };

  const copyUpi = () => { navigator.clipboard.writeText(linked?.upiId || ''); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  const slide = { initial:{ opacity:0, x:30 }, animate:{ opacity:1, x:0 }, exit:{ opacity:0, x:-20 } };

  // Filter banks
  const filterBanks = () => {
    let list = bankFilter === 'popular' ? ALL_BANKS.filter(b => b.popular) : bankFilter === 'all' ? ALL_BANKS : ALL_BANKS.filter(b => b.tag === bankFilter);
    if (bankSearch) list = list.filter(b => b.name.toLowerCase().includes(bankSearch.toLowerCase()) || b.handle.includes(bankSearch.toLowerCase()));
    return list;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-10">
      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.1] transition-all flex-shrink-0">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 flex items-center justify-center shadow-xl shadow-blue-600/30">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Link Bank Account</h1>
            <p className="text-xs text-slate-400">NPCI · UPI · All Indian Banks</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 bg-emerald-900/30 border border-emerald-700/30 rounded-full">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span className="text-[10px] text-emerald-300 font-medium">Secured</span>
          </div>
        </div>

        {step < 6 && <StepBar current={step} />}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              className="flex items-center gap-2 px-3 py-2.5 bg-red-900/20 border border-red-700/30 rounded-xl text-sm text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">

          {/* ═══ STEP 1: Mobile ════════════════════════════════════════════════ */}
          {step === 1 && (
            <motion.div key="s1" {...slide} className="space-y-4">
              <div className="bg-gray-900 border border-white/[0.05] rounded-3xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-900/50 flex items-center justify-center"><Smartphone className="w-4 h-4 text-cyan-400" /></div>
                  <div><p className="text-sm font-semibold">Enter Mobile Number</p><p className="text-xs text-slate-500">Registered with your bank</p></div>
                </div>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-3 bg-gray-800 border border-white/[0.07] rounded-xl text-sm text-white font-mono shrink-0">
                    🇮🇳 <span className="text-slate-400">+91</span>
                  </div>
                  <Input value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g,'').slice(0,10))}
                    placeholder="9876543210" maxLength={10}
                    className="bg-slate-900/80 border-white/[0.07] text-white font-mono text-lg tracking-widest flex-1" />
                </div>
                <p className="text-xs text-slate-600">We'll discover banks linked to this number via NPCI and send a one-time password.</p>
              </div>
              <Button onClick={sendOtp} disabled={loading || mobile.replace(/\D/g,'').length !== 10}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-cyan-500 font-bold py-5 text-base rounded-2xl gap-2 shadow-xl shadow-blue-600/25 transition-all">
                {loading ? <><Loader className="w-4 h-4 animate-spin" /> Sending OTP…</> : <>Send OTP <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </motion.div>
          )}

          {/* ═══ STEP 2: OTP ═══════════════════════════════════════════════════ */}
          {step === 2 && (
            <motion.div key="s2" {...slide} className="space-y-4">
              <div className="bg-gray-900 border border-white/[0.05] rounded-3xl p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-900/50 flex items-center justify-center"><Hash className="w-4 h-4 text-violet-400" /></div>
                  <div><p className="text-sm font-semibold">Verify OTP</p><p className="text-xs text-slate-500">Sent to +91 {mobile.slice(0,5)}XXXXX</p></div>
                </div>
                <div className="flex justify-center gap-2">
                  {otp.map((d,i) => (
                    <input key={i} ref={el => otpRefs.current[i]=el} value={d} onChange={() => {}} onKeyDown={e => handleOtpKey(i,e)} maxLength={1}
                      className="w-12 h-14 text-center text-xl font-bold bg-gray-800 border-2 border-white/[0.07] focus:border-cyan-500/50 rounded-xl text-white outline-none transition-colors" />
                  ))}
                </div>
                {demoOtp && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-900/20 border border-blue-700/30 rounded-xl text-xs text-blue-300">
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    Demo mode — OTP auto-filled: <span className="font-mono font-bold ml-1 tracking-widest">{demoOtp}</span>
                  </div>
                )}
                <button onClick={() => { setStep(1); setOtp(['','','','','','']); }} className="text-xs text-slate-500 hover:text-slate-300 w-full text-center">← Change number</button>
              </div>
              <Button onClick={verifyOtp} disabled={loading || otp.join('').length < 6}
                className="w-full bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 font-bold py-5 text-base rounded-2xl gap-2">
                {loading ? <><Loader className="w-4 h-4 animate-spin" /> Verifying…</> : <>Verify &amp; Continue <ArrowRight className="w-4 h-4" /></>}
              </Button>
            </motion.div>
          )}

          {/* ═══ STEP 3: Bank Selection ═════════════════════════════════════════ */}
          {step === 3 && (
            <motion.div key="s3" {...slide} className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input value={bankSearch} onChange={e => setBankSearch(e.target.value)}
                  placeholder="Search 45+ banks…"
                  className="pl-9 bg-slate-950 border-white/[0.08] text-white" />
              </div>

              {/* Filter tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                {[['all','All Banks'],['popular','⭐ Popular'],['public','Public'],['private','Private'],['small','Small Fin.'],['payment','Payment']].map(([val,label]) => (
                  <button key={val} onClick={() => setBankFilter(val)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0
                      ${bankFilter===val ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-950 border-white/[0.08] text-slate-400 hover:border-white/[0.09]'}`}>
                    {label}
                  </button>
                ))}
              </div>

              {/* Bank count */}
              <p className="text-xs text-slate-500">{filterBanks().length} banks available</p>

              {/* Bank grid */}
              <div className="grid grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                {filterBanks().map(b => (
                  <BankCard key={b.code} bank={b} selected={selBank?.code === b.code} onSelect={b => { setSelBank(b); setTimeout(() => setStep(4), 200); }} />
                ))}
              </div>

              {filterBanks().length === 0 && (
                <div className="py-8 text-center text-slate-500 text-sm">No banks match your search.</div>
              )}
            </motion.div>
          )}

          {/* ═══ STEP 4: ATM Card ══════════════════════════════════════════════ */}
          {step === 4 && (
            <motion.div key="s4" {...slide} className="space-y-4">
              {/* 3D Card */}
              <ATMCard number={cardNum} expiry={cardExp} name={cardName} network={network} bankColor={selBank?.color} flipped={cardFlipped} />

              {/* Mismatch warning */}
              {binBank?.found && selBank && binBank.upi_handle !== selBank.handle && (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
                  className="flex items-center gap-2 px-3 py-2.5 bg-amber-900/20 border border-amber-700/30 rounded-xl text-xs text-amber-300">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  Card detected as <strong>{binBank.bank}</strong> but you selected <strong>{selBank.name}</strong>. Verify your bank.
                </motion.div>
              )}

              <div className="bg-gray-900 border border-white/[0.05] rounded-3xl p-5 space-y-4">
                {/* Selected bank header */}
                <div className="flex items-center gap-3 pb-3 border-b border-white/[0.06]">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-black"
                    style={{ background: selBank?.color?.startsWith('#') ? selBank.color : `#${selBank?.color}` }}>
                    {selBank?.name?.split(' ').map(w=>w[0]).slice(0,2).join('')}
                  </div>
                  <div className="flex-1"><p className="text-sm font-semibold">{selBank?.name}</p><p className="text-xs text-slate-500">@{selBank?.handle}</p></div>
                  <button onClick={() => setStep(3)} className="text-xs text-cyan-400 hover:text-blue-300">Change</button>
                </div>

                {/* Card number */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400">Card Number</label>
                  <div className="relative">
                    <Input value={cardNum} onChange={e => onCardNum(e.target.value)} placeholder="1234 5678 9012 3456" maxLength={19}
                      className="bg-slate-900/80 border-white/[0.07] text-white font-mono pr-28" />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                      {binLoading && <Loader className="w-3 h-3 text-slate-500 animate-spin" />}
                      {luhnOk === true  && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                      {luhnOk === false && <AlertCircle  className="w-3.5 h-3.5 text-amber-400"  />}
                      {network && <NetBadge network={network} />}
                    </div>
                  </div>
                  {luhnOk === true  && <p className="text-xs text-emerald-400 flex items-center gap-1"><BadgeCheck className="w-3 h-3" /> Valid card number (Luhn ✓)</p>}
                  {luhnOk === false && <p className="text-xs text-amber-400">Card number may be invalid — bank will verify</p>}
                  {binBank?.found   && <p className="text-xs text-blue-300">Detected: {binBank.bank} · {binBank.type} · {binBank.network}</p>}
                </div>

                {/* Name on card */}
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-400">Name on Card</label>
                  <Input value={cardName} onChange={e => setCardName(e.target.value)} placeholder="As printed on card"
                    className="bg-slate-900/80 border-white/[0.07] text-white" />
                </div>

                {/* Expiry + CVV */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">Expiry MM/YY</label>
                    <Input value={cardExp}
                      onChange={e => {
                        let d = e.target.value.replace(/\D/g,'').slice(0, 4);
                        if (d.length >= 2) {
                          const mm = Math.min(12, Math.max(1, parseInt(d.slice(0,2)) || 1));
                          d = String(mm).padStart(2,'0') + d.slice(2);
                        }
                        setCardExp(d.length >= 3 ? d.slice(0,2) + '/' + d.slice(2) : d);
                      }}
                      placeholder="12/27" maxLength={5} className="bg-slate-900/80 border-white/[0.07] text-white font-mono" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">CVV</label>
                    <div className="relative">
                      <Input type="password" value={cardCvv} maxLength={4}
                        onFocus={() => setCardFlipped(true)}
                        onBlur={() => setCardFlipped(false)}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g,'').slice(0,4))}
                        placeholder="•••" className="bg-slate-900/80 border-white/[0.07] text-white font-mono" />
                    </div>
                  </div>
                </div>

                {/* Account type */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-400">Account Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[['savings','Savings','Day-to-day banking'],['current','Current','Business account'],['salary','Salary','Employer linked'],['nri','NRI','Non-resident Indian']].map(([val,label,desc]) => (
                      <button key={val} onClick={() => setAccType(val)}
                        className={`p-2.5 rounded-xl border text-left transition-all ${accountType===val ? 'border-blue-500 bg-blue-900/30' : 'border-white/[0.07] hover:border-white/[0.09]'}`}>
                        <p className={`text-xs font-semibold ${accountType===val ? 'text-blue-200' : 'text-slate-300'}`}>{label}</p>
                        <p className="text-[10px] text-slate-500">{desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[10px] text-slate-600 flex items-center gap-1.5"><Lock className="w-3 h-3" /> Card details are used only for identity verification — not stored on our servers.</p>
              </div>

              <Button onClick={() => {
                const digits = cardNum.replace(/\s/g,'');
                if (digits.length < 16)               { setError('Enter full 16-digit card number'); return; }
                if (!/^\d{2}\/\d{2}$/.test(cardExp)) { setError('Enter expiry as MM/YY (e.g. 12/27)'); return; }
                const [mm, yy] = cardExp.split('/');
                const mon = parseInt(mm, 10), yr = 2000 + parseInt(yy, 10);
                if (mon < 1 || mon > 12)              { setError('Expiry month must be 01–12'); return; }
                const now = new Date();
                if (yr < now.getFullYear() || (yr === now.getFullYear() && mon < now.getMonth() + 1))
                                                      { setError('Card expiry date is in the past'); return; }
                if (cardCvv.length < 3)               { setError('Enter CVV (3 or 4 digits)'); return; }
                setError(''); setStep(5);
              }} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 font-bold py-5 text-base rounded-2xl gap-2">
                Verify Card <ArrowRight className="w-4 h-4" />
              </Button>
            </motion.div>
          )}

          {/* ═══ STEP 5: UPI ID & PIN ═══════════════════════════════════════════ */}
          {step === 5 && (
            <motion.div key="s5" {...slide} className="space-y-4">
              <div className="bg-gray-900 border border-white/[0.05] rounded-3xl p-5 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-900/50 flex items-center justify-center"><IndianRupee className="w-4 h-4 text-emerald-400" /></div>
                  <div><p className="text-sm font-semibold">Choose UPI ID</p><p className="text-xs text-slate-500">Your payment address</p></div>
                </div>

                {/* UPI suggestions */}
                <div className="space-y-2">
                  {UPI_SUGGESTIONS.map((s, i) => (
                    <button key={i} onClick={() => { setUpiChoice(i); setUseCustom(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all
                        ${!useCustom && upiChoice===i ? 'border-emerald-500 bg-emerald-900/20' : 'border-white/[0.07] hover:border-white/[0.09]'}`}>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center
                        ${!useCustom && upiChoice===i ? 'border-emerald-500 bg-emerald-500' : 'border-white/[0.09]'}`}>
                        {!useCustom && upiChoice===i && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className={`text-sm font-mono ${!useCustom && upiChoice===i ? 'text-emerald-300' : 'text-slate-300'}`}>{s}</span>
                      {i === 0 && <span className="ml-auto text-[9px] bg-blue-900/50 text-blue-300 border border-blue-700/30 px-1.5 py-0.5 rounded-full">Recommended</span>}
                    </button>
                  ))}

                  {/* Custom UPI */}
                  <button onClick={() => setUseCustom(true)}
                    className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border text-left transition-all
                      ${useCustom ? 'border-violet-500 bg-violet-900/20' : 'border-white/[0.07] hover:border-white/[0.09]'}`}>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${useCustom ? 'border-violet-500 bg-violet-500' : 'border-white/[0.09]'}`}>
                      {useCustom && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <span className="text-sm text-slate-400">Custom UPI ID</span>
                  </button>
                  {useCustom && (
                    <div className="flex gap-1">
                      <Input value={customUpi.split('@')[0] || ''} onChange={e => setCustomUpi(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g,'')+`@${handle}`)}
                        placeholder="yourname" className="bg-slate-900/80 border-white/[0.07] text-white font-mono" />
                      <div className="flex items-center px-3 bg-gray-800 border border-white/[0.07] rounded-xl text-slate-400 text-sm font-mono shrink-0">
                        @{handle}
                      </div>
                    </div>
                  )}
                </div>

                {/* Final UPI ID preview */}
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-800 border border-white/[0.07] rounded-xl">
                  <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                  <p className="text-sm font-mono text-emerald-300 flex-1">{finalUpi}</p>
                  <p className="text-[10px] text-slate-500">Your UPI ID</p>
                </div>
              </div>

              {/* UPI PIN */}
              <div className="bg-gray-900 border border-white/[0.05] rounded-3xl p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-violet-900/50 flex items-center justify-center"><Lock className="w-4 h-4 text-violet-400" /></div>
                  <div><p className="text-sm font-semibold">Set UPI PIN</p><p className="text-xs text-slate-500">6-digit PIN for all payments</p></div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">New UPI PIN</label>
                    <div className="relative">
                      <Input type={showPin?'text':'password'} value={upiPin}
                        onChange={e => setUpiPin(e.target.value.replace(/\D/g,'').slice(0,6))}
                        placeholder="••••••" maxLength={6} className="bg-slate-900/80 border-white/[0.07] text-white font-mono pr-9" />
                      <button onClick={() => setShowPin(p=>!p)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                        {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-slate-400">Confirm PIN</label>
                    <Input type="password" value={upiPin2}
                      onChange={e => setUpiPin2(e.target.value.replace(/\D/g,'').slice(0,6))}
                      placeholder="••••••" maxLength={6} className="bg-slate-900/80 border-white/[0.07] text-white font-mono" />
                  </div>
                </div>

                {/* PIN strength */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500">PIN strength</span>
                    <span className={secScore >= 80 ? 'text-emerald-400' : secScore >= 50 ? 'text-amber-400' : 'text-red-400'}>
                      {secScore >= 80 ? 'Strong' : secScore >= 50 ? 'Medium' : 'Weak'}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full" animate={{ width: `${secScore}%` }} transition={{ duration: 0.4 }}
                      style={{ background: secScore >= 80 ? '#10b981' : secScore >= 50 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                </div>

                {upiPin.length === 6 && upiPin2.length === 6 && (
                  <motion.p initial={{ opacity:0 }} animate={{ opacity:1 }}
                    className={`text-xs flex items-center gap-1 ${upiPin===upiPin2 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {upiPin===upiPin2 ? <><CheckCircle2 className="w-3 h-3" /> PINs match — ready to link</> : '✗ PINs do not match'}
                  </motion.p>
                )}
              </div>

              <Button onClick={linkAccount} disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-bold py-5 text-base rounded-2xl gap-2 shadow-xl shadow-emerald-600/20">
                {loading ? <><Loader className="w-4 h-4 animate-spin" /> Linking Account…</> : <><ShieldCheck className="w-5 h-5" /> Link Bank Account</>}
              </Button>
            </motion.div>
          )}

          {/* ═══ STEP 6: Success ═══════════════════════════════════════════════ */}
          {step === 6 && linked && (
            <motion.div key="s6" initial={{ opacity:0, scale:0.95 }} animate={{ opacity:1, scale:1 }} className="space-y-4">
              {/* Confetti-style success card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-emerald-900/70 via-teal-900/60 to-green-900/70 border border-emerald-700/40 rounded-3xl p-7 text-center space-y-4">
                <div className="absolute inset-0 opacity-[0.06]"
                  style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
                <motion.div initial={{ scale:0, rotate:-30 }} animate={{ scale:1, rotate:0 }}
                  transition={{ type:'spring', stiffness:200, damping:12 }} className="relative z-10">
                  <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto" />
                </motion.div>
                <div className="relative z-10">
                  <p className="text-2xl font-bold text-white">Account Linked!</p>
                  <p className="text-sm text-emerald-300">{linked.bank?.name}</p>
                </div>
                {/* UPI ID */}
                <div className="relative z-10 bg-black/30 border border-emerald-700/30 rounded-2xl p-4">
                  <p className="text-xs text-slate-400 mb-1">Your UPI ID</p>
                  <p className="text-lg font-mono font-bold text-emerald-300">{linked.upiId}</p>
                  <button onClick={copyUpi} className="flex items-center gap-1.5 mx-auto mt-2 text-xs text-slate-400 hover:text-white transition-colors">
                    {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy UPI ID</>}
                  </button>
                </div>
                {/* Details grid */}
                <div className="relative z-10 grid grid-cols-2 gap-2 text-left">
                  {[
                    ['Bank',         linked.bank?.name],
                    ['Card',         `•••• ${linked.last4}`],
                    ['Network',      linked.network || 'Verified'],
                    ['Account Type', linked.accountType?.charAt(0).toUpperCase()+linked.accountType?.slice(1)],
                    ['Mobile',       `+91 ${m10}`],
                    ['Status',       'Active ✓'],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-black/20 rounded-xl p-3">
                      <p className="text-[10px] text-slate-500">{label}</p>
                      <p className="text-xs text-white font-semibold mt-0.5">{val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick action tiles */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: IndianRupee, label:'Send Money',  color:'bg-blue-600',   href:'/send-money' },
                  { icon: Shield,      label:'Security',    color:'bg-violet-600', href:'/biometric-guard' },
                  { icon: RotateCcw,   label:'Link Another',color:'bg-white/[0.07]',   action: () => { setStep(1); setMobile(''); setOtp(['','','','','','']); setSelBank(null); setCardNum(''); setCardExp(''); setCardCvv(''); setUpiPin(''); setUpiPin2(''); setLinked(null); }},
                ].map((a,i) => (
                  <motion.a key={i} href={a.href || '#'} onClick={e => { if(a.action){ e.preventDefault(); a.action(); }}}
                    whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}
                    className={`${a.color} rounded-2xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all`}>
                    <a.icon className="w-5 h-5 text-white" />
                    <span className="text-xs text-white font-medium text-center">{a.label}</span>
                  </motion.a>
                ))}
              </div>

              <div className="flex items-center gap-3 px-4 py-3 bg-blue-900/20 border border-blue-700/30 rounded-2xl text-xs text-blue-300">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                Your UPI ID is now active across all UPI apps in India — send &amp; receive money instantly.
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
