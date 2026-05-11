import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle, XCircle, Shield, IndianRupee,
  Loader, Download, Copy, Check, Smartphone, QrCode,
  CreditCard, Landmark, Wallet, Clock, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import jsPDF from 'jspdf';
import PaymentAuthModal from './PaymentAuthModal';

// ── SmartScamGuard ────────────────────────────────────────────────────────────
const SCAM_KEYWORDS = [
  'urgent','emergency','police','arrest','court','income tax','irs','lottery',
  'won','winner','prize','refund','block','suspend','verify','otp','lucky',
  'gift','free','jackpot','kyc','aadhar update','pan update','bank block',
  'rbi','helpline','customer care','reward','cashback trap',
];

function analyzeScam(amount, note, recipient) {
  const flags = [];
  let score = 0;

  const noteL = (note || '').toLowerCase();
  const kw = SCAM_KEYWORDS.filter(k => noteL.includes(k));
  if (kw.length > 0) {
    flags.push({ level: 'high', text: `Suspicious keywords in note: "${kw.slice(0, 3).join('", "')}"` });
    score += 35 + (kw.length - 1) * 10;
  }

  const hour = new Date().getHours();
  if (hour >= 1 && hour <= 5) {
    flags.push({ level: 'medium', text: `Unusual payment time — ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` });
    score += 25;
  }

  if (amount >= 50000) {
    flags.push({ level: 'high', text: `Very high-value transfer: ₹${Number(amount).toLocaleString('en-IN')}` });
    score += 25;
  } else if (amount >= 10000) {
    flags.push({ level: 'medium', text: `Large transfer: ₹${Number(amount).toLocaleString('en-IN')}` });
    score += 10;
  }

  if (amount >= 1000 && amount % 1000 === 0) {
    flags.push({ level: 'low', text: 'Exact round number — common pattern in scam requests' });
    score += 10;
  }

  if (!recipient?.trustScore || recipient.trustScore < 50) {
    flags.push({ level: 'medium', text: 'Recipient has a low or unverified trust score' });
    score += 15;
  }

  score = Math.min(score, 100);
  const level = score >= 60 ? 'high' : score >= 25 ? 'medium' : 'low';
  return { score, level, flags };
}

const SCAM_LEVEL_STYLE = {
  high:   { bg: 'bg-red-900/30 border-red-700/40',    text: 'text-red-300',    dot: 'bg-red-400'    },
  medium: { bg: 'bg-amber-900/30 border-amber-700/40', text: 'text-amber-300',  dot: 'bg-amber-400'  },
  low:    { bg: 'bg-blue-900/20 border-blue-700/30',   text: 'text-blue-300',   dot: 'bg-blue-400'   },
};

function ScamGuardModal({ analysis, amount, recipient, onProceed, onCancel }) {
  const { score, level, flags } = analysis;
  const fmtAmt = Number(amount).toLocaleString('en-IN');
  const isHigh = level === 'high';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(10px)' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-sm bg-gray-950 border border-gray-800 rounded-3xl shadow-2xl overflow-hidden">

        {/* Top risk bar */}
        <div className={`h-1.5 w-full ${isHigh ? 'bg-red-500' : score >= 25 ? 'bg-amber-500' : 'bg-blue-500'}`}
          style={{ width: `${score}%` }} />

        <div className="p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0
              ${isHigh ? 'bg-red-900/50' : score >= 25 ? 'bg-amber-900/50' : 'bg-blue-900/50'}`}>
              <Shield className={`w-5 h-5 ${isHigh ? 'text-red-400' : score >= 25 ? 'text-amber-400' : 'text-blue-400'}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">SmartScamGuard Analysis</p>
              <p className="text-xs text-gray-400">Pre-payment risk check</p>
            </div>
            <div className="ml-auto text-right">
              <p className={`text-xl font-bold ${isHigh ? 'text-red-400' : score >= 25 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {score}
              </p>
              <p className="text-[10px] text-gray-500 uppercase tracking-wide">Risk Score</p>
            </div>
          </div>

          {/* Payment summary */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500">Paying to</p>
              <p className="text-sm font-semibold text-white truncate">{recipient?.displayName || recipient?.upiId || 'Recipient'}</p>
            </div>
            <p className="text-lg font-bold text-white shrink-0">₹{fmtAmt}</p>
          </div>

          {/* Risk flags */}
          {flags.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Detected Risk Factors</p>
              {flags.map((f, i) => {
                const s = SCAM_LEVEL_STYLE[f.level];
                return (
                  <div key={i} className={`flex items-start gap-2 px-3 py-2.5 rounded-xl border text-xs ${s.bg} ${s.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot} mt-1.5 shrink-0`} />
                    {f.text}
                  </div>
                );
              })}
            </div>
          )}

          {flags.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-900/20 border border-emerald-700/30 rounded-xl text-xs text-emerald-300">
              <CheckCircle className="w-3.5 h-3.5 shrink-0" />
              No suspicious patterns detected for this payment.
            </div>
          )}

          {/* Advice */}
          {isHigh && (
            <p className="text-xs text-red-300 bg-red-900/20 border border-red-700/20 rounded-xl px-3 py-2.5 leading-relaxed">
              <strong>High risk detected.</strong> Legitimate organisations (banks, government, police) never ask for money transfers. If someone pressured you to pay, cancel immediately.
            </p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <Button onClick={onCancel}
              className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm font-semibold">
              Cancel Payment
            </Button>
            <Button onClick={onProceed}
              className={`flex-1 text-sm font-semibold
                ${isHigh ? 'bg-red-700 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-500'}`}>
              {isHigh ? 'Proceed Anyway' : 'Looks Safe — Pay'}
            </Button>
          </div>
          {isHigh && (
            <p className="text-[10px] text-gray-600 text-center">Proceeding overrides the AegisAI scam warning.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const API     = import.meta.env.VITE_API_URL  || 'http://localhost:5000';
const RZP_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || '';

// ── Static data ───────────────────────────────────────────────────────────────
const BANKS = [
  { code: 'HDFC', name: 'HDFC Bank',     color: '#004C8F' },
  { code: 'ICIC', name: 'ICICI Bank',    color: '#F7941D' },
  { code: 'SBIN', name: 'State Bank',    color: '#22577A' },
  { code: 'UTIB', name: 'Axis Bank',     color: '#800000' },
  { code: 'KKBK', name: 'Kotak Bank',    color: '#EF3E23' },
  { code: 'YESB', name: 'YES Bank',      color: '#003087' },
  { code: 'PUNB', name: 'Punjab NB',     color: '#F15A29' },
  { code: 'CNRB', name: 'Canara Bank',   color: '#006837' },
  { code: 'BARB', name: 'Bank of Baroda',color: '#F26522' },
  { code: 'IDFB', name: 'IDFC First',    color: '#1A3C6D' },
];

const WALLETS = [
  { id: 'phonepe',  name: 'PhonePe',  color: '#5f259f', initial: 'Pe' },
  { id: 'paytm',    name: 'Paytm',    color: '#00b9f5', initial: 'Pt' },
  { id: 'mobikwik', name: 'MobiKwik', color: '#00b9f0', initial: 'Mb' },
  { id: 'freecharge',name:'FreeCharge',color: '#ff5722', initial: 'Fc' },
  { id: 'airtelmoney',name:'Airtel Pay',color:'#e40000', initial: 'Ai' },
];

const PAY_LATER = [
  { id: 'lazypay',   name: 'LazyPay',    color: '#1b1b2f', initial: 'Lp' },
  { id: 'zestmoney', name: 'ZestMoney',  color: '#ff5f00', initial: 'Zm' },
  { id: 'simpl',     name: 'Simpl',      color: '#16c79a', initial: 'Si' },
  { id: 'epaylater', name: 'ePayLater',  color: '#2d6a4f', initial: 'eP' },
];

const EMI_TENURES = [3, 6, 9, 12, 18, 24];

const METHODS = [
  { id: 'upi',        label: 'UPI',        Icon: Smartphone  },
  { id: 'card',       label: 'Cards',      Icon: CreditCard  },
  { id: 'emi',        label: 'EMI',        Icon: Clock       },
  { id: 'netbanking', label: 'Netbanking', Icon: Landmark    },
  { id: 'wallet',     label: 'Wallet',     Icon: Wallet      },
  { id: 'paylater',   label: 'Pay Later',  Icon: ChevronRight},
];

// ── Small logo circle ─────────────────────────────────────────────────────────
function Logo({ color, text, size = 'sm' }) {
  const px = size === 'sm' ? 'w-7 h-7 text-[10px]' : 'w-10 h-10 text-sm';
  return (
    <span className={`${px} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: color }}>
      {text}
    </span>
  );
}

// ── Receipt PDF ───────────────────────────────────────────────────────────────
function downloadReceipt(pd, recipient, senderUpiId) {
  const doc = new jsPDF();
  const now = new Date().toLocaleString('en-IN');
  doc.setFillColor(17, 24, 39); doc.rect(0, 0, 210, 297, 'F');
  doc.setTextColor(255,255,255); doc.setFontSize(22); doc.setFont('helvetica','bold');
  doc.text('AegisAI', 105, 28, { align: 'center' });
  doc.setFontSize(10); doc.setTextColor(156,163,175);
  doc.text('Payment Receipt', 105, 36, { align: 'center' });
  doc.setDrawColor(59,130,246); doc.line(20, 42, 190, 42);
  doc.setTextColor(74,222,128); doc.setFontSize(30); doc.setFont('helvetica','bold');
  doc.text(`+₹${Number(pd.amount).toLocaleString('en-IN')}`, 105, 62, { align: 'center' });
  doc.setTextColor(156,163,175); doc.setFontSize(10);
  doc.text('PAYMENT SUCCESSFUL', 105, 72, { align: 'center' });
  const rows = [
    ['Payment ID', pd.paymentId],
    ['Order ID',   pd.orderId],
    ['Method',     pd.method || 'Razorpay'],
    ['Recipient',  recipient?.displayName || ''],
    ['UPI ID',     recipient?.upiId || ''],
    ['Sender',     senderUpiId || ''],
    ['Amount',     `₹${Number(pd.amount).toLocaleString('en-IN')}`],
    ['Status',     'CLEARED'],
    ['Date',       now],
  ];
  let y = 88;
  rows.forEach(([label, value]) => {
    doc.setTextColor(156,163,175); doc.setFontSize(8); doc.text(label, 25, y);
    doc.setTextColor(255,255,255); doc.setFontSize(9); doc.text(String(value), 25, y+5);
    y += 14;
  });
  doc.setDrawColor(59,130,246); doc.line(20, y+2, 190, y+2);
  doc.setTextColor(107,114,128); doc.setFontSize(7);
  doc.text('Secured by AegisAI · Powered by Razorpay', 105, y+10, { align: 'center' });
  doc.save(`AegisAI_${pd.paymentId}.pdf`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function CustomRazorpayCheckout({
  amount, recipient, note, user, senderUpiId, onSuccess, onCancel,
}) {
  const [method,       setMethod]       = useState('upi');
  const [upiTab,       setUpiTab]       = useState('id');   // 'id' | 'qr'
  const [upiInput,     setUpiInput]     = useState('');
  const [card,         setCard]         = useState({ number:'', name:'', expiry:'', cvv:'' });
  const [selBank,      setSelBank]      = useState('');
  const [selWallet,    setSelWallet]    = useState('');
  const [selPayLater,  setSelPayLater]  = useState('');
  const [emiBankCode,  setEmiBankCode]  = useState('');
  const [emiTenure,    setEmiTenure]    = useState(6);

  const [step,         setStep]         = useState('form'); // form|processing|success|failed
  const [payData,      setPayData]      = useState(null);
  const [errMsg,       setErrMsg]       = useState('');
  const [copied,       setCopied]       = useState(false);
  const [showAuth,     setShowAuth]     = useState(false);
  const [showScamGuard, setShowScamGuard] = useState(false);
  const [scamAnalysis,  setScamAnalysis]  = useState(null);

  const fmtAmt = Number(amount).toLocaleString('en-IN');

  // ── Build Razorpay prefill from chosen method ───────────────────────────────
  const buildPrefill = () => {
    const base = { name: user?.displayName || '', email: user?.email || '' };
    if (method === 'upi')        return { ...base, method: 'upi',        vpa: upiInput.trim() };
    if (method === 'card')       return { ...base, method: 'card' };
    if (method === 'emi')        return { ...base, method: 'emi',         bank: emiBankCode };
    if (method === 'netbanking') return { ...base, method: 'netbanking',  bank: selBank };
    if (method === 'wallet')     return { ...base, method: 'wallet',      wallet: selWallet };
    if (method === 'paylater')   return { ...base, method: 'paylater' };
    return base;
  };

  // ── Validation per method ───────────────────────────────────────────────────
  const validate = () => {
    if (method === 'upi' && upiTab === 'id' && !upiInput.includes('@'))
      return 'Enter a valid UPI ID (e.g. name@ybl)';
    if (method === 'card') {
      if (card.number.replace(/\s/g,'').length < 16) return 'Enter a valid 16-digit card number';
      if (!card.name.trim())                          return 'Enter cardholder name';
      if (!/^\d{2}\/\d{2}$/.test(card.expiry))       return 'Enter expiry as MM/YY';
      if (card.cvv.length < 3)                        return 'Enter a valid CVV';
    }
    if (method === 'emi' && !emiBankCode)        return 'Select a bank for EMI';
    if (method === 'netbanking' && !selBank)     return 'Select your bank';
    if (method === 'wallet' && !selWallet)       return 'Select a wallet';
    if (method === 'paylater' && !selPayLater)   return 'Select a Pay Later provider';
    return null;
  };

  // ── Open Razorpay ───────────────────────────────────────────────────────────
  const handlePay = async () => {
    setStep('processing');

    const prefill = buildPrefill();

    try {
      // Try to create order via backend
      const orderRes = await fetch(`${API}/razorpay/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount, currency: 'INR',
          recipientUpi:  recipient?.upiId,
          recipientName: recipient?.displayName,
          note:          note || 'AegisAI Payment',
          senderUid:     user?.uid || 'demo',
        }),
      });

      const order = await orderRes.json();
      const useTestMode = !orderRes.ok || order.setup_required;

      const options = {
        key:         RZP_KEY || order.razorpay_key,
        amount:      useTestMode ? Math.round(amount * 100) : order.amount,
        currency:    'INR',
        order_id:    useTestMode ? undefined : order.order_id,
        name:        'AegisAI',
        description: note || `Payment to ${recipient?.displayName}`,
        image:       '/vite.svg',
        prefill,
        notes: {
          recipient_upi:  recipient?.upiId  || '',
          recipient_name: recipient?.displayName || '',
          aegis_verified: 'true',
        },
        theme:  { color: '#3B82F6' },
        modal: {
          ondismiss: () => setStep('form'),
        },
        handler: async (response) => {
          // Verify or accept in test mode
          if (useTestMode) {
            const pd = {
              paymentId:  response.razorpay_payment_id || `pay_test_${Date.now()}`,
              orderId:    response.razorpay_order_id   || `ord_test_${Date.now()}`,
              amount,
              method:     METHODS.find(m => m.id === method)?.label || method,
            };
            setPayData(pd);
            setStep('success');
            onSuccess?.(pd);
            return;
          }
          // Real verification
          try {
            const vRes = await fetch(`${API}/razorpay/verify-payment`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id:   order.order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature:  response.razorpay_signature,
                amount,
                recipientUpi: recipient?.upiId,
                senderUid:    user?.uid || 'demo',
              }),
            });
            const vData = await vRes.json();
            if (vData.verified || vData.setup_required) {
              const pd = {
                paymentId: response.razorpay_payment_id,
                orderId:   order.order_id,
                amount,
                method:    METHODS.find(m => m.id === method)?.label || method,
              };
              setPayData(pd);
              setStep('success');
              onSuccess?.(pd);
            } else {
              setStep('failed');
              setErrMsg(vData.error || 'Verification failed');
            }
          } catch {
            setStep('failed');
            setErrMsg('Verification request failed');
          }
        },
      };

      if (!window.Razorpay) throw new Error('Razorpay SDK not loaded');
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        setStep('failed');
        setErrMsg(resp.error?.description || 'Payment failed');
      });
      setStep('form'); // reset — modal is open
      rzp.open();

    } catch (e) {
      setStep('failed');
      setErrMsg(e.message || 'Could not initiate payment');
    }
  };

  const copyId = () => {
    navigator.clipboard.writeText(payData?.paymentId || '');
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (step === 'success' && payData) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="space-y-4">
        <div className="p-5 bg-gradient-to-br from-green-900 to-emerald-900 border border-green-600 rounded-2xl">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-green-300 shrink-0" />
            <div>
              <p className="text-green-100 font-bold text-xl">Payment Successful!</p>
              <p className="text-green-300 text-sm">
                ₹{fmtAmt} via {payData.method} to {recipient?.displayName}
              </p>
            </div>
          </div>
          <div className="bg-black/30 rounded-xl p-3 space-y-2 text-xs border border-green-700/30">
            {[
              ['Payment ID', payData.paymentId],
              ['Method',     payData.method],
              ['Recipient',  `${recipient?.displayName} (${recipient?.upiId})`],
              ['Amount',     `₹${fmtAmt}`],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between">
                <span className="text-gray-400">{label}</span>
                <span className="text-white font-mono break-all text-right ml-2">{val}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 p-2 bg-blue-900/40 border border-blue-700/30 rounded-lg flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400 shrink-0" />
            <p className="text-xs text-blue-200">AegisAI fraud shield — CLEARED</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => downloadReceipt(payData, recipient, senderUpiId)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 font-semibold text-sm">
            <Download className="w-4 h-4 mr-2" /> Download Receipt
          </Button>
          <Button onClick={copyId} variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700 px-4">
            {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </motion.div>
    );
  }

  // ── Failed screen ─────────────────────────────────────────────────────────
  if (step === 'failed') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="p-5 bg-red-900/20 border border-red-600/40 rounded-2xl space-y-4">
        <div className="flex items-center gap-3">
          <XCircle className="w-6 h-6 text-red-400 shrink-0" />
          <div>
            <p className="text-red-200 font-semibold">Payment Failed</p>
            <p className="text-xs text-gray-400 mt-0.5">{errMsg}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setStep('form'); setErrMsg(''); }}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-sm">Try Again</Button>
          <Button onClick={onCancel} variant="outline"
            className="flex-1 border-gray-600 text-gray-300 text-sm">Cancel</Button>
        </div>
      </motion.div>
    );
  }

  // ── Form screen ───────────────────────────────────────────────────────────
  const qrValue = `upi://pay?pa=${recipient?.upiId || ''}&pn=${encodeURIComponent(recipient?.displayName || '')}&am=${amount}&tn=${encodeURIComponent(note || 'AegisAI')}&cu=INR`;

  return (
    <div className="flex rounded-2xl overflow-hidden border border-gray-700 bg-gray-900 shadow-2xl"
      style={{ minHeight: 420 }}>

      {/* ── Left: Method list ── */}
      <div className="w-44 flex-shrink-0 bg-gray-800/60 border-r border-gray-700 flex flex-col">
        {/* Amount header */}
        <div className="px-4 py-4 border-b border-gray-700">
          <p className="text-xs text-gray-400">Pay</p>
          <p className="text-xl font-bold text-white flex items-center gap-1">
            <IndianRupee className="w-4 h-4" />{fmtAmt}
          </p>
          {recipient?.displayName && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">to {recipient.displayName}</p>
          )}
        </div>

        {/* Method tabs */}
        <nav className="flex-1 py-2">
          {METHODS.map(({ id, label, Icon }) => (
            <button key={id} onClick={() => { setMethod(id); setErrMsg(''); }}
              className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium transition-colors text-left
                ${method === id
                  ? 'bg-blue-600/20 text-blue-300 border-r-2 border-blue-500'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>

        {/* Secured badge */}
        <div className="px-4 py-3 border-t border-gray-700">
          <div className="flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-blue-400" />
            <p className="text-[9px] text-gray-500 font-semibold uppercase tracking-wide">
              Secured by Razorpay
            </p>
          </div>
        </div>
      </div>

      {/* ── Right: Form ── */}
      <div className="flex-1 flex flex-col">
        {/* Form title */}
        <div className="px-5 py-4 border-b border-gray-700 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">
            {METHODS.find(m => m.id === method)?.label}
          </p>
          <button onClick={onCancel} className="text-gray-500 hover:text-white transition-colors text-lg leading-none">✕</button>
        </div>

        <div className="flex-1 px-5 py-4 overflow-y-auto">
          <AnimatePresence mode="wait">

            {/* ── UPI ── */}
            {method === 'upi' && (
              <motion.div key="upi" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }} className="space-y-4">
                {/* Tab toggle */}
                <div className="flex gap-1 bg-gray-800 rounded-lg p-1 w-fit">
                  {[{ id:'id', label:'UPI ID', icon: <Smartphone className="w-3 h-3" /> },
                    { id:'qr', label:'Scan QR', icon: <QrCode className="w-3 h-3" /> }
                  ].map(t => (
                    <button key={t.id} onClick={() => setUpiTab(t.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                        ${upiTab === t.id ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}>
                      {t.icon}{t.label}
                    </button>
                  ))}
                </div>

                {upiTab === 'id' ? (
                  <div className="space-y-2">
                    <label className="text-xs text-gray-400">Enter UPI ID</label>
                    <Input value={upiInput} onChange={e => setUpiInput(e.target.value)}
                      placeholder="name@ybl / name@paytm"
                      className="bg-gray-800 border-gray-600 text-white font-mono" />
                    <p className="text-xs text-gray-500">
                      Test: use <span className="text-blue-300 font-mono">success@razorpay</span>
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="bg-white p-3 rounded-xl">
                      <QRCodeSVG value={qrValue} size={160} bgColor="#fff" fgColor="#111827" level="M" />
                    </div>
                    <p className="text-xs text-gray-400 text-center">
                      Scan with any UPI app — PhonePe, Google Pay, Paytm, BHIM
                    </p>
                    <div className="flex gap-2 flex-wrap justify-center">
                      {WALLETS.slice(0,4).map(w => (
                        <Logo key={w.id} color={w.color} text={w.initial} size="sm" />
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── Card ── */}
            {method === 'card' && (
              <motion.div key="card" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Card Number</label>
                  <Input value={card.number}
                    onChange={e => setCard(p => ({ ...p, number: e.target.value.replace(/[^\d\s]/g,'').slice(0,19) }))}
                    placeholder="1234 5678 9012 3456"
                    className="bg-gray-800 border-gray-600 text-white font-mono" maxLength={19} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Cardholder Name</label>
                  <Input value={card.name} onChange={e => setCard(p => ({ ...p, name: e.target.value }))}
                    placeholder="Name on card"
                    className="bg-gray-800 border-gray-600 text-white" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">Expiry (MM/YY)</label>
                    <Input value={card.expiry}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g,'');
                        if (v.length >= 3) v = v.slice(0,2)+'/'+v.slice(2,4);
                        setCard(p => ({ ...p, expiry: v }));
                      }}
                      placeholder="12/27" maxLength={5}
                      className="bg-gray-800 border-gray-600 text-white font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400">CVV</label>
                    <Input type="password" value={card.cvv} maxLength={4}
                      onChange={e => setCard(p => ({ ...p, cvv: e.target.value.replace(/\D/g,'') }))}
                      placeholder="•••"
                      className="bg-gray-800 border-gray-600 text-white font-mono" />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── EMI ── */}
            {method === 'emi' && (
              <motion.div key="emi" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Select Bank</label>
                  <div className="grid grid-cols-2 gap-2">
                    {BANKS.slice(0,6).map(b => (
                      <button key={b.code} onClick={() => setEmiBankCode(b.code)}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-medium transition-colors
                          ${emiBankCode === b.code
                            ? 'border-blue-500 bg-blue-900/30 text-blue-200'
                            : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                        <Logo color={b.color} text={b.code.slice(0,2)} />
                        <span className="truncate">{b.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400">Tenure (months)</label>
                  <div className="flex flex-wrap gap-2">
                    {EMI_TENURES.map(t => (
                      <button key={t} onClick={() => setEmiTenure(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors
                          ${emiTenure === t
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'border-gray-700 text-gray-400 hover:border-gray-500'}`}>
                        {t}m
                      </button>
                    ))}
                  </div>
                  {emiBankCode && (
                    <p className="text-xs text-gray-400 bg-gray-800 rounded-lg p-2">
                      ≈ ₹{Math.ceil(amount / emiTenure).toLocaleString('en-IN')}/month × {emiTenure} months
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── Netbanking ── */}
            {method === 'netbanking' && (
              <motion.div key="netbanking" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }} className="space-y-3">
                <label className="text-xs text-gray-400">Select Your Bank</label>
                <div className="grid grid-cols-2 gap-2">
                  {BANKS.map(b => (
                    <button key={b.code} onClick={() => setSelBank(b.code)}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition-colors
                        ${selBank === b.code
                          ? 'border-blue-500 bg-blue-900/30 text-blue-200'
                          : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-white'}`}>
                      <Logo color={b.color} text={b.code.slice(0,2)} />
                      <span className="truncate">{b.name}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Wallet ── */}
            {method === 'wallet' && (
              <motion.div key="wallet" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }} className="space-y-3">
                <label className="text-xs text-gray-400">Select Wallet</label>
                <div className="space-y-2">
                  {WALLETS.map(w => (
                    <button key={w.id} onClick={() => setSelWallet(w.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors
                        ${selWallet === w.id
                          ? 'border-blue-500 bg-blue-900/20 text-white'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'}`}>
                      <Logo color={w.color} text={w.initial} />
                      <span className="font-medium text-sm">{w.name}</span>
                      {selWallet === w.id && <CheckCircle className="w-4 h-4 text-blue-400 ml-auto" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Pay Later ── */}
            {method === 'paylater' && (
              <motion.div key="paylater" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }} className="space-y-3">
                <label className="text-xs text-gray-400">Select Provider</label>
                <div className="space-y-2">
                  {PAY_LATER.map(p => (
                    <button key={p.id} onClick={() => setSelPayLater(p.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors
                        ${selPayLater === p.id
                          ? 'border-blue-500 bg-blue-900/20 text-white'
                          : 'border-gray-700 text-gray-400 hover:border-gray-600 hover:text-white'}`}>
                      <Logo color={p.color} text={p.initial} />
                      <span className="font-medium text-sm">{p.name}</span>
                      {selPayLater === p.id && <CheckCircle className="w-4 h-4 text-blue-400 ml-auto" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Error ── */}
        <AnimatePresence>
          {errMsg && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="mx-5 mb-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {errMsg}
            </motion.p>
          )}
        </AnimatePresence>

        {/* ── PAY BUTTON ── */}
        <div className="px-5 pb-5 pt-2">
          <Button
            onClick={() => {
              const err = validate();
              if (err) { setErrMsg(err); return; }
              setErrMsg('');
              const analysis = analyzeScam(amount, note, recipient);
              setScamAnalysis(analysis);
              if (analysis.level !== 'low') {
                setShowScamGuard(true);
              } else {
                setShowAuth(true);
              }
            }}
            disabled={step === 'processing'}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-5 text-base rounded-xl
                       shadow-lg shadow-blue-600/30 transition-all"
          >
            {step === 'processing' ? (
              <><Loader className="w-4 h-4 mr-2 animate-spin" /> Processing…</>
            ) : (
              <><IndianRupee className="w-4 h-4 mr-1" /> Pay ₹{fmtAmt}</>
            )}
          </Button>
        </div>
      </div>

      {/* ── SmartScamGuard modal ── */}
      {showScamGuard && scamAnalysis && (
        <ScamGuardModal
          analysis={scamAnalysis}
          amount={amount}
          recipient={recipient}
          onProceed={() => { setShowScamGuard(false); setShowAuth(true); }}
          onCancel={() => { setShowScamGuard(false); onCancel?.(); }}
        />
      )}

      {/* ── Auth modal ── */}
      {showAuth && (
        <PaymentAuthModal
          payment={{
            recipient: recipient?.displayName || recipient?.upiId || 'Recipient',
            amount,
            reason: note || '',
          }}
          onConfirm={() => { setShowAuth(false); handlePay(); }}
          onCancel={() => setShowAuth(false)}
        />
      )}
    </div>
  );
}
