import { useSupabase } from '@/components/providers/supabase-provider'

export function useAuth() {
  const { user, loading, signOut } = useSupabase()
  
  return {
    user,
    loading,
    isAuthenticated: !!user,
    signOut,
  }
}

export function useRequireAuth() {
  const { user, loading } = useSupabase()
  
  if (loading) {
    return { loading: true, authenticated: false }
  }
  
  return {
    loading: false,
    authenticated: !!user,
    user,
  }
}