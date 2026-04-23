"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Create Supabase auth user
    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // 2. Create workspace + user record via API
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, workspaceName }),
    });

    if (!res.ok) {
      setError("Account created but workspace setup failed. Please contact support.");
    } else {
      setDone(true);
    }

    setLoading(false);
  }

  const inputCls =
    "w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-lg font-semibold">
            <span className="text-violet-600">●</span> AgentWatch
          </Link>
          <p className="text-sm text-gray-400 mt-1">Create your free account</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {done ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📬</span>
              </div>
              <h3 className="text-sm font-medium mb-1">Confirm your email</h3>
              <p className="text-xs text-gray-400">
                We sent a confirmation link to{" "}
                <span className="font-medium text-gray-700">{email}</span>.
                Click it to activate your account.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Workspace name</label>
                <input
                  required
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="Acme Inc."
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className={inputCls}
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full text-sm bg-violet-600 text-white py-2.5 rounded-lg hover:bg-violet-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Creating account…" : "Create free account"}
              </button>

              <p className="text-center text-xs text-gray-400">
                Already have an account?{" "}
                <Link href="/login" className="text-violet-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
