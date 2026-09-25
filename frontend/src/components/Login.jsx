import React, { useState } from "react";
import { useLanguage } from "../i18n.jsx";

const API = "http://localhost:5000/api";

export default function Login({ onLogin }) {
  const { t, lang, setLang } = useLanguage();
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({ name: "", phone: "", password: "", address: "" });
  const [location, setLocation] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Geolocation isn't supported on this device/browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => setError("Couldn't get your location: " + err.message)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        const needsLocation = role === "customer" || role === "farmer";
        const res = await fetch(`${API}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role, name: form.name, phone: form.phone, password: form.password, language: lang,
            location: needsLocation ? { address: form.address, ...location } : null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Registration failed");
        onLogin(data);
      } else {
        const res = await fetch(`${API}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: form.phone, password: form.password, role }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Login failed");
        onLogin(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="lang-switcher">
          <select value={lang} onChange={(e) => setLang(e.target.value)}>
            <option value="en">English</option>
            <option value="hi">हिंदी</option>
            <option value="te">తెలుగు</option>
          </select>
        </div>

        <h1>🌾 {t("appTitle")}</h1>
        <p className="tagline">{t("tagline")}</p>

        <div className="role-tabs">
          {["customer", "farmer", "admin"].map((r) => (
            <button key={r} className={role === r ? "active" : ""} onClick={() => setRole(r)} type="button">
              {t(r)}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {mode === "register" && (
            <input type="text" placeholder={t("name")} value={form.name} onChange={(e) => update("name", e.target.value)} required />
          )}
          <input type="tel" placeholder={t("phone")} value={form.phone} onChange={(e) => update("phone", e.target.value)} required />
          <input type="password" placeholder={t("password")} value={form.password} onChange={(e) => update("password", e.target.value)} required />

          {mode === "register" && (role === "customer" || role === "farmer") && (
            <>
              <input
                type="text"
                placeholder={role === "farmer" ? "Farm location (village/district)" : t("address")}
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                required
              />
              <button type="button" className="location-btn" onClick={useMyLocation}>{t("useMyLocation")}</button>
              {location && (
                <p className="location-confirm">✅ Location captured ({location.lat.toFixed(3)}, {location.lng.toFixed(3)})</p>
              )}
              {role === "farmer" && (
                <p className="hint" style={{ marginTop: 0 }}>
                  Your location lets nearby customers discover your products first.
                </p>
              )}
            </>
          )}

          {error && <p className="error-text">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? "..." : mode === "login" ? t("login") : t("register")}
          </button>
        </form>

        <p className="toggle-mode">
          {mode === "login" ? (
            <>{t("dontHaveAccount")} <button type="button" onClick={() => setMode("register")}>{t("register")}</button></>
          ) : (
            <>{t("alreadyHaveAccount")} <button type="button" onClick={() => setMode("login")}>{t("login")}</button></>
          )}
        </p>

        {role === "admin" && mode === "login" && (
          <p className="hint">Demo admin: phone 9999999999 / password admin123</p>
        )}
        {role === "farmer" && mode === "login" && (
          <p className="hint">Demo farmer: phone 9000000001 / password farm123</p>
        )}
      </div>
    </div>
  );
}
