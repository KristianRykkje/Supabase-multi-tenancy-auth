"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function LoginPage() {
  const params = useParams();
  const router = useRouter();
  const tenantSlug = params.tenant as string;

  const [activeTab, setActiveTab] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.login(tenantSlug, email, password);

      // Store session data per tenant
      if (result.session) {
        const sessionKey = `session_${tenantSlug}`;
        localStorage.setItem(sessionKey, JSON.stringify(result.session));
        router.push(`/${tenantSlug}/dashboard`);
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await authClient.sendOtp(tenantSlug, email);
      setOtpSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.verifyOtp(tenantSlug, email, otp);

      // Store session data per tenant
      if (result.session) {
        const sessionKey = `session_${tenantSlug}`;
        localStorage.setItem(sessionKey, JSON.stringify(result.session));
        router.push(`/${tenantSlug}/dashboard`);
      }
    } catch (err: any) {
      setError(err.message || "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Tenant:{" "}
            <span className="font-medium text-blue-600">{tenantSlug}</span>
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg border border-gray-300">
          <button
            onClick={() => setActiveTab("password")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-lg ${
              activeTab === "password"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Password
          </button>
          <button
            onClick={() => setActiveTab("otp")}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-lg ${
              activeTab === "otp"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            Email OTP
          </button>
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {activeTab === "password" ? (
          <form className="mt-8 space-y-6" onSubmit={handlePasswordLogin}>
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </div>
          </form>
        ) : !otpSent ? (
          <form className="mt-8 space-y-6" onSubmit={handleSendOtp}>
            <div className="rounded-md shadow-sm">
              <label htmlFor="otp-email" className="sr-only">
                Email address
              </label>
              <input
                id="otp-email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Email address"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send 6-digit code"}
              </button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              We'll email you a 6-digit code for passwordless sign in.
            </p>
          </form>
        ) : (
          <div className="mt-8 space-y-6">
            <div className="rounded-md bg-green-50 p-4 mb-4">
              <div className="text-sm text-green-800">
                Check your email! We sent a 6-digit code to{" "}
                <strong>{email}</strong>
              </div>
            </div>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label htmlFor="otp" className="sr-only">
                  6-digit code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 text-center text-2xl tracking-widest focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  placeholder="000000"
                  autoComplete="one-time-code"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Verifying..." : "Verify code"}
                </button>
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setError("");
                  }}
                  className="text-sm text-purple-600 hover:text-purple-500"
                >
                  Use a different email
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="text-center text-sm">
          <span className="text-gray-600">Don't have an account? </span>
          <a
            href={`/${tenantSlug}/signup`}
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Sign up
          </a>
        </div>
      </div>
    </div>
  );
}
