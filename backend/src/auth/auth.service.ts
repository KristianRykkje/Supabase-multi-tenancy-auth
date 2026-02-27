import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "crypto";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { PrismaService } from "../prisma/prisma.service";

/**
 * SECURITY-FIRST AUTH SERVICE
 * ===========================
 * Critical principle: The frontend is UNTRUSTED.
 * All security-sensitive operations happen here on the backend.
 */

@Injectable()
export class AuthService {
  private supabaseAdmin: SupabaseClient;

  constructor(
    private prisma: PrismaService,
    private cfg: ConfigService,
  ) {
    // Supabase admin client (server-side only)
    this.supabaseAdmin = createClient(
      this.cfg.getOrThrow<string>("SUPABASE_URL"),
      this.cfg.getOrThrow<string>("SUPABASE_SECRET_KEY"),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  }

  /**
   * CRITICAL SECURITY FUNCTION
   * Internal email generation happens ONLY on backend
   * Never trust frontend-provided hashes or internal emails
   */
  private generateInternalEmail(realEmail: string, tenantId: string): string {
    const combined = `${realEmail.toLowerCase().trim()}:${tenantId}`;
    const hash = createHash("sha256").update(combined).digest("hex");
    return `${hash}@customers.internal`;
  }

  /**
   * SIGN UP
   * Backend validates tenant and creates user with server-generated internal email
   */
  async signUp(tenantSlug: string, realEmail: string, password: string) {
    // 1. Validate tenant exists (prevents spoofing)
    const tenant = await this.prisma.tenants.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new BadRequestException("Invalid tenant");
    }

    const emailLower = realEmail.toLowerCase().trim();

    // 2. Check if email already exists for this tenant
    const existing = await this.prisma.customer_auth_mappings.findUnique({
      where: {
        tenant_id_real_email: {
          tenant_id: tenant.id,
          real_email: emailLower,
        },
      },
    });

    if (existing) {
      // SECURITY: Email enumeration protection
      // Don't reveal user already exists - but try to auto-login with provided password
      const { data: signInData, error: signInError } =
        await this.supabaseAdmin.auth.signInWithPassword({
          email: existing.internal_email,
          password,
        });

      if (signInError || !signInData.session) {
        // If password is wrong, still return success to prevent enumeration
        return {
          success: true,
          message: "Account created successfully",
        };
      }

      // Return session for auto-login if password matches
      return {
        success: true,
        message: "Account created successfully",
        session: signInData.session,
        user: {
          id: signInData.user.id,
          email: emailLower,
          tenant_slug: tenantSlug,
          email_verified: existing.email_verified,
        },
      };
    }

    // 3. Generate internal email SERVER-SIDE
    const internalEmail = this.generateInternalEmail(emailLower, tenant.id);

    // 4. Create Supabase user using admin API
    const { data: authData, error: authError } =
      await this.supabaseAdmin.auth.admin.createUser({
        email: internalEmail,
        password,
        email_confirm: true, // No email verification required
        user_metadata: {
          real_email: emailLower,
          tenant_id: tenant.id,
          tenant_slug: tenantSlug,
        },
      });

    if (authError || !authData.user) {
      // Log error server-side but don't expose details
      console.error("Supabase signup error:", authError);
      throw new BadRequestException("Unable to create account");
    }

    // 5. Create user record in our database
    let user = await this.prisma.users.findUnique({
      where: { supabase_user_id: authData.user.id },
    });

    if (!user) {
      user = await this.prisma.users.create({
        data: {
          supabase_user_id: authData.user.id,
        },
      });
    }

    // 6. Create auth mapping in database (no email verification required)
    await this.prisma.customer_auth_mappings.create({
      data: {
        tenant_id: tenant.id,
        user_id: user.id,
        real_email: emailLower,
        internal_email: internalEmail,
        email_verified: true, // No email verification required
      },
    });

    // 7. Auto-login for demo: Sign in the user and return session
    const { data: signInData, error: signInError } =
      await this.supabaseAdmin.auth.signInWithPassword({
        email: internalEmail,
        password,
      });

    if (signInError || !signInData.session) {
      // Still return success even if auto-login fails
      return {
        success: true,
        message: "Account created successfully! Check your email for a welcome message.",
      };
    }

    // Return session for immediate login (demo-friendly)
    return {
      success: true,
      message: "Account created successfully! Check your email for a welcome message.",
      session: signInData.session,
      user: {
        id: authData.user.id,
        email: emailLower,
        tenant_slug: tenantSlug,
        email_verified: true, // No verification required
      },
    };
  }

  /**
   * LOGIN
   * Backend validates tenant and uses internal email for Supabase auth
   */
  async login(tenantSlug: string, realEmail: string, password: string) {
    // 1. Validate tenant exists
    const tenant = await this.prisma.tenants.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      // SECURITY: Don't reveal tenant doesn't exist
      throw new UnauthorizedException("Invalid credentials");
    }

    const emailLower = realEmail.toLowerCase().trim();

    // 2. Get auth mapping (validates email belongs to THIS tenant)
    const mapping = await this.prisma.customer_auth_mappings.findUnique({
      where: {
        tenant_id_real_email: {
          tenant_id: tenant.id,
          real_email: emailLower,
        },
      },
      include: {
        user: true,
      },
    });

    if (!mapping) {
      // SECURITY: Same error message for non-existent email or wrong tenant
      throw new UnauthorizedException("Invalid credentials");
    }

    // 3. Authenticate with Supabase using internal email
    const { data: authData, error: authError } =
      await this.supabaseAdmin.auth.signInWithPassword({
        email: mapping.internal_email,
        password,
      });

    if (authError || !authData.session) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // 4. Update last login timestamp
    await this.prisma.customer_auth_mappings.update({
      where: { id: mapping.id },
      data: { last_login_at: new Date() },
    });

    // 5. Return session and sanitized user data
    return {
      success: true,
      session: authData.session,
      user: {
        id: authData.user.id,
        email: emailLower, // Return REAL email to frontend
        tenant_slug: tenantSlug,
        email_verified: mapping.email_verified,
      },
    };
  }

  /**
   * REQUEST OTP (ONE-TIME PASSWORD)
   * Backend generates OTP for passwordless auth
   */
  async requestOtp(tenantSlug: string, realEmail: string) {
    // 1. Validate tenant
    const tenant = await this.prisma.tenants.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      return {
        success: true,
        message: "If an account exists, an OTP has been sent",
      };
    }

    const emailLower = realEmail.toLowerCase().trim();

    // 2. Check if user exists (OTP requires existing account)
    const mapping = await this.prisma.customer_auth_mappings.findUnique({
      where: {
        tenant_id_real_email: {
          tenant_id: tenant.id,
          real_email: emailLower,
        },
      },
    });

    if (!mapping) {
      // SECURITY: Don't reveal user doesn't exist
      return {
        success: true,
        message: "If an account exists, an OTP has been sent",
      };
    }

    // 3. Send OTP using internal email
    const { error } = await this.supabaseAdmin.auth.signInWithOtp({
      email: mapping.internal_email,
      options: {
        emailRedirectTo: `${this.cfg.getOrThrow<string>("FRONTEND_URL")}/${tenantSlug}/dashboard`,
      },
    });

    if (error) {
      console.error("OTP error:", error);
    }

    return {
      success: true,
      message: "If an account exists, an OTP has been sent",
    };
  }

  /**
   * VERIFY OTP
   * Verifies the OTP token and returns session
   */
  async verifyOtp(tenantSlug: string, realEmail: string, token: string) {
    // 1. Validate tenant
    const tenant = await this.prisma.tenants.findUnique({
      where: { slug: tenantSlug },
    });

    if (!tenant) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const emailLower = realEmail.toLowerCase().trim();

    // 2. Get auth mapping
    const mapping = await this.prisma.customer_auth_mappings.findUnique({
      where: {
        tenant_id_real_email: {
          tenant_id: tenant.id,
          real_email: emailLower,
        },
      },
      include: {
        user: true,
      },
    });

    if (!mapping) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // 3. Verify OTP with Supabase using internal email
    const { data: authData, error: authError } =
      await this.supabaseAdmin.auth.verifyOtp({
        email: mapping.internal_email,
        token,
        type: "email",
      });

    if (authError || !authData.session) {
      throw new UnauthorizedException("Invalid or expired OTP code");
    }

    // 4. Update last login timestamp
    await this.prisma.customer_auth_mappings.update({
      where: { id: mapping.id },
      data: { last_login_at: new Date() },
    });

    // 5. Return session and sanitized user data
    return {
      success: true,
      session: authData.session,
      user: {
        id: authData.user.id,
        email: emailLower,
        tenant_slug: tenantSlug,
        email_verified: mapping.email_verified,
      },
    };
  }
}
