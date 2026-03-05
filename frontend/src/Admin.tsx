import React, { useState, useEffect } from "react";
import { Trash2, Upload, Plus, RefreshCw, Key, LogIn } from "lucide-react";

// Base URL for FastAPI
const API_BASE = "http://localhost:8000"; // Change to your FastAPI host

// Replace with your actual auth logic or remove if using real backend auth
const mockAuth = { username: "admin", password: "password" };

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [target, setTarget] = useState<"frontend" | "backend">("frontend");
  const [env, setEnv] = useState<Record<string, string>>({});
  const [updatedEnv, setUpdatedEnv] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // --- Login ---
  const login = () => {
    if (user === mockAuth.username && password === mockAuth.password) {
      setLoggedIn(true);
    } else {
      alert("Invalid credentials");
    }
  };

  // --- Fetch .env ---
  const fetchEnv = async (target: "frontend" | "backend") => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/env/${target}`);
      if (!res.ok) throw new Error("Failed to fetch .env");
      const data = await res.json();
      setEnv(data);
      setUpdatedEnv(data);
    } catch (e: any) {
      console.error(e);
      setMessage("Error fetching .env: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh env on target switch
  useEffect(() => {
    if (loggedIn) fetchEnv(target);
  }, [target, loggedIn]);

  // --- Save .env ---
  const saveEnv = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/env/${target}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedEnv),
      });
      if (!res.ok) throw new Error("Failed to save .env");
      const data = await res.json();
      setMessage(data.message || "Saved successfully");
      fetchEnv(target); // Refresh after save
    } catch (e: any) {
      console.error(e);
      setMessage("Error saving .env: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Admin actions ---
  const restartServices = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/admin/restart-services`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to restart services");
      const data = await res.json();
      setMessage(data.message || "Services restarted successfully.");
    } catch (e: any) {
      console.error(e);
      setMessage("Error restarting services: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const pullGitHub = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`${API_BASE}/admin/pull-github`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to pull GitHub");
      const data = await res.json();
      setMessage(data.message || "GitHub pulled successfully.");
    } catch (e: any) {
      console.error(e);
      setMessage("Error pulling GitHub: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Render login page ---
  if (!loggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded shadow w-96">
          <h1 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <LogIn size={24} /> Admin Login
          </h1>
          <input
            type="text"
            placeholder="Username"
            className="w-full mb-2 px-3 py-2 border rounded"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full mb-4 px-3 py-2 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            onClick={login}
            className="w-full bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </div>
      </div>
    );
  }

  // --- Render admin dashboard ---
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Key size={28} /> Admin Dashboard
      </h1>

      {/* Target switch */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setTarget("frontend")}
          className={`px-3 py-1 rounded ${
            target === "frontend" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Frontend
        </button>
        <button
          onClick={() => setTarget("backend")}
          className={`px-3 py-1 rounded ${
            target === "backend" ? "bg-blue-600 text-white" : "bg-gray-200"
          }`}
        >
          Backend
        </button>
        <button
          onClick={() => fetchEnv(target)}
          className="ml-auto bg-green-500 text-white px-3 py-1 rounded flex items-center gap-2"
        >
          <RefreshCw size={16} /> Refresh .env
        </button>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="bg-white p-4 rounded shadow space-y-2">
          {Object.entries(env).map(([key, value]) => (
            <div key={key} className="flex gap-2 items-center">
              <label className="w-48 font-medium">{key}</label>
              <input
                className="border rounded px-2 py-1 flex-1"
                value={updatedEnv[key] ?? value}
                onChange={(e) =>
                  setUpdatedEnv({ ...updatedEnv, [key]: e.target.value })
                }
              />
            </div>
          ))}
          <button
            onClick={saveEnv}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded flex items-center gap-2 hover:bg-green-700"
          >
            <RefreshCw size={16} /> Save & Restart Services
          </button>
          {message && <p className="text-green-600 mt-2">{message}</p>}
        </div>
      )}

      {/* Admin action buttons */}
      <div className="mt-6 bg-white p-4 rounded shadow flex gap-4">
        <button
          onClick={restartServices}
          disabled={loading}
          className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300 flex items-center gap-2"
        >
          <RefreshCw size={16} /> Restart All Services
        </button>
        <button
          onClick={pullGitHub}
          disabled={loading}
          className="bg-gray-200 px-3 py-2 rounded hover:bg-gray-300 flex items-center gap-2"
        >
          <Plus size={16} /> Pull Latest GitHub
        </button>
      </div>
    </div>
  );
}
