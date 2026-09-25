/**
 * AGRIMART Backend (v2)
 * ------------------------
 * In-memory Express API — no DB setup needed to run this immediately.
 * See README for how to swap these arrays for MongoDB/Mongoose later.
 *
 * SECURITY NOTE: passwords are plain text here purely to keep this a
 * zero-setup prototype. Hash with bcrypt + issue JWTs before real use.
 */

import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" })); // allows base64 product images

const PORT = 5000;

// ---------------------------------------------------------------
// 1. IN-MEMORY "DATABASE"
// ---------------------------------------------------------------

let users = [
  { id: 1, role: "admin", name: "Admin", phone: "9999999999", password: "admin123", language: "en", location: null },
];
let userIdCounter = 2;

// Seed two farmers with locations so "near you" discovery has something to show
users.push(
  { id: 2, role: "farmer", name: "Ramesh Kumar", phone: "9000000001", password: "farm123", language: "en", location: { address: "Warangal, Telangana", district: "Warangal", lat: 17.9689, lng: 79.5941 } },
  { id: 3, role: "farmer", name: "Lakshmi Devi", phone: "9000000002", password: "farm123", language: "en", location: { address: "Guntur, Andhra Pradesh", district: "Guntur", lat: 16.3067, lng: 80.4365 } }
);
userIdCounter = 4;

let products = [
  { id: 1, name: "Tomato", category: "Vegetable", price: 30, unit: "kg", stock: 120, farmerId: 2, farmer: "Ramesh Kumar", image: "https://images.unsplash.com/photo-1546470427-e26264be0b0d?w=300", harvestDate: daysAgo(1), reviews: [] },
  { id: 2, name: "Onion", category: "Vegetable", price: 25, unit: "kg", stock: 200, farmerId: 2, farmer: "Ramesh Kumar", image: "https://images.unsplash.com/photo-1508747703725-719777637510?w=300", harvestDate: daysAgo(3), reviews: [] },
  { id: 3, name: "Potato", category: "Vegetable", price: 20, unit: "kg", stock: 150, farmerId: 2, farmer: "Ramesh Kumar", image: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=300", harvestDate: daysAgo(5), reviews: [] },
  { id: 4, name: "Rice", category: "Grain", price: 55, unit: "kg", stock: 300, farmerId: 3, farmer: "Lakshmi Devi", image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300", harvestDate: daysAgo(20), reviews: [] },
  { id: 5, name: "Wheat", category: "Grain", price: 32, unit: "kg", stock: 250, farmerId: 3, farmer: "Lakshmi Devi", image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300", harvestDate: daysAgo(15), reviews: [] },
  { id: 6, name: "Mango", category: "Fruit", price: 80, unit: "kg", stock: 90, farmerId: 3, farmer: "Lakshmi Devi", image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=300", harvestDate: daysAgo(2), reviews: [] },
  { id: 7, name: "Banana", category: "Fruit", price: 40, unit: "dozen", stock: 100, farmerId: 2, farmer: "Ramesh Kumar", image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=300", harvestDate: daysAgo(1), reviews: [] },
  { id: 8, name: "Milk", category: "Dairy", price: 55, unit: "litre", stock: 80, farmerId: 3, farmer: "Lakshmi Devi", image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=300", harvestDate: daysAgo(0), reviews: [] },
];
let productIdCounter = 9;

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

let orders = []; // { id, items:[{productId, farmerId, name, qty, price}], status, customerId, customerName, customerPhone, deliveryAddress, createdAt }
let orderIdCounter = 1;

let subscriptions = []; // { id, customerId, productId, qty, frequency, nextDelivery, active }
let subIdCounter = 1;

let offers = []; // { id, productId, customerId, customerName, offerPrice, qty, status, createdAt }
let offerIdCounter = 1;

const ORDER_STAGES = ["Pending", "Confirmed", "Packed", "Out for Delivery", "Delivered"];

const RECIPE_BUNDLES = [
  { id: 1, name: "Sambar Kit", description: "Everything for a classic South Indian sambar", itemNames: ["Tomato", "Onion", "Potato"] },
  { id: 2, name: "Fruit Basket", description: "Fresh seasonal fruit combo", itemNames: ["Mango", "Banana"] },
  { id: 3, name: "Kitchen Staples", description: "Weekly grain essentials", itemNames: ["Rice", "Wheat"] },
];

// ---------------------------------------------------------------
// HELPERS
// ---------------------------------------------------------------

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(a));
}

function daysSince(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

// Trust score: blends average rating across a farmer's products with
// how many completed (Delivered) orders they've fulfilled. Both are
// normalized to 0-5 then averaged. "Verified" badge needs a decent
// score AND a minimum order history, so a brand-new farmer with one
// 5-star fluke review doesn't outrank an established one.
function computeFarmerTrust(farmerId) {
  const farmerProducts = products.filter((p) => p.farmerId === farmerId);
  const allReviews = farmerProducts.flatMap((p) => p.reviews);
  const avgRating = allReviews.length
    ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length
    : 0;

  const completedOrders = orders.filter(
    (o) => o.status === "Delivered" && o.items.some((i) => i.farmerId === farmerId)
  ).length;
  const orderScore = Math.min(completedOrders / 10, 1) * 5; // caps at 10 orders = full score

  const trustScore = allReviews.length
    ? Number(((avgRating * 0.7) + (orderScore * 0.3)).toFixed(1))
    : Number(orderScore.toFixed(1));

  return {
    trustScore,
    avgRating: Number(avgRating.toFixed(1)),
    reviewCount: allReviews.length,
    completedOrders,
    verified: trustScore >= 3.5 && completedOrders >= 3,
  };
}

function enrichProduct(p) {
  const trust = computeFarmerTrust(p.farmerId);
  return {
    ...p,
    daysSinceHarvest: daysSince(p.harvestDate),
    avgRating: trust.avgRating,
    reviewCount: trust.reviewCount,
    farmerVerified: trust.verified,
    farmerTrustScore: trust.trustScore,
  };
}

// ---------------------------------------------------------------
// 2. AUTH / USER ROUTES
// ---------------------------------------------------------------

app.post("/api/auth/register", (req, res) => {
  const { role, name, phone, password, location, language } = req.body;
  if (!role || !name || !phone || !password) {
    return res.status(400).json({ error: "role, name, phone, and password are required" });
  }
  if (users.find((u) => u.phone === phone)) {
    return res.status(409).json({ error: "An account with this phone number already exists" });
  }
  const user = {
    id: userIdCounter++,
    role,
    name,
    phone,
    password,
    location: location || null, // { address, district, lat, lng } — used for both customers (delivery) and farmers (local discovery)
    language: language || "en",
  };
  users.push(user);
  const { password: _pw, ...safeUser } = user;
  res.status(201).json(safeUser);
});

app.post("/api/auth/login", (req, res) => {
  const { phone, password, role } = req.body;
  const user = users.find((u) => u.phone === phone && u.password === password && u.role === role);
  if (!user) return res.status(401).json({ error: "Invalid phone, password, or role" });
  const { password: _pw, ...safeUser } = user;
  res.json(safeUser);
});

app.put("/api/users/:id/location", (req, res) => {
  const user = users.find((u) => u.id === Number(req.params.id));
  if (!user) return res.status(404).json({ error: "User not found" });
  user.location = req.body.location;
  const { password: _pw, ...safeUser } = user;
  res.json(safeUser);
});

app.get("/api/users", (req, res) => {
  const { role } = req.query;
  let result = users;
  if (role) result = result.filter((u) => u.role === role);
  res.json(result.map(({ password, ...safe }) => safe));
});

// ---------------------------------------------------------------
// 3. PRODUCT ROUTES (with freshness, trust score, local discovery)
// ---------------------------------------------------------------

app.get("/api/products", (req, res) => {
  const { search, category, farmerId, lat, lng, sort } = req.query;
  let result = products;

  if (search) result = result.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  if (category) result = result.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  if (farmerId) result = result.filter((p) => p.farmerId === Number(farmerId));

  let enriched = result.map(enrichProduct);

  // "Near you" discovery — sort by distance from the customer's lat/lng
  // to their product's farmer's registered location.
  if (lat && lng) {
    enriched = enriched.map((p) => {
      const farmer = users.find((u) => u.id === p.farmerId);
      const distanceKm = farmer?.location?.lat
        ? Number(haversineKm(Number(lat), Number(lng), farmer.location.lat, farmer.location.lng).toFixed(1))
        : null;
      return { ...p, distanceKm };
    });
    if (sort === "distance") {
      enriched.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
    }
  }

  if (sort === "freshness") {
    enriched.sort((a, b) => a.daysSinceHarvest - b.daysSinceHarvest);
  }

  res.json(enriched);
});

app.get("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(enrichProduct(product));
});

app.post("/api/products", (req, res) => {
  const { name, category, price, unit, stock, farmerId, farmerName, image, harvestDate } = req.body;
  if (!name || !category || !price || !unit || !farmerId) {
    return res.status(400).json({ error: "name, category, price, unit, and farmerId are required" });
  }
  const product = {
    id: productIdCounter++,
    name,
    category,
    price: Number(price),
    unit,
    stock: Number(stock) || 0,
    farmerId: Number(farmerId),
    farmer: farmerName || "Unknown Farmer",
    image: image || null,
    harvestDate: harvestDate || new Date().toISOString(),
    reviews: [],
  };
  products.push(product);
  res.status(201).json(enrichProduct(product));
});

app.put("/api/products/:id", (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Product not found" });
  Object.assign(product, req.body);
  res.json(enrichProduct(product));
});

app.delete("/api/products/:id", (req, res) => {
  products = products.filter((p) => p.id !== Number(req.params.id));
  res.json({ success: true });
});

// ---- Reviews ----
app.post("/api/products/:id/reviews", (req, res) => {
  const product = products.find((p) => p.id === Number(req.params.id));
  if (!product) return res.status(404).json({ error: "Product not found" });
  const { customerId, customerName, rating, comment } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: "rating must be between 1 and 5" });
  }
  const review = {
    id: product.reviews.length + 1,
    customerId,
    customerName: customerName || "Anonymous",
    rating: Number(rating),
    comment: comment || "",
    createdAt: new Date().toISOString(),
  };
  product.reviews.push(review);
  res.status(201).json(enrichProduct(product));
});

// ---------------------------------------------------------------
// 4. VOICE PRODUCT LISTING PARSER (farmer speaks, form auto-fills)
// ---------------------------------------------------------------
// Reuses the same rule-based parsing philosophy as the chatbot — no
// external API dependency, so it never breaks mid-demo. A farmer can
// say something like "tomato 30 rupees per kg 50 kilos stock" and get
// the Add Product form filled in automatically.

app.post("/api/parse-listing", (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "text is required" });
  const t = text.toLowerCase();

  const knownNames = ["tomato", "onion", "potato", "rice", "wheat", "mango", "banana", "milk", "carrot", "brinjal", "chilli", "cucumber", "grapes", "apple"];
  const nameMatch = knownNames.find((n) => t.includes(n));

  const priceMatch = t.match(/(\d+)\s*(rupees|rs|₹)/);
  const qtyMatch = t.match(/(\d+)\s*(kg|kilo|litre|dozen|piece)/);

  let category = "Other";
  if (["tomato", "onion", "potato", "carrot", "brinjal", "chilli", "cucumber"].includes(nameMatch)) category = "Vegetable";
  else if (["mango", "banana", "grapes", "apple"].includes(nameMatch)) category = "Fruit";
  else if (["rice", "wheat"].includes(nameMatch)) category = "Grain";
  else if (["milk"].includes(nameMatch)) category = "Dairy";

  res.json({
    name: nameMatch ? nameMatch[0].toUpperCase() + nameMatch.slice(1) : "",
    category,
    price: priceMatch ? Number(priceMatch[1]) : "",
    unit: qtyMatch?.[2]?.startsWith("kilo") ? "kg" : (qtyMatch?.[2] || "kg"),
    stock: qtyMatch ? Number(qtyMatch[1]) : "",
  });
});

// ---------------------------------------------------------------
// 5. NEGOTIATION / MAKE-AN-OFFER (addresses a gap flagged in agri e-commerce literature:
// most platforms use fixed pricing only, with no farmer-buyer negotiation)
// ---------------------------------------------------------------

app.post("/api/offers", (req, res) => {
  const { productId, customerId, customerName, offerPrice, qty } = req.body;
  const product = products.find((p) => p.id === Number(productId));
  if (!product) return res.status(404).json({ error: "Product not found" });
  const offer = {
    id: offerIdCounter++,
    productId: Number(productId),
    productName: product.name,
    farmerId: product.farmerId,
    customerId,
    customerName,
    offerPrice: Number(offerPrice),
    qty: Number(qty) || 1,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };
  offers.push(offer);
  res.status(201).json(offer);
});

app.get("/api/offers", (req, res) => {
  const { farmerId, customerId } = req.query;
  let result = offers;
  if (farmerId) result = result.filter((o) => o.farmerId === Number(farmerId));
  if (customerId) result = result.filter((o) => o.customerId === Number(customerId));
  res.json(result);
});

app.post("/api/offers/:id/respond", (req, res) => {
  const offer = offers.find((o) => o.id === Number(req.params.id));
  if (!offer) return res.status(404).json({ error: "Offer not found" });
  const { accept } = req.body;
  offer.status = accept ? "Accepted" : "Rejected";

  if (accept) {
    const product = products.find((p) => p.id === offer.productId);
    const order = {
      id: orderIdCounter++,
      customerId: offer.customerId,
      customerName: offer.customerName,
      customerPhone: null,
      deliveryAddress: null,
      items: [{ productId: offer.productId, farmerId: offer.farmerId, name: offer.productName, qty: offer.qty, price: offer.offerPrice }],
      total: offer.offerPrice * offer.qty,
      status: "Pending",
      createdAt: new Date().toISOString(),
      fromOffer: true,
    };
    orders.push(order);
  }
  res.json(offer);
});

// ---------------------------------------------------------------
// 6. SUBSCRIPTIONS (recurring orders — e.g. "2kg tomatoes every week")
// ---------------------------------------------------------------

app.post("/api/subscriptions", (req, res) => {
  const { customerId, productId, qty, frequency } = req.body;
  const sub = {
    id: subIdCounter++,
    customerId,
    productId: Number(productId),
    qty: Number(qty) || 1,
    frequency: frequency || "weekly", // "daily" | "weekly"
    active: true,
    createdAt: new Date().toISOString(),
  };
  subscriptions.push(sub);
  res.status(201).json(sub);
});

app.get("/api/subscriptions", (req, res) => {
  const { customerId } = req.query;
  let result = subscriptions;
  if (customerId) result = result.filter((s) => s.customerId === Number(customerId));
  const enriched = result.map((s) => ({
    ...s,
    product: products.find((p) => p.id === s.productId) || null,
  }));
  res.json(enriched);
});

app.delete("/api/subscriptions/:id", (req, res) => {
  subscriptions = subscriptions.filter((s) => s.id !== Number(req.params.id));
  res.json({ success: true });
});

// Simulate a subscription firing — creates an order from it (in a real
// system a cron job would call this on schedule)
app.post("/api/subscriptions/:id/deliver-now", (req, res) => {
  const sub = subscriptions.find((s) => s.id === Number(req.params.id));
  if (!sub) return res.status(404).json({ error: "Subscription not found" });
  const product = products.find((p) => p.id === sub.productId);
  if (!product) return res.status(404).json({ error: "Product not found" });

  const order = {
    id: orderIdCounter++,
    customerId: sub.customerId,
    customerName: users.find((u) => u.id === sub.customerId)?.name || "Guest",
    customerPhone: users.find((u) => u.id === sub.customerId)?.phone || null,
    deliveryAddress: users.find((u) => u.id === sub.customerId)?.location || null,
    items: [{ productId: product.id, farmerId: product.farmerId, name: product.name, qty: sub.qty, price: product.price }],
    total: product.price * sub.qty,
    status: "Pending",
    createdAt: new Date().toISOString(),
    fromSubscription: true,
  };
  orders.push(order);
  res.status(201).json(order);
});

// ---------------------------------------------------------------
// 7. RECIPE / BUNDLE BUYING
// ---------------------------------------------------------------

app.get("/api/bundles", (req, res) => {
  const enriched = RECIPE_BUNDLES.map((b) => ({
    ...b,
    items: b.itemNames
      .map((name) => products.find((p) => p.name === name))
      .filter(Boolean)
      .map(enrichProduct),
  }));
  res.json(enriched);
});

// ---------------------------------------------------------------
// 8. ORDER ROUTES
// ---------------------------------------------------------------

app.post("/api/orders", (req, res) => {
  const { items, customerId, customerName, customerPhone, deliveryAddress } = req.body;
  if (!items || !items.length) {
    return res.status(400).json({ error: "Order must contain at least one item" });
  }
  const enrichedItems = items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return {
      productId: item.productId,
      farmerId: product ? product.farmerId : null,
      name: product ? product.name : "Unknown",
      qty: item.qty,
      price: product ? product.price : 0,
    };
  });
  const total = enrichedItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const order = {
    id: orderIdCounter++,
    customerId: customerId || null,
    customerName: customerName || "Guest",
    customerPhone: customerPhone || null,
    deliveryAddress: deliveryAddress || null,
    items: enrichedItems,
    total,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };
  orders.push(order);
  res.status(201).json(order);
});

app.get("/api/orders", (req, res) => {
  const { customerId } = req.query;
  let result = orders;
  if (customerId) result = result.filter((o) => o.customerId === Number(customerId));
  res.json(result);
});

app.get("/api/orders/:id", (req, res) => {
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(order);
});

app.post("/api/orders/:id/advance", (req, res) => {
  const order = orders.find((o) => o.id === Number(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found" });
  const currentIndex = ORDER_STAGES.indexOf(order.status);
  if (currentIndex < ORDER_STAGES.length - 1) order.status = ORDER_STAGES[currentIndex + 1];
  res.json(order);
});

// ---------------------------------------------------------------
// 9. FARMER EARNINGS DASHBOARD
// ---------------------------------------------------------------

app.get("/api/farmers/:id/earnings", (req, res) => {
  const farmerId = Number(req.params.id);
  const farmerOrderItems = [];
  orders.forEach((o) => {
    o.items.forEach((item) => {
      if (item.farmerId === farmerId) {
        farmerOrderItems.push({ ...item, orderId: o.id, status: o.status, date: o.createdAt.slice(0, 10) });
      }
    });
  });

  const totalEarnings = farmerOrderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalOrders = new Set(farmerOrderItems.map((i) => i.orderId)).size;

  // group by date for a simple line/bar chart
  const byDate = {};
  farmerOrderItems.forEach((i) => {
    byDate[i.date] = (byDate[i.date] || 0) + i.price * i.qty;
  });
  const earningsByDate = Object.entries(byDate)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // top products by revenue
  const byProduct = {};
  farmerOrderItems.forEach((i) => {
    byProduct[i.name] = (byProduct[i.name] || 0) + i.price * i.qty;
  });
  const topProducts = Object.entries(byProduct)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  const trust = computeFarmerTrust(farmerId);

  res.json({ totalEarnings, totalOrders, earningsByDate, topProducts, trust });
});

// ---------------------------------------------------------------
// 10. VOICE CHATBOT INTENT ENGINE (English/Hindi/Telugu keywords)
// ---------------------------------------------------------------

const INTENT_KEYWORDS = {
  track: ["track", "status", "where is", "kaha hai", "ekkada undi"],
  order: ["order", "buy", "purchase", "kharido", "konandi"],
  price: ["price", "cost", "rate", "keemat", "dhara"],
  search: ["search", "find", "show", "list", "looking for", "dhoondo", "vetakandi"],
  greeting: ["hello", "hi", "hey", "namaste", "namaskaram"],
};

function parseIntent(text) {
  const t = text.toLowerCase().trim();
  const mentionedProduct = products.find((p) => t.includes(p.name.toLowerCase()));
  const qtyMatch = t.match(/(\d+)\s*(kg|litre|dozen)?/);
  const quantity = qtyMatch ? Number(qtyMatch[1]) : 1;
  const matchesAny = (keywords) => keywords.some((k) => t.includes(k));

  if (matchesAny(INTENT_KEYWORDS.track)) {
    const orderIdMatch = t.match(/order\s*(\d+)/) || t.match(/(\d+)/);
    return { intent: "TRACK_ORDER", orderId: orderIdMatch ? Number(orderIdMatch[1]) : null };
  }
  if (matchesAny(INTENT_KEYWORDS.order)) {
    return { intent: "PLACE_ORDER", product: mentionedProduct, quantity };
  }
  if (matchesAny(INTENT_KEYWORDS.price)) {
    return { intent: "CHECK_PRICE", product: mentionedProduct };
  }
  if (matchesAny(INTENT_KEYWORDS.search)) {
    return { intent: "SEARCH_PRODUCT", product: mentionedProduct, query: t };
  }
  if (matchesAny(INTENT_KEYWORDS.greeting)) {
    return { intent: "GREETING" };
  }
  if (mentionedProduct) return { intent: "SEARCH_PRODUCT", product: mentionedProduct, query: t };
  return { intent: "UNKNOWN" };
}

app.post("/api/chatbot", (req, res) => {
  const { text, customerId, customerName, customerPhone, deliveryAddress } = req.body;
  if (!text) return res.status(400).json({ error: "text is required" });

  const parsed = parseIntent(text);
  let reply = "";
  let data = null;

  switch (parsed.intent) {
    case "GREETING":
      reply = "Hello! You can ask me to search products, check prices, place an order, or track a delivery.";
      break;
    case "SEARCH_PRODUCT": {
      const matches = parsed.product ? [parsed.product] : products.filter((p) => parsed.query.includes(p.category.toLowerCase()));
      data = matches.map(enrichProduct);
      reply = matches.length ? `I found ${matches.length} item(s): ${matches.map((m) => m.name).join(", ")}.` : "Sorry, I couldn't find that product.";
      break;
    }
    case "CHECK_PRICE":
      if (parsed.product) {
        reply = `${parsed.product.name} is priced at ₹${parsed.product.price} per ${parsed.product.unit}.`;
        data = enrichProduct(parsed.product);
      } else {
        reply = "Which product's price would you like to check?";
      }
      break;
    case "PLACE_ORDER":
      if (parsed.product) {
        const order = {
          id: orderIdCounter++,
          customerId: customerId || null,
          customerName: customerName || "Guest",
          customerPhone: customerPhone || null,
          deliveryAddress: deliveryAddress || null,
          items: [{ productId: parsed.product.id, farmerId: parsed.product.farmerId, name: parsed.product.name, qty: parsed.quantity, price: parsed.product.price }],
          total: parsed.product.price * parsed.quantity,
          status: "Pending",
          createdAt: new Date().toISOString(),
        };
        orders.push(order);
        data = order;
        reply = `Order placed for ${parsed.quantity} ${parsed.product.unit} of ${parsed.product.name}. Your order ID is ${order.id}.`;
      } else {
        reply = "Which product would you like to order?";
      }
      break;
    case "TRACK_ORDER": {
      const order = parsed.orderId ? orders.find((o) => o.id === parsed.orderId) : orders[orders.length - 1];
      if (order) {
        data = order;
        reply = `Order ${order.id} is currently: ${order.status}.`;
      } else {
        reply = "I couldn't find that order. Please check the order ID.";
      }
      break;
    }
    default:
      reply = "Sorry, I didn't understand that. Try: 'search tomato', 'price of onion', 'order 2 kg rice', or 'track order 1'.";
  }

  res.json({ intent: parsed.intent, reply, data });
});

// ---------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`AGRIMART backend running on http://localhost:${PORT}`);
});
