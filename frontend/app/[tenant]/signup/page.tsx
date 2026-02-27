"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function SignupPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenant as string;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Check if user already has a valid session for this tenant
  useEffect(() => {
    const sessionKey = `session_${tenantSlug}`;
    const sessionData = localStorage.getItem(sessionKey);

    if (sessionData) {
      try {
        const session = JSON.parse(sessionData);
        // Check if token is still valid (not expired)
        if (session.expires_at && session.expires_at * 1000 > Date.now()) {
          router.push(`/${tenantSlug}/dashboard`);
        } else {
          // Clean up expired session
          localStorage.removeItem(sessionKey);
        }
      } catch (error) {
        console.error("Failed to parse session:", error);
        localStorage.removeItem(sessionKey);
      }
    }
  }, [tenantSlug, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Backend handles all security validation and internal email generation
      const result = await authClient.signUp(tenantSlug, email, password);

      // Auto-login enabled - session is always returned
      if (result.session) {
        const sessionKey = `session_${tenantSlug}`;
        localStorage.setItem(sessionKey, JSON.stringify(result.session));
        router.push(`/${tenantSlug}/dashboard`);
      } else {
        // This should never happen with auto-login, but handle gracefully
        setError("Account created but unable to log in. Please try logging in manually.");
      }
    } catch (err: any) {
      setError(err.message || "Unable to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Tenant:{" "}
            <span className="font-medium text-blue-600">{tenantSlug}</span>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-800">{error}</div>
            </div>
          )}

          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>

            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password (min 8 characters)"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating account..." : "Sign up"}
            </button>
          </div>

          <div className="text-center text-sm">
            <span className="text-gray-600">Already have an account? </span>
            <a
              href={`/${tenantSlug}/login`}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
