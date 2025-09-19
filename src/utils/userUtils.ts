// utils/userUtils.ts
import { User } from "@/types";

export function transformSupabaseUser(user: User | null) {
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    name: user.name || user.email?.split('@')[0] || 'User',
    image_url: user.image_url,
    role: user.role || 'user',
    is_active: user.is_active ?? true,
    created_at: user.created_at,
    updated_at: user.updated_at,
    last_login_at: user.last_login_at,
  };
}