import React, { useEffect, useState } from "react";

const API = "http://localhost:5000/api";
const STAGES = ["Pending", "Confirmed", "Packed", "Out for Delivery", "Delivered"];

export default function Orders({ user }) {
  const [orders, setOrders] = useState([]);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API}/orders?customerId=${user?.id}`);
      const data = await res.json();
      setOrders(data.reverse());
    } catch (err) {
      console.error("Failed to fetch orders", err);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const advanceOrder = async (id) => {
    await fetch(`${API}/orders/${id}/advance`, { method: "POST" });
    fetchOrders();
  };

  return (
    <div className="card">
      <h2>Your Orders</h2>
      <button onClick={fetchOrders} className="refresh-btn">Refresh</button>

      {orders.length === 0 && <p>No orders yet.</p>}

      {orders.map((o) => (
        <div className="order-card" key={o.id}>
          <div className="order-header">
            <strong>Order #{o.id}</strong>
            <span>₹{o.total}</span>
          </div>
          {o.fromOffer && <span className="offer-status accepted">From accepted offer</span>}
          {o.fromSubscription && <span className="offer-status accepted">From subscription</span>}
          <ul>
            {o.items.map((item, idx) => <li key={idx}>{item.name} × {item.qty}</li>)}
          </ul>

          <div className="progress-track">
            {STAGES.map((stage) => (
              <span key={stage} className={`stage ${STAGES.indexOf(o.status) >= STAGES.indexOf(stage) ? "done" : ""}`}>{stage}</span>
            ))}
          </div>

          {o.status !== "Delivered" && (
            <button onClick={() => advanceOrder(o.id)}>Simulate next stage (delivery partner action)</button>
          )}
        </div>
      ))}
    </div>
  );
}
