import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle, XCircle, ChevronLeft, Smartphone,
  IndianRupee, Shield, Copy, Check, ExternalLink
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import RazorpayCheckout from './RazorpayCheckout';

// ── Gateway definitions ───────────────────────────────────────────────────────
const GATEWAYS = [
  {
    id: 'razorpay',
    name: 'Razorpay',
    tagline: 'Cards · UPI · Netbanking · Wallets',
    badge: 'All methods',
    gradient: 'from-blue-700 to-blue-500',
    ring: 'ring-blue-500',
    border: 'border-blue-500/40',
    bg: 'bg-blue-900/20',
    logo: (
      <svg viewBox="0 0 36 36" className="w-9 h-9" fill="none">
        <rect width="36" height="36" rx="8" fill="#2563eb"/>
        <path d="M10 26L18 10l5 8-4 2 5 6H10z" fill="white" opacity="0.9"/>
        <path d="M18 10l8 16H18l4-8-4-8z" fill="white" opacity="0.5"/>
      </svg>
    ),
  },
  {
    id: 'phonepe',
    name: 'PhonePe',
    tagline: 'PhonePe UPI · Wallet',
    badge: 'Popular',
    gradient: 'from-purple-700 to-indigo-600',
    ring: 'ring-purple-500',
    border: 'border-purple-500/40',
    bg: 'bg-purple-900/20',
    logo: (
      <svg viewBox="0 0 36 36" className="w-9 h-9" fill="none">
        <rect width="36" height="36" rx="8" fill="#5f259f"/>
        <circle cx="18" cy="14" r="5" fill="white" opacity="0.9"/>
        <path d="M11 26c0-3.87 3.13-7 7-7s7 3.13 7 7H11z" fill="white" opacity="0.9"/>
        <path d="M22 13l4-3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    deepLink: (upiId, name, amount, note) =>
      `phonepe://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(note || 'AegisAI')}&cu=INR`,
  },
  {
    id: 'gpay',
    name: 'Google Pay',
    tagline: 'Pay via Google Pay UPI',
    badge: 'Fast',
    gradient: 'from-slate-700 to-slate-600',
    ring: 'ring-slate-400',
    border: 'border-slate-500/40',
    bg: 'bg-slate-800/40',
    logo: (
      <svg viewBox="0 0 36 36" className="w-9 h-9" fill="none">
        <rect width="36" height="36" rx="8" fill="#fff"/>
        <text x="18" y="22" textAnchor="middle" fontSize="13" fontWeight="800" fill="#4285f4">G</text>
        <circle cx="26" cy="10" r="4" fill="#ea4335"/>
        <circle cx="26" cy="10" r="2" fill="white"/>
      </svg>
    ),
    deepLink: (upiId, name, amount, note) =>
      `tez://upi/pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(note || 'AegisAI')}&cu=INR`,
  },
  {
    id: 'paytm',
    name: 'Paytm',
    tagline: 'Paytm UPI · Wallet · Cards',
    badge: 'Cashback',
    gradient: 'from-cyan-700 to-teal-600',
    ring: 'ring-cyan-500',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-900/20',
    logo: (
      <svg viewBox="0 0 36 36" className="w-9 h-9" fill="none">
        <rect width="36" height="36" rx="8" fill="#00b9f5"/>
        <text x="50%" y="55%" dominantBaseline="middle" textAnchor="middle"
          fontSize="10" fontWeight="800" fill="white">PAYTM</text>
      </svg>
    ),
    deepLink: (upiId, name, amount, note) =>
      `paytmmp://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(note || 'AegisAI')}&cu=INR`,
  },
];

// Generic UPI QR value (works across all apps)
const buildUpiQR = (upiId, name, amount, note) =>
  `upi://pay?pa=${upiId}&pn=${encodeURIComponent(name)}&am=${amount}&tn=${encodeURIComponent(note || 'AegisAI Payment')}&cu=INR`;

// ── Main component ────────────────────────────────────────────────────────────
/**
 * MultiGatewayCheckout
 *
 * Props same as RazorpayCheckout:
 *   recipient   – { displayName, upiId, trustScore }
 *   amount      – number (INR)
 *   note        – string
 *   user        – Firebase user
 *   senderUpiId – string
 *   onSuccess   – callback
 *   onCancel    – callback
 */
export default function MultiGatewayCheckout({
  recipient,
  amount,
  note,
  user,
  senderUpiId,
  onSuccess,
  onCancel,
}) {
  const [selected, setSelected]     = useState(null);   // gateway object
  const [upiStep, setUpiStep]       = useState('qr');   // 'qr' | 'success' | 'failed'
  const [copied, setCopied]         = useState(false);
  const [appNotFound, setAppNotFound] = useState(false);

  // ── Go back to selector ───────────────────────────────────────────────────
  const reset = () => {
    setSelected(null);
    setUpiStep('qr');
    setCopied(false);
    setAppNotFound(false);
  };

  // ── Razorpay flow ─────────────────────────────────────────────────────────
  if (selected?.id === 'razorpay') {
    return (
      <div className="space-y-3">
        <button onClick={reset}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors mb-1">
          <ChevronLeft className="w-3.5 h-3.5" /> Change payment method
        </button>
        <RazorpayCheckout
          recipient={recipient}
          amount={amount}
          note={note}
          user={user}
          senderUpiId={senderUpiId}
          onSuccess={onSuccess}
          onCancel={() => { reset(); onCancel?.(); }}
        />
      </div>
    );
  }

  // ── UPI gateway flow (PhonePe / GPay / Paytm) ────────────────────────────
  if (selected && selected.id !== 'razorpay') {
    const qrValue = buildUpiQR(recipient.upiId, recipient.displayName, amount, note);
    const appLink = selected.deepLink?.(recipient.upiId, recipient.displayName, amount, note) || qrValue;

    const handleConfirm = () => {
      const data = {
        paymentId:     `${selected.id}_${Date.now()}`,
        orderId:       `ord_${Date.now()}`,
        amount,
        recipientUpi:  recipient.upiId,
        recipientName: recipient.displayName,
        timestamp:     new Date().toISOString(),
        aegisStatus:   'CLEARED',
        gateway:       selected.name,
      };
      setUpiStep('success');
      onSuccess?.(data);
    };

    if (upiStep === 'success') {
      return (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full p-5 bg-gradient-to-br from-green-900 to-emerald-900 border border-green-600 rounded-xl space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-7 h-7 text-green-300 shrink-0" />
            <div>
              <p className="text-green-100 font-bold text-lg">Payment Confirmed!</p>
              <p className="text-green-300 text-sm">
                ₹{Number(amount).toLocaleString('en-IN')} via {selected.name} to {recipient.displayName}
              </p>
            </div>
          </div>
          <div className="p-3 bg-black/30 rounded-lg border border-green-700/40 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400 shrink-0" />
            <p className="text-xs text-blue-200">AegisAI fraud shield — transaction marked CLEARED</p>
          </div>
        </motion.div>
      );
    }

    // QR + app-open flow
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-4">
        <button onClick={reset}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Change payment method
        </button>

        <Card className={`border ${selected.border} ${selected.bg}`}>
          <CardContent className="p-5 space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
              {selected.logo}
              <div>
                <p className="text-white font-bold">{selected.name}</p>
                <p className="text-xs text-gray-400">{selected.tagline}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-xs text-gray-400">Amount</p>
                <p className="text-lg font-bold text-white flex items-center gap-1 justify-end">
                  <IndianRupee className="w-4 h-4" />{Number(amount).toLocaleString('en-IN')}
                </p>
              </div>
            </div>

            {/* QR code */}
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-4 rounded-2xl shadow-lg">
                <QRCodeSVG value={qrValue} size={180} bgColor="#ffffff" fgColor="#111827" level="M" />
              </div>
              <p className="text-xs text-gray-400 text-center">
                Scan with <span className="text-white font-semibold">{selected.name}</span> or any UPI app
              </p>
            </div>

            {/* UPI ID copy */}
            <div className="flex items-center gap-2 bg-gray-700/50 rounded-lg px-3 py-2">
              <span className="text-xs text-gray-300 font-mono flex-1 truncate">UPI: {recipient.upiId}</span>
              <button onClick={() => {
                navigator.clipboard.writeText(recipient.upiId);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }} className="text-gray-400 hover:text-white transition-colors">
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Open app button (mobile) */}
            <Button
              onClick={() => {
                setAppNotFound(false);
                window.location.href = appLink;
                // If the page is still active after 2 s, the app likely isn't installed
                setTimeout(() => setAppNotFound(true), 2000);
              }}
              className={`w-full bg-gradient-to-r ${selected.gradient} text-white font-semibold`}
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Open in {selected.name}
              <ExternalLink className="w-3.5 h-3.5 ml-1.5 opacity-70" />
            </Button>

            <AnimatePresence>
              {appNotFound && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-xs text-yellow-400 text-center bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2"
                >
                  App didn't open? Scan the QR code above with {selected.name} instead.
                </motion.p>
              )}
            </AnimatePresence>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button onClick={handleConfirm}
                className="bg-green-700 hover:bg-green-600 text-sm font-semibold">
                <CheckCircle className="w-4 h-4 mr-1.5" /> I've Paid
              </Button>
              <Button onClick={() => { reset(); onCancel?.(); }}
                variant="outline"
                className="border-gray-600 text-gray-300 text-sm">
                <XCircle className="w-4 h-4 mr-1.5" /> Cancel
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              After paying in the app, tap <span className="text-white">"I've Paid"</span> to confirm
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ── Gateway selector ──────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm font-semibold text-gray-300">Choose payment method</p>
        <span className="text-xs text-gray-500 flex items-center gap-1">
          <Shield className="w-3 h-3" /> AegisAI protected
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {GATEWAYS.map((gw) => (
          <motion.button
            key={gw.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              setSelected(gw);
              if (gw.id !== 'razorpay') setUpiStep('qr');
            }}
            className={`relative flex flex-col items-center gap-2.5 p-4 rounded-xl border
              ${gw.border} ${gw.bg}
              hover:ring-2 ${gw.ring} transition-all text-center`}
          >
            <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full
              bg-white/10 text-white/60 uppercase tracking-wide">
              {gw.badge}
            </span>
            {gw.logo}
            <div>
              <p className="text-sm font-bold text-white">{gw.name}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{gw.tagline}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="flex items-center justify-center gap-2 pt-2">
        <IndianRupee className="w-4 h-4 text-green-400" />
        <p className="text-sm text-gray-300">
          Paying <span className="font-bold text-white">₹{Number(amount).toLocaleString('en-IN')}</span>
          {' '}to <span className="font-semibold text-white">{recipient?.displayName}</span>
        </p>
      </div>
    </div>
  );
}
