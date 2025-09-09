// For Pages Router: /pages/auth/callback.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabaseClient';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth error:', error);
        router.push('/login?error=' + encodeURIComponent(error.message));
        return;
      }

      if (data.session?.user) {
        // Check if user exists in users table, if not create them
        const { data: userData, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', data.session.user.id)
          .single();

        if (fetchError && fetchError.code === 'PGRST116') {
          // User doesn't exist, create them
          await supabase
            .from('users')
            .insert({
              user_id: data.session.user.id,
              name: data.session.user.user_metadata?.full_name || 
                    data.session.user.user_metadata?.name || 
                    data.session.user.email?.split('@')[0] || 'User',
              email: data.session.user.email,
              phone: data.session.user.user_metadata?.phone || null,
              role: 'attendee',
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        }

        router.push('/dashboard'); // Redirect to your main app
      } else {
        router.push('/login');
      }
    };

    handleAuthCallback();
  }, [router]);

  return <div>Loading...</div>;
}