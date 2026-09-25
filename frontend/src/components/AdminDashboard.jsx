import React, { useEffect, useState } from "react";
import { useLanguage } from "../i18n.jsx";

const API = "http://localhost:5000/api";

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [view, setView] = useState("users");
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const fetchAll = async () => {
    const [u, p, o] = await Promise.all([
      fetch(`${API}/users`).then((r) => r.json()),
      fetch(`${API}/products`).then((r) => r.json()),
      fetch(`${API}/orders`).then((r) => r.json()),
    ]);
    setUsers(u);
    setProducts(p);
    setOrders(o);
  };

  useEffect(() => { fetchAll(); }, []);

  const deleteProduct = async (id) => {
    await fetch(`${API}/products/${id}`, { method: "DELETE" });
    fetchAll();
  };

  return (
    <div className="card">
      <h2>{t("adminDashboard")}</h2>

      <div className="admin-subtabs">
        <button className={view === "users" ? "active" : ""} onClick={() => setView("users")}>Users ({users.length})</button>
        <button className={view === "products" ? "active" : ""} onClick={() => setView("products")}>Products ({products.length})</button>
        <button className={view === "orders" ? "active" : ""} onClick={() => setView("orders")}>Orders ({orders.length})</button>
      </div>

      {view === "users" && (
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Phone</th><th>Role</th><th>Location</th></tr></thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.phone}</td>
                <td>{u.role}</td>
                <td>{u.location?.address || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {view === "products" && (
        <table className="admin-table">
          <thead><tr><th>Photo</th><th>Name</th><th>Farmer</th><th>Price</th><th>Stock</th><th>Rating</th><th>Verified</th><th></th></tr></thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.image ? <img src={p.image} alt={p.name} className="admin-thumb" /> : "—"}</td>
                <td>{p.name}</td>
                <td>{p.farmer}</td>
                <td>₹{p.price}/{p.unit}</td>
                <td>{p.stock}</td>
                <td>{p.reviewCount > 0 ? `⭐ ${p.avgRating}` : "—"}</td>
                <td>{p.farmerVerified ? "✔" : "—"}</td>
                <td><button onClick={() => deleteProduct(p.id)}>Remove</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {view === "orders" && (
        <table className="admin-table">
          <thead><tr><th>ID</th><th>Customer</th><th>Phone</th><th>Address</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td>{o.id}</td>
                <td>{o.customerName}</td>
                <td>{o.customerPhone || "—"}</td>
                <td>{o.deliveryAddress?.address || "—"}</td>
                <td>₹{o.total}</td>
                <td>{o.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
