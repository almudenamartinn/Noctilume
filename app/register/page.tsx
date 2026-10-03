"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function register(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirm) {
      alert("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: `${firstName} ${lastName}`.trim(), name: firstName } },
    });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    alert(
      data?.user
        ? "Registration complete. You can now sign in."
        : "Check your email to confirm your registration."
    );

    router.push("/login");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-950 via-gray-900 to-gray-800 px-4">
      <form
        onSubmit={register}
        className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl p-6 sm:p-8 w-full max-w-md space-y-5 shadow-lg"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">🌌 Create an account</h1>

          <p className="text-gray-300 mt-1">Join Noctilume</p>
        </div>

        <input
          type="text"
          placeholder="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full border border-white/10 bg-gray-900/60 text-white placeholder:text-gray-400 rounded-lg p-3 outline-none focus:border-indigo-400"
        />

        <input
          type="text"
          placeholder="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full border border-white/10 bg-gray-900/60 text-white placeholder:text-gray-400 rounded-lg p-3 outline-none focus:border-indigo-400"
        />

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-white/10 bg-gray-900/60 text-white placeholder:text-gray-400 rounded-lg p-3 outline-none focus:border-indigo-400"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-white/10 bg-gray-900/60 text-white placeholder:text-gray-400 rounded-lg p-3 outline-none focus:border-indigo-400"
        />

        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full border border-white/10 bg-gray-900/60 text-white placeholder:text-gray-400 rounded-lg p-3 outline-none focus:border-indigo-400"
        />

        <button
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg py-3 transition"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="text-sm text-center text-gray-300">
          Already have an account? <a href="/login" className="underline text-indigo-300">Sign in</a>
        </p>
      </form>
    </main>
  );
}
