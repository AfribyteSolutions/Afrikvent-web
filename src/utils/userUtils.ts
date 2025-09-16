// src/utils/userUtils.ts
import { User as SupabaseUser } from '@supabase/auth-helpers-react';
import { User as TicketUser } from '@/types/ticket';

export const transformSupabaseUser = (supabaseUser: SupabaseUser | null): TicketUser | undefined => {
  if (!supabaseUser || !supabaseUser.email) return undefined;
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email, // Now guaranteed to be string
    // Extract name from user_metadata or use email as fallback
    name: supabaseUser.user_metadata?.name || 
          supabaseUser.user_metadata?.full_name || 
          supabaseUser.user_metadata?.display_name ||
          supabaseUser.email.split('@')[0] || 
          'User',
    // Removed user_metadata and app_metadata since they're not in your User type
  };
};