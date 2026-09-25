import React, { useState } from "react";
import ProductList from "./components/ProductList.jsx";
import Cart from "./components/Cart.jsx";
import VoiceChatbot from "./components/VoiceChatbot.jsx";
import Orders from "./components/Orders.jsx";
import Login from "./components/Login.jsx";
import FarmerDashboard from "./components/FarmerDashboard.jsx";
import AdminDashboard from "./components/AdminDashboard.jsx";
import Bundles from "./components/Bundles.jsx";
import Subscriptions from "./components/Subscriptions.jsx";
import { LanguageProvider, useLanguage } from "./i18n.jsx";

function AppContent() {
  const { t, lang, setLang } = useLanguage();
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("marketplace");
  const [cart, setCart] = useState([]);

  const addToCart = (product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        return prev.map((i) => (i.productId === product.id ? { ...i, qty: i.qty + qty } : i));
      }
      return [...prev, { productId: product.id, name: product.name, price: product.price, unit: product.unit, qty }];
    });
  };

  const clearCart = () => setCart([]);

  const handleLogin = (loggedInUser) => {
    setUser(loggedInUser);
    setLang(loggedInUser.language || "en");
    if (loggedInUser.role === "farmer") setTab("farmerDashboard");
    else if (loggedInUser.role === "admin") setTab("adminDashboard");
    else setTab("marketplace");
  };

  const handleLogout = () => {
    setUser(null);
    setCart([]);
    setTab("marketplace");
  };

  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="app">
      <header className="header">
        <div className="header-top">
          <div>
            <h1>🌾 {t("appTitle")}</h1>
            <p>{t("tagline")}</p>
          </div>
          <div className="header-actions">
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              <option value="en">English</option>
              <option value="hi">हिंदी</option>
              <option value="te">తెలుగు</option>
            </select>
            <span className="user-chip">{user.name} ({t(user.role)})</span>
            <button onClick={handleLogout}>{t("logout")}</button>
          </div>
        </div>
      </header>

      <nav className="tabs">
        {user.role === "customer" && (
          <>
            <button className={tab === "marketplace" ? "active" : ""} onClick={() => setTab("marketplace")}>{t("marketplace")}</button>
            <button className={tab === "bundles" ? "active" : ""} onClick={() => setTab("bundles")}>{t("bundles")}</button>
            <button className={tab === "cart" ? "active" : ""} onClick={() => setTab("cart")}>{t("cart")} ({cart.reduce((n, i) => n + i.qty, 0)})</button>
            <button className={tab === "subscriptions" ? "active" : ""} onClick={() => setTab("subscriptions")}>{t("subscriptions")}</button>
            <button className={tab === "chatbot" ? "active" : ""} onClick={() => setTab("chatbot")}>🎤 {t("voiceAssistant")}</button>
            <button className={tab === "orders" ? "active" : ""} onClick={() => setTab("orders")}>{t("orders")}</button>
          </>
        )}
        {user.role === "farmer" && (
          <button className={tab === "farmerDashboard" ? "active" : ""} onClick={() => setTab("farmerDashboard")}>{t("farmerDashboard")}</button>
        )}
        {user.role === "admin" && (
          <button className={tab === "adminDashboard" ? "active" : ""} onClick={() => setTab("adminDashboard")}>{t("adminDashboard")}</button>
        )}
      </nav>

      <main className="content">
        {user.role === "customer" && tab === "marketplace" && <ProductList onAddToCart={addToCart} user={user} />}
        {user.role === "customer" && tab === "bundles" && <Bundles onAddToCart={addToCart} />}
        {user.role === "customer" && tab === "cart" && <Cart cart={cart} setCart={setCart} onOrderPlaced={clearCart} user={user} />}
        {user.role === "customer" && tab === "subscriptions" && <Subscriptions user={user} />}
        {user.role === "customer" && tab === "chatbot" && <VoiceChatbot onAddToCart={addToCart} user={user} />}
        {user.role === "customer" && tab === "orders" && <Orders user={user} />}
        {user.role === "farmer" && tab === "farmerDashboard" && <FarmerDashboard user={user} />}
        {user.role === "admin" && tab === "adminDashboard" && <AdminDashboard />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
