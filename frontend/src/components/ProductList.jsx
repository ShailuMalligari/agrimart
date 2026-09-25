import React, { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

export default function ProductList({ onAddToCart, user }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("default"); // default | freshness | distance
  const [loading, setLoading] = useState(true);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [offeringId, setOfferingId] = useState(null);
  const [offerForm, setOfferForm] = useState({ offerPrice: "", qty: 1 });

  const fetchProducts = async (query = "", sort = sortMode) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (sort !== "default") params.set("sort", sort);
      if (sort === "distance" && user?.location?.lat) {
        params.set("lat", user.location.lat);
        params.set("lng", user.location.lng);
      }
      const res = await fetch(`${API}/products?${params.toString()}`);
      setProducts(await res.json());
    } catch (err) {
      console.error("Failed to fetch products", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchProducts(search);
  };

  const changeSort = (mode) => {
    setSortMode(mode);
    fetchProducts(search, mode);
  };

  const submitReview = async (productId) => {
    await fetch(`${API}/products/${productId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: user?.id,
        customerName: user?.name,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      }),
    });
    setReviewingId(null);
    setReviewForm({ rating: 5, comment: "" });
    fetchProducts(search, sortMode);
  };

  const submitOffer = async (productId) => {
    if (!offerForm.offerPrice) return;
    await fetch(`${API}/offers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId,
        customerId: user?.id,
        customerName: user?.name,
        offerPrice: offerForm.offerPrice,
        qty: offerForm.qty,
      }),
    });
    setOfferingId(null);
    setOfferForm({ offerPrice: "", qty: 1 });
    alert("Offer sent to the farmer! They'll review it and you'll see it accepted/rejected under Orders once they respond.");
  };

  const freshnessLabel = (days) => {
    if (days === 0) return "Harvested today";
    if (days === 1) return "Harvested yesterday";
    return `Harvested ${days} days ago`;
  };

  return (
    <div className="card">
      <h2>Browse Products</h2>
      <form onSubmit={handleSearch} className="search-bar">
        <input type="text" placeholder="Search e.g. tomato, rice..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit">Search</button>
      </form>

      <div className="sort-bar">
        <button className={sortMode === "default" ? "active" : ""} onClick={() => changeSort("default")}>Default</button>
        <button className={sortMode === "freshness" ? "active" : ""} onClick={() => changeSort("freshness")}>🌱 Freshest First</button>
        <button
          className={sortMode === "distance" ? "active" : ""}
          onClick={() => changeSort("distance")}
          disabled={!user?.location?.lat}
          title={!user?.location?.lat ? "Add your location on registration to use this" : ""}
        >
          📍 Near You First
        </button>
      </div>

      {loading ? (
        <p>Loading products...</p>
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <div className="product-card" key={p.id}>
              {p.image && <img src={p.image} alt={p.name} className="product-thumb" />}
              <h3>{p.name}</h3>
              <p className="category">{p.category}</p>
              <p className="price">₹{p.price} / {p.unit}</p>

              <div className="farmer-line">
                <span>{p.farmer}</span>
                {p.farmerVerified && <span className="verified-badge">✔ Verified</span>}
              </div>

              <p className="freshness-badge">🌱 {freshnessLabel(p.daysSinceHarvest)}</p>
              {p.distanceKm != null && <p className="distance-badge">📍 {p.distanceKm} km away</p>}

              <p className="rating-line">
                {p.reviewCount > 0 ? `⭐ ${p.avgRating} (${p.reviewCount} review${p.reviewCount > 1 ? "s" : ""})` : "No reviews yet"}
              </p>

              <p className="stock">Stock: {p.stock} {p.unit}</p>

              <div className="card-actions">
                <button onClick={() => onAddToCart(p, 1)}>Add to Cart</button>
                <button className="secondary-btn" onClick={() => setReviewingId(reviewingId === p.id ? null : p.id)}>Rate</button>
                <button className="secondary-btn" onClick={() => setOfferingId(offeringId === p.id ? null : p.id)}>Make Offer</button>
              </div>

              {reviewingId === p.id && (
                <div className="inline-form">
                  <select value={reviewForm.rating} onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}>
                    {[5, 4, 3, 2, 1].map((r) => <option key={r} value={r}>{r} ⭐</option>)}
                  </select>
                  <input
                    type="text"
                    placeholder="Optional comment"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  />
                  <button onClick={() => submitReview(p.id)}>Submit</button>
                </div>
              )}

              {offeringId === p.id && (
                <div className="inline-form">
                  <input
                    type="number"
                    placeholder={`Your price (listed ₹${p.price})`}
                    value={offerForm.offerPrice}
                    onChange={(e) => setOfferForm({ ...offerForm, offerPrice: e.target.value })}
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={offerForm.qty}
                    onChange={(e) => setOfferForm({ ...offerForm, qty: e.target.value })}
                  />
                  <button onClick={() => submitOffer(p.id)}>Send Offer</button>
                </div>
              )}
            </div>
          ))}
          {products.length === 0 && <p>No products found.</p>}
        </div>
      )}
    </div>
  );
}
