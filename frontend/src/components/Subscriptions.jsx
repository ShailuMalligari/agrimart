import React, { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

export default function Subscriptions({ user }) {
  const [subs, setSubs] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ productId: "", qty: 1, frequency: "weekly" });

  const fetchSubs = async () => {
    const res = await fetch(`${API}/subscriptions?customerId=${user.id}`);
    setSubs(await res.json());
  };

  useEffect(() => {
    fetchSubs();
    fetch(`${API}/products`).then((r) => r.json()).then(setProducts);
  }, []);

  const addSub = async (e) => {
    e.preventDefault();
    if (!form.productId) return;
    await fetch(`${API}/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId: user.id, ...form }),
    });
    setForm({ productId: "", qty: 1, frequency: "weekly" });
    fetchSubs();
  };

  const removeSub = async (id) => {
    await fetch(`${API}/subscriptions/${id}`, { method: "DELETE" });
    fetchSubs();
  };

  const deliverNow = async (id) => {
    await fetch(`${API}/subscriptions/${id}/deliver-now`, { method: "POST" });
    alert("An order has been created from this subscription — check your Orders tab!");
  };

  return (
    <div className="card">
      <h2>🔁 Subscriptions</h2>
      <p className="subtitle">Set up recurring deliveries so you never run out of staples.</p>

      <form onSubmit={addSub} className="subscription-form">
        <select value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} required>
          <option value="">Select product...</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name} (₹{p.price}/{p.unit})</option>)}
        </select>
        <input
          type="number"
          min="1"
          value={form.qty}
          onChange={(e) => setForm({ ...form, qty: e.target.value })}
        />
        <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        <button type="submit">Subscribe</button>
      </form>

      <h3>Your Subscriptions</h3>
      {subs.length === 0 && <p>No active subscriptions.</p>}
      {subs.map((s) => (
        <div className="subscription-card" key={s.id}>
          <div>
            <strong>{s.product?.name}</strong> — {s.qty} {s.product?.unit}, {s.frequency}
          </div>
          <div className="sub-actions">
            <button onClick={() => deliverNow(s.id)}>Simulate delivery now</button>
            <button className="secondary-btn" onClick={() => removeSub(s.id)}>Cancel</button>
          </div>
        </div>
      ))}
    </div>
  );
}
