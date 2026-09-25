import React, { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

export default function Bundles({ onAddToCart }) {
  const [bundles, setBundles] = useState([]);

  useEffect(() => {
    fetch(`${API}/bundles`).then((r) => r.json()).then(setBundles);
  }, []);

  const addBundleToCart = (bundle) => {
    bundle.items.forEach((item) => onAddToCart(item, 1));
  };

  return (
    <div className="card">
      <h2>🍲 Recipe Kits</h2>
      <p className="subtitle">Everything you need for a dish, in one tap.</p>

      <div className="bundle-grid">
        {bundles.map((b) => (
          <div className="bundle-card" key={b.id}>
            <h3>{b.name}</h3>
            <p className="bundle-desc">{b.description}</p>
            <ul className="bundle-items">
              {b.items.map((item) => (
                <li key={item.id}>{item.name} — ₹{item.price}/{item.unit}</li>
              ))}
            </ul>
            <p className="bundle-total">
              Total: ₹{b.items.reduce((sum, i) => sum + i.price, 0)}
            </p>
            <button onClick={() => addBundleToCart(b)}>Add Kit to Cart</button>
          </div>
        ))}
      </div>
    </div>
  );
}
