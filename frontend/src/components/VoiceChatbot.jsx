import React, { useRef, useState } from "react";

const API = "http://localhost:5000/api";
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function VoiceChatbot({ onAddToCart, user }) {
  const [listening, setListening] = useState(false);
  const [messages, setMessages] = useState([
    { from: "bot", text: "Hi! Try saying: 'search tomato', 'price of onion', 'order 2 kg rice', or 'track order 1'." },
  ]);
  const [textInput, setTextInput] = useState("");
  const [supported] = useState(!!SpeechRecognition);
  const recognitionRef = useRef(null);

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-IN";
    window.speechSynthesis.speak(utterance);
  };

  const sendToBot = async (text) => {
    setMessages((prev) => [...prev, { from: "user", text }]);
    try {
      const res = await fetch(`${API}/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          customerId: user?.id,
          customerName: user?.name || "Guest",
          customerPhone: user?.phone,
          deliveryAddress: user?.location,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { from: "bot", text: data.reply }]);
      speak(data.reply);
      if (data.intent === "SEARCH_PRODUCT" && Array.isArray(data.data) && data.data.length === 1) {
        onAddToCart(data.data[0], 1);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { from: "bot", text: "Sorry, I couldn't reach the server. Is the backend running on port 5000?" }]);
      console.error(err);
    }
  };

  const startListening = () => {
    if (!supported) return;
    const recognition = new SpeechRecognition();
    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => sendToBot(event.results[0][0].transcript);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    sendToBot(textInput.trim());
    setTextInput("");
  };

  return (
    <div className="card chatbot">
      <h2>🎤 Voice Assistant</h2>
      {!supported && <p className="warning">Voice recognition isn't supported in this browser. Please use Chrome or Edge, or type your query below.</p>}

      <div className="chat-window">
        {messages.map((m, idx) => <div key={idx} className={`chat-bubble ${m.from}`}>{m.text}</div>)}
      </div>

      <div className="chat-controls">
        {supported && (
          <button className={`mic-btn ${listening ? "listening" : ""}`} onClick={listening ? stopListening : startListening}>
            {listening ? "🔴 Listening... (click to stop)" : "🎤 Tap to Speak"}
          </button>
        )}
        <form onSubmit={handleTextSubmit} className="text-fallback">
          <input type="text" placeholder="Or type your query here..." value={textInput} onChange={(e) => setTextInput(e.target.value)} />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
