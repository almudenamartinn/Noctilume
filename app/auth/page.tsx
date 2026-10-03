"use client";

import React from "react";

export default function AuthLanding() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 via-gray-800 to-gray-700 text-white">
      <div className="max-w-md w-full text-center p-8 bg-white/5 rounded-xl shadow-lg">
        <h1 className="text-3xl font-extrabold mb-4">Welcome to Noctilume</h1>
        <p className="text-gray-300 mb-6">Sign in or create an account to view the map and report incidents.</p>

        <div className="flex gap-3 justify-center">
          <a href="/login" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium">Sign in</a>
          <a href="/register" className="px-6 py-3 bg-white text-gray-900 rounded-lg font-medium">Create account</a>
        </div>
      </div>
    </main>
  );
}
