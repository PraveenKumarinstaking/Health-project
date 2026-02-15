
/**
 * DEPRECATED: Supabase is no longer used for primary data or auth.
 * All persistence is now handled by dbService.ts locally.
 */
export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signOut: async () => {},
  }
} as any;
