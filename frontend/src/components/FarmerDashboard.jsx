import React, { useEffect, useState } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useLanguage } from "../i18n.jsx";

const API = "http://localhost:5000/api";
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function FarmerDashboard({ user }) {
  const { t } = useLanguage();
  const [view, setView] = useState("products"); // products | earnings | offers
  const [myProducts, setMyProducts] = useState([]);
  const [form, setForm] = useState({ name: "", category: "Vegetable", price: "", unit: "kg", stock: "" });
  const [imagePreview, setImagePreview] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("");
  const [earnings, setEarnings] = useState(null);
  const [offers, setOffers] = useState([]);

  const fetchMyProducts = async () => {
    const res = await fetch(`${API}/products?farmerId=${user.id}`);
    setMyProducts(await res.json());
  };

  const fetchEarnings = async () => {
    const res = await fetch(`${API}/farmers/${user.id}/earnings`);
    setEarnings(await res.json());
  };

  const fetchOffers = async () => {
    const res = await fetch(`${API}/offers?farmerId=${user.id}`);
    setOffers(await res.json());
  };

  useEffect(() => {
    fetchMyProducts();
    fetchEarnings();
    fetchOffers();
  }, []);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
      setImageData(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Voice listing: farmer speaks the product details, we parse it on
  // the backend and auto-fill the form so they don't have to type.
  const startVoiceListing = () => {
    if (!SpeechRecognition) {
      setVoiceStatus("Voice input isn't supported in this browser. Try Chrome or Edge.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.onstart = () => { setListening(true); setVoiceStatus("Listening..."); };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => { setListening(false); setVoiceStatus("Didn't catch that — try again or type manually."); };
    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      setVoiceStatus(`Heard: "${transcript}" — filling form...`);
      const res = await fetch(`${API}/parse-listing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: transcript }),
      });
      const parsed = await res.json();
      setForm((prev) => ({
        ...prev,
        name: parsed.name || prev.name,
        category: parsed.category || prev.category,
        price: parsed.price || prev.price,
        unit: parsed.unit || prev.unit,
        stock: parsed.stock || prev.stock,
      }));
      setVoiceStatus("Form filled from voice — review and click Add Product.");
    };
    recognition.start();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch(`${API}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, farmerId: user.id, farmerName: user.name, image: imageData }),
      });
      setForm({ name: "", category: "Vegetable", price: "", unit: "kg", stock: "" });
      setImagePreview(null);
      setImageData(null);
      setVoiceStatus("");
      fetchMyProducts();
    } catch (err) {
      console.error("Failed to add product", err);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteProduct = async (id) => {
    await fetch(`${API}/products/${id}`, { method: "DELETE" });
    fetchMyProducts();
  };

  const respondOffer = async (id, accept) => {
    await fetch(`${API}/offers/${id}/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accept }),
    });
    fetchOffers();
  };

  return (
    <div className="card">
      <h2>{t("farmerDashboard")}</h2>

      {earnings?.trust?.verified && <span className="verified-badge large">✔ Verified Farmer</span>}

      <div className="admin-subtabs">
        <button className={view === "products" ? "active" : ""} onClick={() => setView("products")}>My Products</button>
        <button className={view === "earnings" ? "active" : ""} onClick={() => setView("earnings")}>{t("earnings")}</button>
        <button className={view === "offers" ? "active" : ""} onClick={() => setView("offers")}>
          {t("offers")} {offers.filter((o) => o.status === "Pending").length > 0 && `(${offers.filter((o) => o.status === "Pending").length})`}
        </button>
      </div>

      {view === "products" && (
        <>
          <form onSubmit={handleSubmit} className="farmer-form">
            <div className="image-upload">
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="image-preview" />
              ) : (
                <div className="image-placeholder">📷 {t("productImage")}</div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} />
            </div>

            <button
              type="button"
              className={`mic-btn small ${listening ? "listening" : ""}`}
              onClick={startVoiceListing}
            >
              {listening ? "🔴 Listening..." : "🎤 Speak product details"}
            </button>
            {voiceStatus && <p className="voice-status">{voiceStatus}</p>}
            <p className="hint" style={{ marginTop: 0 }}>
              Try: "tomato 30 rupees per kg 50 kilo stock"
            </p>

            <input type="text" placeholder={t("productName")} value={form.name} onChange={(e) => update("name", e.target.value)} required />
            <select value={form.category} onChange={(e) => update("category", e.target.value)}>
              <option>Vegetable</option><option>Fruit</option><option>Grain</option><option>Dairy</option><option>Other</option>
            </select>
            <input type="number" placeholder={t("price")} value={form.price} onChange={(e) => update("price", e.target.value)} required />
            <select value={form.unit} onChange={(e) => update("unit", e.target.value)}>
              <option value="kg">kg</option><option value="litre">litre</option><option value="dozen">dozen</option><option value="piece">piece</option>
            </select>
            <input type="number" placeholder={t("stock")} value={form.stock} onChange={(e) => update("stock", e.target.value)} />
            <button type="submit" disabled={submitting}>{submitting ? "..." : t("addProduct")}</button>
          </form>

          <h3>Your Products</h3>
          <div className="product-grid">
            {myProducts.map((p) => (
              <div className="product-card" key={p.id}>
                {p.image && <img src={p.image} alt={p.name} className="product-thumb" />}
                <h3>{p.name}</h3>
                <p className="price">₹{p.price} / {p.unit}</p>
                <p className="stock">Stock: {p.stock} {p.unit}</p>
                <p className="rating-line">{p.reviewCount > 0 ? `⭐ ${p.avgRating} (${p.reviewCount})` : "No reviews yet"}</p>
                <button onClick={() => deleteProduct(p.id)}>Remove</button>
              </div>
            ))}
            {myProducts.length === 0 && <p>You haven't added any products yet.</p>}
          </div>
        </>
      )}

      {view === "earnings" && earnings && (
        <div className="earnings-view">
          <div className="stat-row">
            <div className="stat-box">
              <span className="stat-value">₹{earnings.totalEarnings}</span>
              <span className="stat-label">Total Earnings</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{earnings.totalOrders}</span>
              <span className="stat-label">Orders Fulfilled</span>
            </div>
            <div className="stat-box">
              <span className="stat-value">{earnings.trust.trustScore}/5</span>
              <span className="stat-label">Trust Score</span>
            </div>
          </div>

          {earnings.earningsByDate.length > 0 && (
            <>
              <h3>Earnings Over Time</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={earnings.earningsByDate}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke="#2e7d32" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </>
          )}

          {earnings.topProducts.length > 0 && (
            <>
              <h3>Top Products by Revenue</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={earnings.topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#2e7d32" />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}

          {earnings.totalOrders === 0 && <p>No orders yet — earnings will appear here once customers buy your products.</p>}
        </div>
      )}

      {view === "offers" && (
        <div>
          {offers.length === 0 && <p>No offers yet.</p>}
          {offers.map((o) => (
            <div className="offer-card" key={o.id}>
              <div>
                <strong>{o.customerName}</strong> offered ₹{o.offerPrice}/unit for {o.qty} × {o.productName}
                <span className={`offer-status ${o.status.toLowerCase()}`}> — {o.status}</span>
              </div>
              {o.status === "Pending" && (
                <div className="sub-actions">
                  <button onClick={() => respondOffer(o.id, true)}>Accept</button>
                  <button className="secondary-btn" onClick={() => respondOffer(o.id, false)}>Reject</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
