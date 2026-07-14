import { useState, useEffect } from "react";

// The frontend tier talks to the backend tier over HTTP.
// This runs in YOUR browser, so it uses localhost + the port
// mapped on your machine (see docker-compose.yaml).
const API_BASE = "http://localhost:5001/api";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadMessages() {
    try {
      const res = await fetch(`${API_BASE}/messages`);
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setMessages(data);
      setError("");
    } catch (err) {
      setError("⚠️ Could not reach the backend API. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMessages();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      if (!res.ok) throw new Error("Failed to save");
      setName("");
      setMessage("");
      loadMessages();
    } catch (err) {
      setError("Failed to save message.");
    }
  }

  return (
    <div className="container">
      <h1>📖 Guestbook (Three-Tier App)</h1>
      <p>
        <strong>Frontend tier:</strong> React (this page) &nbsp;|&nbsp;
        <strong>Backend tier:</strong> Node/Express REST API &nbsp;|&nbsp;
        <strong>Database tier:</strong> PostgreSQL
      </p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="name">Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <label htmlFor="message">Message</label>
        <textarea
          id="message"
          rows="3"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
        <button type="submit">Add Message</button>
      </form>

      {error && <p className="error">{error}</p>}

      <h2>Messages</h2>
      {loading ? (
        <p>Loading...</p>
      ) : messages.length === 0 ? (
        <p>No messages yet — be the first to write one!</p>
      ) : (
        messages.map((entry) => (
          <div className="entry" key={entry.id}>
            <div className="name">{entry.name}</div>
            <div>{entry.message}</div>
            <div className="time">{entry.created_at}</div>
          </div>
        ))
      )}
    </div>
  );
}
