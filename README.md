<div align="center">

# AegisAI — Intelligent Financial Anomaly Detection System

**Enterprise-grade AI fraud detection with real-time scoring, behavioral analytics, and explainable ML**

![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-6.0.1-646CFF?style=flat-square&logo=vite)
![Python](https://img.shields.io/badge/Python-Flask-3776AB?style=flat-square&logo=python)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4.16-38BDF8?style=flat-square&logo=tailwindcss)
![Firebase](https://img.shields.io/badge/Firebase-11.0.2-FFCA28?style=flat-square&logo=firebase)
![scikit-learn](https://img.shields.io/badge/scikit--learn-ML-F7931E?style=flat-square&logo=scikit-learn)
![TensorFlow](https://img.shields.io/badge/TensorFlow-Deep%20Learning-FF6F00?style=flat-square&logo=tensorflow)
![Claude AI](https://img.shields.io/badge/Anthropic-Claude%20AI-D97706?style=flat-square)

</div>

---

## Overview

AegisAI is a full-stack intelligent financial security platform that combines a 22-feature Random Forest ML model, behavioral biometrics, real-time Firestore sync, and an Anthropic Claude AI integration to detect, explain, and prevent financial fraud.

The system covers the complete fraud lifecycle — from pre-payment spoofing checks and live transaction scoring, through behavioral pattern analysis and fraud ring clustering, to post-transaction dispute management and model retraining readiness assessment.

**Key numbers:**
- 72+ React components across 57+ routes
- 60+ Flask ML API endpoints
- 22-feature fraud detection model (Random Forest + Isolation Forest)
- 8+ unique algorithms (Union-Find, Levenshtein, SHAP-style attribution, force-directed graphs, GAN-based data generation)
- 10 Firestore collections with real-time snapshot listeners
- 99.7% detection accuracy on test dataset

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend Framework | React | 18.3.1 |
| Build Tool | Vite | 6.0.1 |
| Styling | TailwindCSS + shadcn/ui + Radix UI | 3.4.16 |
| Animations | Framer Motion | 11.14.0 |
| Charts | Recharts (Area, Bar, Radar, Scatter, Line) | 2.14.1 |
| Icons | Lucide React | 0.468.0 |
| Routing | React Router DOM | 7.0.2 |
| HTTP Client | Axios | 1.7.9 |
| Auth & Database | Firebase (Auth + Firestore) | 11.0.2 |
| Payment Gateway | Razorpay SDK | — |
| AI Narratives | Anthropic Claude SDK | 0.87.0 |
| PDF Export | jsPDF + AutoTable | 4.2.1 |
| QR Codes | qrcode.react + html5-qrcode | — |
| Backend | Python Flask | — |
| API Docs | Flasgger (Swagger / OpenAPI) | — |
| ML Framework | scikit-learn (Random Forest, Isolation Forest) | — |
| Deep Learning | TensorFlow / Keras | — |
| Data Processing | NumPy + Pandas | — |
| Design System | Neural Fraud Defense (JetBrains Mono, custom tokens) | custom |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AegisAI Platform                         │
├────────────────────────┬────────────────────────────────────────┤
│   React 18 SPA (Vite)  │        Python Flask ML Server          │
│   72+ Components       │        60+ REST Endpoints              │
│   Framer Motion        │        Random Forest + Isolation Forest│
│   Recharts             │        SHAP Explainability             │
│   shadcn/ui + Radix    │        Razorpay Webhooks               │
├────────────────────────┴────────────────────────────────────────┤
│                  Firebase (Auth + Firestore)                     │
│              10 Collections · Real-time snapshot listeners       │
├─────────────────────────────────────────────────────────────────┤
│  Anthropic Claude AI  ·  Web Speech API  ·  Razorpay SDK        │
└─────────────────────────────────────────────────────────────────┘
```

**Data flow:**
1. User authenticates via Google OAuth (Firebase Auth)
2. Transaction details submitted through the React frontend
3. Frontend calls Flask `/predict` endpoint with 22 features
4. Random Forest model returns fraud probability (0–1) + risk label
5. SHAP-style attribution identifies which features drove the score
6. Result written to Firestore; UI updates in real time via snapshot listener
7. Claude AI generates a narrative explanation on demand

---

## Feature Modules

### Core Fraud Detection

| Feature | Route | Description |
|---|---|---|
| **Dashboard** | `/dashboard` | Real-time stats: total transactions, flagged count, accuracy score, AI security status. Area chart with cyan gradient fill. Neural Activity Feed with slide-in animations per item. |
| **Send Money / UPI Pay** | `/` (auth) | UPI ID input with live Pre-Payment Shield check, Levenshtein spoofing detection, and fraud score before submitting |
| **Pre-Payment Shield** | `/prepayment-shield` | Checks recipient UPI ID against known fraud patterns using Levenshtein edit-distance and blacklist lookup before any payment is authorized |
| **Check Transaction** | `/check-transaction` | Single-transaction fraud score with full 22-feature breakdown, confidence interval, and risk category badge |
| **Batch Check** | `/batch-check` | Upload or paste multiple transaction records; bulk scoring with CSV download of results |
| **Run Detection** | `/run-detection` | Full-pipeline detection on uploaded dataset with 5-step ML workflow progress indicator |
| **Detection Results** | `/results` | Paginated results table with filter by risk level, sortable columns, PDF/CSV export |
| **Live Fraud Feed** | `/live-fraud-feed` | Real-time stream of fraud alerts across the platform via server-sent events |

### AI & Machine Learning

| Feature | Route | Description |
|---|---|---|
| **Anomaly Explainer** | `/anomaly-explainer` | SHAP-style waterfall chart showing which of the 22 features pushed a transaction toward or away from fraud. Includes counterfactual "what would need to change" analysis |
| **Fraud Ring Detector** | `/fraud-ring-detector` | Union-Find algorithm clusters connected accounts. Force-directed graph visualization with animated cyan node glow to identify coordinated fraud networks |
| **ML Workflow Stepper** | (widget) | Visual 5-step pipeline: Upload → Preprocess → Train → Evaluate → Deploy. Embedded inside RunDetection and RetrainingReadiness |
| **Model Comparison** | `/model-comparison` | Side-by-side accuracy, precision, recall, F1, and AUC metrics across Random Forest, Isolation Forest, and other tested models |
| **Feature Insights** | `/feature-insights` | Ranked bar chart of feature importance scores from the trained model with hover descriptions |
| **Dataset Drift** | `/dataset-drift` | Compares current transaction distribution against training distribution. Flags statistical drift per feature |
| **Retraining Readiness** | `/retraining-readiness` | Evaluates whether model performance has degraded enough to warrant retraining. Returns a confidence score and recommended action |
| **Upload Data** | `/upload` | Drag-and-drop CSV upload with column validation against the 22-feature schema. Preview first 50 rows before analysis |
| **Explore Data** | `/explore-data` | Histograms and scatter plots of uploaded dataset. Fraud/non-fraud distribution, class balance, correlation matrix |
| **Bulk Explain** | `/bulk-explain` | SHAP-style explanations generated in batch for all flagged transactions in a dataset |
| **Risk Score Blend** | `/risk-score-blend` | Weighted combination of velocity, amount, behavioral, and device risk sub-scores into one composite score |
| **Rule Engine** | `/rule-engine` | Custom rule builder — define IF-THEN conditions on transaction fields, set thresholds, activate or deactivate rules |
| **Future Risk Predictor** | `/future-risk` | 7-day fraud probability forecast per UPI ID using time-series pattern extrapolation with day-of-week risk multipliers |

### Behavioral Analytics

| Feature | Route | Description |
|---|---|---|
| **Spending DNA** | `/spending-dna` | 8-dimension radar chart profiling spending across: groceries, entertainment, travel, utilities, dining, health, shopping, transfers. Compares current month vs. 3-month average |
| **Financial Personality** | `/financial-personality` | ML-derived persona classification (Saver, Spender, Investor, Risk-Taker, etc.) based on transaction history patterns |
| **Behavioral Analysis** | `/behavioral-analysis` | Time-of-day and day-of-week transaction heatmap, velocity spikes, unusual merchant category flags |
| **Spending Coach** | `/spending-coach` | Claude AI-powered personalized advice based on spending patterns. Highlights overspend categories with recommended budgets |
| **Contact Trust Score** | `/contact-trust` | Per-contact risk score derived from transaction history, dispute history, and community fraud reports |
| **Risk Profile** | `/risk-profile` | User-level composite risk score (300–850 range, credit-score style) with contributing factor breakdown |
| **Score History** | `/score-history` | Line chart of user fraud risk score over the past 90 days |

### Financial Planning

| Feature | Route | Description |
|---|---|---|
| **Financial Health Score** | `/financial-health-score` | Composite score across 6 dimensions: savings rate, expense control, debt management, payment consistency, fraud exposure, investment activity |
| **Budget Predictor** | `/budget-predictor` | ML-powered budget burn-rate forecast showing projected vs. actual spend per category with end-of-month estimate |
| **Cash Flow Forecast** | `/cash-flow-forecast` | 30-day cash inflow/outflow projection with AreaChart visualization and net balance trend line |
| **Savings Goals** | `/savings-goals` | Goal creation with target amount, deadline, and auto-projected monthly contribution schedule |
| **Budget** | `/budget` | Category budget setup with current-month progress bars and overage alerts |
| **EMI Calculator** | `/emi-calculator` | Loan EMI computation with full amortization table and total interest visualization |
| **AI Financial Story** | `/financial-story` | Anthropic Claude generates a typewriter-animated narrative summary of the user's financial month |
| **Statements** | `/statements` | Paginated transaction statement with date-range filter and PDF export via jsPDF |

### Payments & UPI

| Feature | Route | Description |
|---|---|---|
| **QR Pay** | `/qr-pay` | Generate QR code for receiving payments (qrcode.react). Scan QR to pay using device camera (html5-qrcode) |
| **Pay by Phone** | `/pay-by-phone` | Phone number to UPI ID resolution via `/phone-lookup` API. Auto-fills the recipient field |
| **Request Money** | `/request-money` | Generate a payment request link with amount and note. Share via QR code or copy link |
| **Split Bill** | `/split-bill` | Add participants, enter total, choose equal or custom split. Generates per-person payment requests |
| **Recurring Payments** | `/recurring-payments` | Set up and manage recurring UPI mandates with next-date projection via Flask API |
| **Multi-Gateway Checkout** | `/checkout` | Unified checkout supporting Razorpay, UPI, card, and net banking with pre-flight fraud check |
| **Razorpay Checkout** | `/razorpay-checkout` | Native Razorpay SDK integration with order creation, payment verification, and webhook handling |
| **Beneficiaries** | `/beneficiaries` | Saved recipient management with trust score overlay and fraud history badge |
| **Bank Linking** | `/bank-linking` | UPI bank account discovery, VPA lookup, and OTP-based account linking flow |
| **Payment Auth Modal** | (modal) | 2FA or biometric confirmation modal shown before high-risk payment execution |
| **Voice Pay Assistant** | `/voice-pay` | Web Speech API voice command parser. "Pay ₹500 to Rahul" pre-fills the payment form automatically |

### Security & Fraud Intelligence

| Feature | Route | Description |
|---|---|---|
| **Ghost Hunter** | `/ghost-hunter` | Detects dormant or synthetic accounts by checking account age, transaction frequency, and behavioral regularity |
| **Fraud Heatmap** | `/fraud-heatmap` | Calendar-style heatmap of fraud frequency by date. Click any day to see the transaction list |
| **Fraud Timeline** | `/fraud-timeline` | Chronological event log of all fraud flags for a UPI ID with severity badges and timestamps |
| **Fraud Calendar** | `/fraud-calendar` | Monthly calendar view with fraud density color coding per day |
| **Network Analysis** | `/network-analysis` | Force-directed graph of the transaction network. Node size represents transaction volume; edge color represents risk level |
| **Watchlist** | `/watchlist` | Manually blacklist or whitelist UPI IDs. Community-reported entries appear automatically |
| **Community Reports** | `/community-reports` | Crowd-sourced fraud reports with upvote/downvote. Community trust score derived from report frequency |
| **Biometric Guard** | `/biometric-guard` | WebAuthn / device biometric challenge integration for high-value transaction confirmation |
| **Security Badges** | `/security-badges` | Earned achievement badges: "30-day clean streak", "fraud reporter", "early adopter", and more |
| **Dispute Center** | `/dispute-center` | Raise, track, and resolve transaction disputes with a status timeline: Raised → Under Review → Resolved |

### AI Assistant & Platform

| Feature | Route | Description |
|---|---|---|
| **AI Assistant** | `/ai-assistant` | Claude AI-powered chat for financial questions: "Why was this flagged?", "How do I improve my score?" |
| **AI Hub** | `/ai-hub` | Central hub linking all AI-powered features with usage stats and quick-launch cards |
| **Notifications Center** | `/notifications` | Real-time fraud alerts, payment confirmations, and score changes via Firestore snapshot listener |
| **Help & Support** | `/help-support` | FAQ, contact form, and in-app documentation |
| **Feedback Center** | `/feedback-center` | User satisfaction ratings and feature feedback with aggregated stats |
| **Settings** | `/settings` | Profile management, notification preferences, linked banks, and API key management |
| **Payment Health** | `/payment-health` | Payment success rate, failure analysis, and gateway performance metrics |
| **Transaction Simulation** | (widget) | Simulate transactions with configurable risk levels for demo and testing |
| **Recent Transactions** | `/recent` | Scrollable list of recent transactions with inline fraud score badges |

---

## ML Model Details

### Algorithm

| Model | Purpose |
|---|---|
| Random Forest Classifier (scikit-learn) | Primary fraud scoring — supervised binary classification |
| Isolation Forest (scikit-learn) | Unsupervised anomaly detection for unlabeled data |
| GAN (TensorFlow/Keras) | Synthetic fraud data generation for training augmentation |

### 22 Input Features

| # | Feature | Description |
|---|---|---|
| 1 | Transaction Amount | Raw INR value |
| 2 | Transaction Frequency | Transactions per day for this account |
| 3 | Recipient Blacklist Status | Binary: known bad actor flag |
| 4 | Device Fingerprinting | Device trust score |
| 5 | VPN or Proxy Usage | Binary: anonymizer detected |
| 6 | Behavioral Biometrics | Typing rhythm / interaction pattern score |
| 7 | Time Since Last Transaction | Seconds since previous transaction |
| 8 | Social Trust Score | Derived from contact relationship history |
| 9 | Account Age | Days since account creation |
| 10 | High-Risk Transaction Times | Binary: 2–5 AM transaction window |
| 11 | Past Fraudulent Behavior Flags | Count of historical fraud flags on this account |
| 12 | Location-Inconsistent Transactions | Binary: geo-velocity anomaly detected |
| 13 | Normalized Transaction Amount | Z-score vs. user's 30-day average |
| 14 | Transaction Context Anomalies | Merchant category mismatch score |
| 15 | Fraud Complaints Count | Community-reported complaint count for recipient |
| 16 | Merchant Category Mismatch | Binary: unusual merchant type for this profile |
| 17 | User Daily Limit Exceeded | Binary: over user-configured daily limit |
| 18 | Recent High-Value Transaction Flags | Fraud flags in last 24 hours |
| 19 | Recipient Verification Status: suspicious | One-hot encoded |
| 20 | Recipient Verification Status: verified | One-hot encoded |
| 21 | Geo-Location Flags: normal | One-hot encoded |
| 22 | Geo-Location Flags: unusual | One-hot encoded |

### Additional Algorithms

| Algorithm | Component |
|---|---|
| Union-Find (Disjoint Set Union) | Fraud Ring Detector — clusters connected accounts into fraud rings |
| Levenshtein Distance | Pre-Payment Shield — detects UPI ID spoofing (e.g. `rahul@okicic` vs `rahul@okicici`) |
| SHAP-style Feature Attribution | Anomaly Explainer — per-feature contribution waterfall chart |
| Force-Directed Graph Layout | Network Analysis + Fraud Ring Detector — visual graph rendering |
| Day-of-Week Risk Multipliers | Future Risk Predictor — temporal fraud probability weighting |
| KDE / Statistical Drift Detection | Dataset Drift — training vs. live distribution divergence |
| GAN (Generator + Discriminator) | Synthetic fraud sample generation for training data augmentation |

---

## Flask API Reference

### Fraud Detection Core

| Method | Endpoint | Description |
|---|---|---|
| POST | `/predict` | Score a single transaction — returns probability 0–1 and risk label |
| POST | `/check-single` | Single transaction check with per-feature breakdown |
| POST | `/batch-check` | Score a batch of transactions from a JSON array |
| POST | `/upload` | Upload CSV dataset for analysis |
| POST | `/detect` | Run full detection pipeline on uploaded dataset |
| GET | `/health` | Server health check and model load status |

### Explainability & Insights

| Method | Endpoint | Description |
|---|---|---|
| GET | `/explain/<idx>` | SHAP-style explanation for result at index `idx` |
| POST | `/bulk-explain` | Batch SHAP explanations for all flagged transactions |
| POST | `/counterfactual` | What-if: minimum changes to flip the fraud decision |
| POST | `/risk-profile` | Composite risk profile for a UPI ID |
| GET | `/feature-importance` | Ranked feature importance scores from trained model |
| GET | `/ai-summary` | Claude AI narrative summary of uploaded dataset |
| POST | `/explain-transaction` | Per-transaction AI narrative explanation |

### Data & Exploration

| Method | Endpoint | Description |
|---|---|---|
| GET | `/explore` | Dataset statistics, distributions, and class balance |
| GET | `/results` | Paginated detection results |
| GET | `/features` | List of active feature names |
| POST | `/similarity-search` | Find top-N most similar transactions to a given one |
| GET | `/smart-threshold` | Adaptive fraud threshold based on recent data distribution |

### Fraud Analytics

| Method | Endpoint | Description |
|---|---|---|
| GET | `/fraud-trends` | Time-series fraud rate over the last 30 days |
| GET | `/fraud-calendar` | Fraud event counts grouped by calendar date |
| GET | `/network-analysis` | Transaction network graph (nodes + edges as JSON) |
| GET | `/cluster-analysis` | Fraud cluster groupings |
| GET | `/live-fraud-feed` | SSE stream of real-time fraud events |
| POST | `/fraud-ring-analysis` | Union-Find clustering for connected account groups |
| POST | `/fraud-forecast` | Short-term fraud probability forecast |

### Fraud Detection Variants

| Method | Endpoint | Description |
|---|---|---|
| POST | `/velocity-check` | Rapid-fire transaction velocity detection |
| POST | `/amount-pattern` | Unusual amount pattern detection |
| POST | `/account-takeover` | Account compromise indicator scoring |
| POST | `/recipient-trust` | Per-recipient risk score |
| POST | `/spending-pattern` | Behavioral spending anomaly detection |
| POST | `/transaction-purpose` | Transaction context and purpose analysis |
| POST | `/geo-velocity` | Geographic velocity fraud detection |
| POST | `/device-risk` | Device fingerprint risk assessment |
| POST | `/prepayment-check` | Pre-payment UPI spoofing check (Levenshtein) |
| POST | `/dark-pattern-check` | UX dark pattern detection in payment flows |

### Advanced Scoring

| Method | Endpoint | Description |
|---|---|---|
| POST | `/risk-score-blend` | Multi-factor weighted composite risk score |
| POST | `/financial-health` | 6-dimension financial health composite (300–850 scale) |
| POST | `/spending-dna` | 8-dimension behavioral radar profile |
| GET/POST | `/future-risk/<upi_id>` | 7-day fraud probability forecast for a UPI ID |
| POST | `/payment-health` | Payment success/failure health score |
| GET | `/community-score/<upi_id>` | Crowd-sourced community trust score |
| GET | `/score-history` | Historical risk score snapshots for a user |

### Financial Products

| Method | Endpoint | Description |
|---|---|---|
| POST | `/budget-predict` | ML budget burn-rate forecast |
| POST | `/emi/calculate` | EMI computation with amortization schedule |
| POST | `/savings-goals/projection` | Savings goal timeline and contribution projection |
| POST | `/split-bill/calculate` | Split bill calculation (equal or custom) |
| POST | `/recurring-payments/next-dates` | Next scheduled payment dates |

### Payment Infrastructure

| Method | Endpoint | Description |
|---|---|---|
| POST | `/razorpay/create-order` | Create Razorpay payment order |
| POST | `/razorpay/verify-payment` | Verify Razorpay payment signature |
| GET | `/razorpay/payment-status/<id>` | Get payment status by ID |
| POST | `/razorpay/webhook` | Handle Razorpay webhook events |
| POST | `/phone-pay/check` | Phone Pay UPI ID validation |
| GET | `/phone-pay/history` | Phone Pay transaction history |
| POST | `/api/card/bin` | Card BIN lookup and issuer identification |
| POST | `/api/otp/send` | OTP generation and dispatch |
| POST | `/api/otp/verify` | OTP verification |
| POST | `/api/mobile/discover-banks` | Mobile-linked bank account discovery |
| POST | `/api/vpa/lookup` | UPI VPA validation and holder lookup |
| POST | `/api/account/link` | Bank account linking via UPI |

### AI & Behavioral

| Method | Endpoint | Description |
|---|---|---|
| POST | `/voice-parse` | Parse voice command to structured payment intent |
| POST | `/spending-coach` | Claude AI personalized spending advice |
| POST | `/financial-story` | Claude AI financial narrative (typewriter-animated on frontend) |
| POST | `/spending-dna` | 8-dimension behavioral spending profile |
| POST | `/contact-trust` | Per-contact risk score |
| POST | `/biometric-verify` | Biometric auth verification |
| POST | `/phone-lookup` | Phone number to UPI ID resolution |

### User & Account Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/watchlist` | Get watchlisted accounts for the user |
| POST | `/disputes` | Raise a transaction dispute |
| GET | `/disputes/<id>` | Get dispute details and status timeline |
| POST | `/feedback` | Submit user feedback |
| GET | `/feedback-stats` | Aggregated feedback statistics |
| GET | `/notifications` | User notification list |
| POST | `/transaction-limits/validate` | Validate a transaction against user-configured limits |
| POST | `/rule-engine` | Evaluate a custom rule set against a transaction |
| POST | `/export-results` | Export detection results as CSV or PDF |

### Model Monitoring

| Method | Endpoint | Description |
|---|---|---|
| GET | `/model-comparison` | Accuracy, precision, recall, F1, AUC across all models |
| GET | `/dataset-drift` | Statistical drift analysis vs. training data baseline |
| POST | `/retraining-readiness` | Assess whether model performance has degraded enough to retrain |

---

## Firebase & Firestore

### Collections

| Collection | Purpose |
|---|---|
| `users` | Profile, UPI IDs, risk score, linked banks, settings |
| `transactions` | Transaction records with fraud scores and flag status |
| `disputes` | Dispute records with status timeline events |
| `feedback` | User feedback and satisfaction ratings |
| `notifications` | Real-time alert events per user |
| `watchlist` | Manually and community-flagged UPI IDs |
| `fraudEvents` | Platform-wide fraud event log |
| `accountTakeovers` | Detected account compromise events |
| `communityReports` | Crowd-sourced fraud reports with vote counts |
| `scoreHistory` | Historical risk score snapshots per user |

### Security Rules

- Users can only read and write their own documents
- Transactions are write-once from authenticated sessions
- Disputes require auth and document ownership verification
- Community reports require authenticated session

---

## Design System — Neural Fraud Defense

A dark-first, glassmorphism design language with JetBrains Mono for all numerical/data display.

### Color Tokens

| Token | Hex | Use |
|---|---|---|
| `--nd-bg` | `#0c1324` | Page background |
| `--nd-surface-0` | `#070d1f` | Deepest surface (ticker bar) |
| `--nd-surface-1` | `#151b2d` | Card base |
| `--nd-surface-2` | `#191f31` | Elevated card |
| `--nd-surface-3` | `#23293c` | Hover state surface |
| `--nd-cyan` | `#4cd7f6` | Primary accent, interactive elements |
| `--nd-violet` | `#d0bcff` | Secondary accent, gradients |
| `--nd-emerald` | `#4edea3` | Success, safe transaction status |
| `--nd-error` | `#ffb4ab` | Fraud alerts, danger, flagged state |
| `--nd-on-surface` | `#dce1fb` | Primary text |
| `--nd-on-variant` | `#bcc9cd` | Secondary text, labels |

### Utility Classes

```css
.glass          /* blur(20px), 8% border — base surface cards */
.glass-md       /* blur(28px), 10% border — elevated panels */
.glass-elevated /* blur(32px), cyan-tinted border — modals and overlays */
.gradient-text  /* cyan → violet → emerald diagonal gradient text */
.label-caps     /* JetBrains Mono 11px, 0.12em tracking, uppercase */
.glow-cyan      /* 0 0 20px rgba(76,215,246,0.15) box shadow */
.glow-emerald   /* 0 0 20px rgba(78,222,163,0.15) box shadow */
.feed-item      /* slide+fade animation for Neural Activity Feed entries */
```

**Typography:** Inter for UI text, JetBrains Mono for all numerical values, transaction IDs, UPI IDs, percentages, and data labels.

---

## Project Structure

```
Intelligent-Financial-Anomaly-Detection-System/
│
├── fraudAI_Frontend_React/              # React 18 SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── logic/                   # 72+ feature components
│   │   │   │   ├── homepage.jsx         # Landing page + authenticated app shell
│   │   │   │   ├── Dashboard.jsx        # Main dashboard with live stats
│   │   │   │   ├── Header.jsx           # Top navigation bar
│   │   │   │   ├── SidebarContent.jsx   # Navigation sidebar with all routes
│   │   │   │   ├── firebase.js          # Firebase init + Firestore helpers
│   │   │   │   ├── AIAssistant.jsx
│   │   │   │   ├── AIFinancialStory.jsx
│   │   │   │   ├── AIHub.jsx
│   │   │   │   ├── AnomalyExplainer.jsx
│   │   │   │   ├── BankLinking.jsx
│   │   │   │   ├── BatchCheck.jsx
│   │   │   │   ├── BehavioralAnalysis.jsx
│   │   │   │   ├── Beneficiaries.jsx
│   │   │   │   ├── BiometricGuard.jsx
│   │   │   │   ├── BudgetPredictor.jsx
│   │   │   │   ├── Budget.jsx
│   │   │   │   ├── BulkExplain.jsx
│   │   │   │   ├── CashFlowForecast.jsx
│   │   │   │   ├── CheckTransaction.jsx
│   │   │   │   ├── CommunityReports.jsx
│   │   │   │   ├── ContactTrustScore.jsx
│   │   │   │   ├── CustomRazorpayCheckout.jsx
│   │   │   │   ├── DatasetDrift.jsx
│   │   │   │   ├── DetectionResults.jsx
│   │   │   │   ├── DisputeCenter.jsx
│   │   │   │   ├── EMICalculator.jsx
│   │   │   │   ├── ExploreData.jsx
│   │   │   │   ├── FeatureInsights.jsx
│   │   │   │   ├── FeedbackCenter.jsx
│   │   │   │   ├── FinancialHealthScore.jsx
│   │   │   │   ├── FinancialPersonality.jsx
│   │   │   │   ├── FraudCalendar.jsx
│   │   │   │   ├── FraudHeatmap.jsx
│   │   │   │   ├── FraudRingDetector.jsx
│   │   │   │   ├── FraudTimeline.jsx
│   │   │   │   ├── FutureRiskPredictor.jsx
│   │   │   │   ├── GhostHunter.jsx
│   │   │   │   ├── HelpSupport.jsx
│   │   │   │   ├── LiveFraudFeed.jsx
│   │   │   │   ├── MLWorkflowStepper.jsx
│   │   │   │   ├── ModelComparison.jsx
│   │   │   │   ├── MultiGatewayCheckout.jsx
│   │   │   │   ├── NetworkAnalysis.jsx
│   │   │   │   ├── NotificationsCenter.jsx
│   │   │   │   ├── PayByPhone.jsx
│   │   │   │   ├── PaymentAuthModal.jsx
│   │   │   │   ├── PaymentHealth.jsx
│   │   │   │   ├── PrePaymentShield.jsx
│   │   │   │   ├── QRPay.jsx
│   │   │   │   ├── RazorpayCheckout.jsx
│   │   │   │   ├── Recent.jsx
│   │   │   │   ├── RecurringPayments.jsx
│   │   │   │   ├── RequestMoney.jsx
│   │   │   │   ├── RetrainingReadiness.jsx
│   │   │   │   ├── RiskProfile.jsx
│   │   │   │   ├── RiskScoreBlend.jsx
│   │   │   │   ├── RuleEngine.jsx
│   │   │   │   ├── RunDetection.jsx
│   │   │   │   ├── SavingsGoals.jsx
│   │   │   │   ├── ScoreHistory.jsx
│   │   │   │   ├── SecurityBadges.jsx
│   │   │   │   ├── Settings.jsx
│   │   │   │   ├── SpendingCoach.jsx
│   │   │   │   ├── SpendingDNA.jsx
│   │   │   │   ├── SplitBill.jsx
│   │   │   │   ├── Statements.jsx
│   │   │   │   ├── TransactionSimulation.jsx
│   │   │   │   ├── UploadData.jsx
│   │   │   │   ├── VoicePayAssistant.jsx
│   │   │   │   └── Watchlist.jsx
│   │   │   └── ui/                      # shadcn/ui + Radix UI components
│   │   ├── hooks/                        # Custom React hooks
│   │   ├── lib/                          # Utility functions (cn, formatters)
│   │   ├── assets/                       # Images and static files
│   │   ├── App.jsx                       # Route definitions
│   │   ├── main.jsx                      # React entry point
│   │   └── index.css                     # Neural Fraud Defense design system CSS
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env
│
├── AI_model_server_Flask/               # Python Flask ML server
│   ├── app.py                           # 6,700+ line main application
│   ├── requirements.txt                 # Python dependencies
│   ├── static/                          # Built React SPA output (Vite build target)
│   └── .env
│
├── AI_model_Py_Scripts/                 # Data science notebooks
│   ├── DataSetGeneratorUSingNumpy.ipynb # NumPy-based fraud dataset generation
│   ├── FraudDetectionUSingGAN.ipynb     # GAN-based synthetic fraud data
│   └── fraud_dataset_Generator_using_numpy.csv  # 3.5 MB labeled dataset
│
├── SystemDesignDiagrams/                # Architecture diagrams (Mermaid → PNG)
├── firebase.json                        # Firebase Hosting + Functions config
├── firestore.rules                      # Firestore security rules
├── seed-fraud-users.mjs                 # Database seed script for test accounts
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- Firebase project with Firestore and Google Auth enabled
- Razorpay account (for payment features)
- Anthropic API key (for AI narrative and spending coach features)

### 1. Clone

```bash
git clone https://github.com/balreddy-fullstack-developer/Intelligent-Financial-Anomaly-Detection-System.git
cd Intelligent-Financial-Anomaly-Detection-System
```

### 2. Start the Flask ML Server

```bash
cd AI_model_server_Flask
pip install -r requirements.txt
python app.py
```

Server starts on `http://localhost:5000`.  
Swagger API docs available at `http://localhost:5000/apidocs`.

### 3. Start the React Frontend

```bash
cd fraudAI_Frontend_React
npm install
npm run dev
```

App starts on `http://localhost:5173`.

### 4. Build for Production

```bash
cd fraudAI_Frontend_React
npm run build
# Output goes to ../AI_model_server_Flask/static/
# Flask serves the React SPA directly in production
```

---

## Environment Variables

### React Frontend — `fraudAI_Frontend_React/.env`

```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
```

### Flask Server — `AI_model_server_Flask/.env`

```env
FLASK_SECRET_KEY=your_secret_key
FIREBASE_SERVICE_ACCOUNT_JSON=path/to/serviceAccount.json
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```

---

## Data Science

### Dataset Generation

Two approaches in `AI_model_Py_Scripts/`:

**NumPy rule-based** (`DataSetGeneratorUSingNumpy.ipynb`) — Generates labeled fraud/non-fraud records using statistical distributions and injected fraud patterns. Outputs a 3.5 MB CSV with the 22-feature schema.

**GAN-based** (`FraudDetectionUSingGAN.ipynb`) — TensorFlow GAN trained on seed fraud patterns to generate realistic synthetic fraudulent transactions that are harder to detect and more varied than rule-based generation.

### Model Training Pipeline

1. Load and validate CSV against 22-feature schema
2. SMOTE oversampling or class-weight balancing for imbalanced classes
3. 5-fold stratified cross-validation
4. GridSearchCV hyperparameter tuning (n_estimators, max_depth, min_samples_split)
5. Feature importance extraction → populates Feature Insights UI
6. Model serialized to `.pkl` and loaded by Flask on startup

---

## License

MIT License — see `LICENSE` for details.

---

<div align="center">

Built by **balreddy-fullstack-developer**

**AegisAI** — Defending finances with intelligence

</div>
