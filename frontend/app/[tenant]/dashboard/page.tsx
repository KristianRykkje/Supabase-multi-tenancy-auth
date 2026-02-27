"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const params = useParams();
  const tenantSlug = params.tenant as string;
  const [user, setUser] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [showSessionData, setShowSessionData] = useState(false);

  useEffect(() => {
    // Load user from tenant-specific session storage (in production, validate session with backend)
    const sessionKey = `session_${tenantSlug}`;
    const sessionData = localStorage.getItem(sessionKey);

    if (sessionData) {
      try {
        const parsedSession = JSON.parse(sessionData);

        // Check if token is still valid
        if (parsedSession.expires_at && parsedSession.expires_at * 1000 > Date.now()) {
          setSession(parsedSession);
          setUser(parsedSession.user);
        } else {
          // Clean up expired session and redirect to login
          localStorage.removeItem(sessionKey);
          window.location.href = `/${tenantSlug}/login`;
        }
      } catch (error) {
        console.error("Failed to parse session:", error);
        localStorage.removeItem(sessionKey);
      }
    }
  }, [tenantSlug]);

  // Decode JWT payload (simple base64 decode - for display purposes only)
  const decodeJWT = (token: string) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      console.error('Failed to decode JWT:', error);
      return null;
    }
  };

  const handleLogout = () => {
    const sessionKey = `session_${tenantSlug}`;
    localStorage.removeItem(sessionKey);
    window.location.href = `/${tenantSlug}/login`;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Not authenticated</p>
          <a
            href={`/${tenantSlug}/login`}
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center">
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome! 🎉
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Tenant</h3>
                <p className="mt-1 text-lg text-gray-900">{tenantSlug}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p className="mt-1 text-lg text-gray-900">{user.email}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500">User ID</h3>
                <p className="mt-1 text-sm text-gray-600 font-mono">
                  {user.id}
                </p>
              </div>

              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900 mb-3">
                  ✅ Multi-Tenant Auth Success!
                </h3>
                <p className="text-gray-600">
                  You're successfully authenticated to{" "}
                  <strong>{tenantSlug}</strong>. Try signing up with the same
                  email on a different tenant to test tenant isolation!
                </p>
              </div>
            </div>
          </div>

          {/* Session JWT Data */}
          <div className="mt-6 bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                🔑 Session JWT Data
              </h3>
              <button
                onClick={() => setShowSessionData(!showSessionData)}
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                {showSessionData ? "Hide" : "Show"} Details
              </button>
            </div>

            {showSessionData && session && (
              <div className="space-y-4">
                {/* Desktop: Side by side */}
                <div className="hidden md:grid md:grid-cols-2 md:gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">
                      Raw Access Token (JWT)
                    </h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto border border-gray-200 max-h-96 overflow-y-auto">
                      {session.access_token}
                    </pre>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">
                      Decoded JWT Payload
                    </h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto border border-gray-200 max-h-96 overflow-y-auto">
                      {JSON.stringify(decodeJWT(session.access_token), null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Mobile: Stacked */}
                <div className="md:hidden space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">
                      Raw Access Token (JWT)
                    </h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto border border-gray-200 max-h-64 overflow-y-auto">
                      {session.access_token}
                    </pre>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-2">
                      Decoded JWT Payload
                    </h4>
                    <pre className="bg-gray-50 p-3 rounded text-xs overflow-x-auto border border-gray-200 max-h-64 overflow-y-auto">
                      {JSON.stringify(decodeJWT(session.access_token), null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-500 mb-2">
                    Session Metadata
                  </h4>
                  <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                    <p>
                      <span className="font-medium">Token Type:</span>{" "}
                      {session.token_type}
                    </p>
                    <p>
                      <span className="font-medium">Expires In:</span>{" "}
                      {session.expires_in} seconds
                    </p>
                    {session.expires_at && (
                      <p>
                        <span className="font-medium">Expires At:</span>{" "}
                        {new Date(session.expires_at * 1000).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              🏢 Multi-Tenant Sessions
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              Each tenant has its own independent session. You can be logged into multiple tenants simultaneously!
            </p>
            <div className="space-y-2">
              {["tenant-a", "tenant-b"].map((tenant) => {
                const sessionKey = `session_${tenant}`;
                const hasSession = localStorage.getItem(sessionKey);
                const isCurrentTenant = tenant === tenantSlug;

                return (
                  <div
                    key={tenant}
                    className={`flex items-center justify-between p-3 rounded ${
                      isCurrentTenant
                        ? "bg-blue-100 border border-blue-300"
                        : "bg-white border border-blue-200"
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="font-medium text-blue-900">
                        {tenant}
                      </span>
                      {isCurrentTenant && (
                        <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                          Current
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {hasSession ? (
                        <>
                          <span className="text-xs text-green-600 font-medium">
                            ✓ Active
                          </span>
                          {!isCurrentTenant && (
                            <a
                              href={`/${tenant}/dashboard`}
                              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Switch →
                            </a>
                          )}
                        </>
                      ) : (
                        <a
                          href={`/${tenant}/login`}
                          className="text-xs text-gray-600 hover:text-gray-700"
                        >
                          Not logged in
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
