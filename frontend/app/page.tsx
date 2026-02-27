export default function HomePage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block bg-purple-100 text-purple-800 text-sm font-semibold px-4 py-1 rounded-full mb-4">
            Interactive Demo
          </div>
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
            Multi-Tenant Auth with Supabase
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Enable true multi-tenant authentication for your B2B SaaS
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🎯 The SaaS Use Case
          </h2>
          <p className="text-gray-700 mb-4">
            You're building a B2B SaaS platform. Your customers (Client A, Client B) each have their own end-users who need to log in.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>The problem:</strong> Supabase Auth is single-tenant by default. If <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">john@example.com</code> signs up on Client A, they can't sign up with the same email on Client B.
          </p>
          <p className="text-gray-700">
            <strong>This demo shows the solution:</strong> Complete tenant isolation where the same email can have independent accounts across different tenants (your clients).
          </p>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Example:</strong> Customer John logs into Client A's portal with <code className="bg-blue-100 px-1 py-0.5 rounded">john@example.com</code>.
              The same John can also log into Client B's portal with <code className="bg-blue-100 px-1 py-0.5 rounded">john@example.com</code> using a completely different password.
              These accounts are fully isolated — Client A never sees Client B's data.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            ✨ What This Demo Does
          </h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2 text-xl">→</span>
              <span>
                <strong>Same email, multiple tenants:</strong> Sign up with test@example.com on both Tenant A and Tenant B
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2 text-xl">→</span>
              <span>
                <strong>Different passwords per tenant:</strong> Each tenant gets its own independent credentials
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2 text-xl">→</span>
              <span>
                <strong>Two login methods:</strong> Email+Password or OTP (6-digit code via email)
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2 text-xl">→</span>
              <span>
                <strong>Complete isolation:</strong> Accounts are fully separated - logging into Tenant A doesn't affect Tenant B
              </span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🚀 Try It Yourself
          </h2>
          <p className="text-gray-600 mb-6">
            In this demo, you're a customer named John who needs accounts on two different SaaS clients.
            Sign up with the <strong>same email address</strong> on both tenants to see complete isolation in action:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/tenant-a/signup"
              className="block p-6 border-2 border-blue-300 rounded-lg hover:border-blue-500 hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                🏢 Client A (Tenant A)
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Sign up to Client A's customer portal
              </p>
              <div className="mt-4 text-blue-600 font-medium">Sign up →</div>
            </a>

            <a
              href="/tenant-b/signup"
              className="block p-6 border-2 border-purple-300 rounded-lg hover:border-purple-500 hover:shadow-lg transition"
            >
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                🏢 Client B (Tenant B)
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Sign up to Client B's portal with the same email (different password)
              </p>
              <div className="mt-4 text-purple-600 font-medium">Sign up →</div>
            </a>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>💡 Test it:</strong> Use <code className="bg-blue-100 px-1 py-0.5 rounded">john@example.com</code> on both clients with different passwords.
              You'll have two completely isolated accounts — logging into Client A has nothing to do with Client B!
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            🔧 How It Works
          </h2>
          <div className="space-y-4 text-gray-700">
            <div className="flex items-start">
              <span className="text-2xl mr-3">1️⃣</span>
              <div>
                <strong>Internal email mapping:</strong> When you sign up with <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">user@example.com</code> on Tenant A,
                the backend generates a unique internal email like <code className="bg-gray-100 px-1 py-0.5 rounded text-sm">abc123...@customers.internal</code>
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">2️⃣</span>
              <div>
                <strong>Supabase creates the account:</strong> The internal email is used with Supabase Auth,
                so Supabase sees different emails for each tenant
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">3️⃣</span>
              <div>
                <strong>Database stores the mapping:</strong> A PostgreSQL table maps real emails to internal emails per tenant,
                enabling true multi-tenancy
              </div>
            </div>
            <div className="flex items-start">
              <span className="text-2xl mr-3">4️⃣</span>
              <div>
                <strong>Email webhooks intercept messages:</strong> When Supabase sends emails, webhooks intercept them and
                forward to your real email address via Resend
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg shadow-xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">📖 Get the Code</h2>
          <p className="text-gray-300 mb-4">
            This is a complete, production-ready starter template.
            Clone it, configure your Supabase project, and deploy your own multi-tenant auth system.
          </p>
          <a
            href="https://github.com/KristianRykkje/Supabase-multi-tenancy-auth"
            className="inline-block bg-white text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </div>
  );
}
