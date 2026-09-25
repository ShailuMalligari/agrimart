# AGRIMART — v2 (with differentiator features)

A working full-stack prototype: React frontend + Node/Express backend +
a rule-based voice chatbot, now extended with features designed to make
this project stand apart from typical "agri e-commerce + chatbot" student
projects — several of these directly address gaps called out in published
literature on this topic (see below).

No database setup required — the backend uses in-memory data so you can
run it immediately. Swap in MongoDB later (see notes at the bottom).

## Demo logins
| Role | Phone | Password |
|---|---|---|
| Admin | 9999999999 | admin123 |
| Farmer (Ramesh, Warangal) | 9000000001 | farm123 |
| Farmer (Lakshmi, Guntur) | 9000000002 | farm123 |

Register a new Customer account yourself to try the full buyer flow.

## What makes this different from a standard agri e-commerce clone

Most similar projects (including ones published as IEEE/conference papers
on this exact topic) implement either a chatbot, or e-commerce, or basic
AI — rarely combined, and almost none implement direct farmer-buyer
negotiation or hyperlocal discovery. This build adds:

**For buyers:**
- **Freshness tags** — every product shows "Harvested X days ago," and
  you can sort the marketplace "Freshest First"
- **Verified Farmer badges** — computed from a trust score blending
  average review rating and completed order history (not just a flag
  anyone can turn on)
- **"Near You" discovery** — sorts products by real distance (haversine
  formula) from the buyer's registered location to the farmer's, using
  the same geolocation captured at signup
- **Reviews with ratings** on every product
- **Recipe/Bundle kits** — one-tap "Add Sambar Kit to Cart" instead of
  hunting down five separate ingredients
- **Subscriptions** — recurring orders (e.g. "2kg tomatoes every week")
- **Make an Offer** — buyers can propose their own price instead of only
  accepting the listed price; farmer accepts/rejects from their dashboard

**For farmers:**
- **Voice-based product listing** — a farmer can literally speak
  "tomato 30 rupees per kg 50 kilo stock" and the Add Product form
  auto-fills. This reuses the same Web Speech API investment as the
  customer-facing voice chatbot, so it's a cohesive "voice-first
  platform" story rather than a bolted-on gimmick
- **Earnings dashboard** with real charts (via `recharts`) — earnings
  over time and top products by revenue, not just a raw order list
- **Offer inbox** — accept or reject buyer price proposals directly

**Platform-wide:**
- Trust scores drive the Verified badge shown to buyers — this is a real
  (if simple) computed metric, not decorative

## Folder structure
```
agrimart/
├── backend/
│   ├── server.js       # Express API: auth, products, reviews, offers,
│   │                     subscriptions, bundles, earnings, chatbot, voice parser
│   └── package.json
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── App.css
        ├── i18n.jsx
        └── components/
            ├── Login.jsx            # role-based login/register + location
            ├── FarmerDashboard.jsx  # voice listing, earnings charts, offers
            ├── AdminDashboard.jsx
            ├── ProductList.jsx      # freshness/trust/reviews/offers/sort
            ├── Bundles.jsx          # recipe kits
            ├── Subscriptions.jsx    # recurring orders
            ├── Cart.jsx
            ├── VoiceChatbot.jsx
            └── Orders.jsx
```

## How to run

### 1. Start the backend
```bash
cd backend
npm install
npm start
```
Runs on **http://localhost:5000**

### 2. Start the frontend (new terminal)
```bash
cd frontend
npm install
npm run dev
```
Runs on **http://localhost:5173**

Open in **Chrome or Edge** (voice recognition needs a Chromium browser).

## Suggested demo flow
1. Log in as **Farmer** (Ramesh, 9000000001 / farm123) → Earnings tab to
   show the charts (there's no data yet — that's expected until step 4)
2. Log in as **Customer** (register a new account, capture your location)
3. On Marketplace, try **"Near You First"** and **"Freshest First"** sorts
4. Add items to cart, checkout — note the delivery address/phone came
   from your profile automatically
5. Go back to a product, click **Rate** to leave a review, and **Make
   Offer** to propose a different price
6. Log back in as the Farmer → **Offers tab** to accept the offer (creates
   an order automatically) → **Earnings tab** now shows real numbers
7. Try the **Voice Assistant** tab as a customer, and the **🎤 Speak
   product details** button on the Farmer Dashboard

## Why this architecture is demo-safe
- No external API keys required anywhere — chatbot, voice listing parser,
  and trust scoring are all pure logic, so nothing can fail from network/
  API downtime during a live demo
- Text fallback next to every mic button
- In-memory data means zero database setup friction

## Next steps to extend further
1. **Security** — hash passwords with `bcrypt`, issue JWTs instead of
   returning user objects directly on login
2. **Database** — move the in-memory arrays to MongoDB/Mongoose
3. **Delivery partner role** — 4th role for order fulfillment + live
   GPS tracking via Socket.io
4. **Payments** — Razorpay/Stripe test mode at checkout
5. **Smarter chatbot & voice-listing parser** — swap the keyword-matching
   in `server.js` for a call to an LLM API for much better natural
   language coverage, especially for Hindi/Telugu

## Related research (for your literature review)
- "AGRIMART: An E-Platform for Agro Products with Voice based Chat Bot" — IEEE
- "E-Agriculture for Direct Marketing of Food Crops Using Chatbots" — IEEE
- "AI-Driven Platform for Direct Market Access for Farmers"
- "Farmer.Chat" — Mobile App for Direct Market Access for Farmers
- "E-Commerce Platform for Farmers" (chat-based negotiation, PHP/MySQL)
- "AGRI-DIRECT: AI-Powered Platform for Direct..." — explicitly notes the
  gap this build addresses: platforms rarely combine direct sales with
  negotiation and AI-based support in one system
