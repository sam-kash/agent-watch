"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Mode = "magic" | "password";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
    else setSent(true);
    setLoading(false);
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else router.push("/dashboard");
    setLoading(false);
  }

  const inputCls =
    "w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-500 bg-white";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-lg font-semibold">
            <span className="text-violet-600">●</span> AgentWatch
          </Link>
          <p className="text-sm text-gray-400 mt-1">Sign in to your workspace</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-violet-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-xl">📬</span>
              </div>
              <h3 className="text-sm font-medium mb-1">Check your email</h3>
              <p className="text-xs text-gray-400">
                We sent a magic link to <span className="font-medium text-gray-700">{email}</span>.
                Click it to sign in.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-xs text-violet-600 hover:underline"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <>
              {/* Mode tabs */}
              <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-5">
                {(["magic", "password"] as Mode[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 text-xs py-1.5 rounded-md font-medium transition-colors ${
                      mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                    }`}
                  >
                    {m === "magic" ? "Magic link" : "Password"}
                  </button>
                ))}
              </div>

              <form
                onSubmit={mode === "magic" ? handleMagicLink : handlePassword}
                className="space-y-3"
              >
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

                {mode === "password" && (
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={inputCls}
                    />
                  </div>
                )}

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
                  {loading ? "Signing in…" : mode === "magic" ? "Send magic link" : "Sign in"}
                </button>
              </form>

              <p className="text-center text-xs text-gray-400 mt-4">
                No account?{" "}
                <Link href="/signup" className="text-violet-600 hover:underline">
                  Sign up free
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
