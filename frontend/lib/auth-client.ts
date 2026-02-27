/**
 * SECURE AUTH CLIENT
 * ==================
 * IMPORTANT: NO internal email generation on the frontend!
 * All auth operations go through the backend API for security.
 *
 * The frontend is UNTRUSTED - we never generate internal emails client-side.
 */

export class AuthClient {
  private apiUrl: string;

  constructor() {
    this.apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  /**
   * Sign up
   * Backend validates tenant and generates internal email
   */
  async signUp(tenantSlug: string, email: string, password: string) {
    const response = await fetch(`${this.apiUrl}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_slug: tenantSlug,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Signup failed');
    }

    return data;
  }

  /**
   * Login with password
   * Backend validates tenant and handles internal email mapping
   */
  async login(tenantSlug: string, email: string, password: string) {
    const response = await fetch(`${this.apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important for session cookies
      body: JSON.stringify({
        tenant_slug: tenantSlug,
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login failed');
    }

    return data;
  }

  /**
   * Request OTP (one-time password)
   * Backend validates tenant and sends OTP email
   */
  async sendOtp(tenantSlug: string, email: string) {
    const response = await fetch(`${this.apiUrl}/auth/otp/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenant_slug: tenantSlug,
        email,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Request failed');
    }

    return data;
  }

  /**
   * Verify OTP code
   * Backend validates the OTP token and returns session
   */
  async verifyOtp(tenantSlug: string, email: string, token: string) {
    const response = await fetch(`${this.apiUrl}/auth/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important for session cookies
      body: JSON.stringify({
        tenant_slug: tenantSlug,
        email,
        token,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Invalid or expired OTP code');
    }

    return data;
  }
}

// Export singleton instance
export const authClient = new AuthClient();
