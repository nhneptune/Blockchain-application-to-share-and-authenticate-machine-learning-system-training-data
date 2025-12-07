import { useState } from "react";

export default function RegisterData({ wallet }) {
  const [title, setTitle] = useState("");

  async function register() {
    if (!wallet) return alert("Connect wallet first!");

    alert("Metadata registered!");
  }

  return (
    <div className="space-y-4">
      <input
        type="text"
        placeholder="Dataset title..."
        className="w-full px-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/80 backdrop-blur-lg focus:ring-2 focus:ring-pink-300"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <button
        onClick={register}
        className="px-6 py-3 w-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 rounded-xl font-semibold shadow-lg hover:opacity-90 transition"
      >
        Register
      </button>
    </div>
  );
}
