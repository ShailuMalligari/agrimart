import React, { useState } from "react";

const API = "http://localhost:5000/api";

export default function Cart({ cart, setCart, onOrderPlaced, user }) {
  const [placing, setPlacing] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  const total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

  const updateQty = (productId, qty) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
      return;
    }
    setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, qty } : i)));
  };

  const checkout = async () => {
    if (!cart.length) return;
    setPlacing(true);
    try {
      const res = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: user?.id,
          customerName: user?.name || "Guest",
          customerPhone: user?.phone,
          deliveryAddress: user?.location,
          items: cart.map((i) => ({ productId: i.productId, qty: i.qty })),
        }),
      });
      const order = await res.json();
      setLastOrder(order);
      onOrderPlaced();
    } catch (err) {
      console.error("Checkout failed", err);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="card">
      <h2>Your Cart</h2>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <table className="cart-table">
            <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Subtotal</th><th></th></tr></thead>
            <tbody>
              {cart.map((i) => (
                <tr key={i.productId}>
                  <td>{i.name}</td>
                  <td>
                    <input type="number" min="0" value={i.qty} onChange={(e) => updateQty(i.productId, Number(e.target.value))} /> {i.unit}
                  </td>
                  <td>₹{i.price}</td>
                  <td>₹{i.price * i.qty}</td>
                  <td><button onClick={() => updateQty(i.productId, 0)}>Remove</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <h3>Total: ₹{total}</h3>
          <p className="delivery-info">
            📍 Delivering to: {user?.location?.address || "No address on file — please update your profile"}
            <br />📞 {user?.phone}
          </p>
          <button disabled={placing} onClick={checkout}>{placing ? "Placing order..." : "Place Order"}</button>
        </>
      )}

      {lastOrder && (
        <div className="order-confirm">✅ Order #{lastOrder.id} placed successfully! Total: ₹{lastOrder.total}</div>
      )}
    </div>
  );
}
