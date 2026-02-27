export interface IEvent {
  user: {
    id: string;
    aud: string;
    role: string;
    email: string;
    email_confirmed_at?: string | null;
    phone?: string;
    confirmed_at?: string | null;
    recovery_sent_at?: string | null;
    last_sign_in_at?: string | null;
    app_metadata: {
      provider: string;
      providers: string[];
    };
    user_metadata: any;
    identities: Array<{
      identity_id: string;
      id: string;
      user_id: string;
      identity_data: {
        email: string;
        email_verified: boolean;
        phone_verified: boolean;
        sub: string;
      };
      provider: string;
      last_sign_in_at: string;
      created_at: string;
      updated_at: string;
      email?: string;
    }>;
    created_at: string;
    updated_at: string;
    is_anonymous?: boolean;
  };
  email_data?: {
    token?: string;
    token_hash?: string;
    redirect_to?: string;
    email_action_type?: "magiclink" | "signup" | "invite" | "recovery";
  };
}
