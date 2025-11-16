export interface AuthTokens {
  accessToken: string | null;
  refreshToken: string | null;
}

export const extractTokensFromUrl = (url: string): AuthTokens => {
  let accessToken: string | null = null;
  let refreshToken: string | null = null;

  // Check for tokens in URL fragment (after #)
  if (url.includes("#")) {
    const fragmentPart = url.split("#")[1];
    const fragmentParams = new URLSearchParams(fragmentPart);
    accessToken = fragmentParams.get("access_token");
    refreshToken = fragmentParams.get("refresh_token");
  }

  // Fallback: check for tokens in query parameters (after ?)
  if (!accessToken && url.includes("?")) {
    const urlObj = new URL(url);
    accessToken = urlObj.searchParams.get("access_token");
    refreshToken = urlObj.searchParams.get("refresh_token");
  }

  return { accessToken, refreshToken };
};

export const isAuthCallbackUrl = (url: string): boolean => {
  return (
    url.includes("strengthassistant://auth-callback") ||
    (url.includes("strengthassistant://") &&
      (url.includes("access_token") || url.includes("refresh_token")))
  );
};

export interface SupabaseClient {
  auth: {
    setSession: (tokens: {
      access_token: string;
      refresh_token: string;
    }) => Promise<{ error: Error | null }>;
    getSession: () => Promise<{ data: { session: unknown } }>;
  };
}

export const processAuthTokens = async (
  supabase: SupabaseClient,
  accessToken: string,
  refreshToken: string,
): Promise<void> => {
  console.log("🔗 Found auth tokens in URL, setting session");

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    console.error("🔗 Error setting session from auth callback:", error);
  } else {
    console.log(
      "🔗 Auth callback processed successfully - user should be signed in",
    );
  }
};
