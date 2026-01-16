import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AppRole = 'admin_principal' | 'admin' | 'colaborador' | 'visualizacao';
export type ModuloPermitido = 'apropriacao' | 'pedreira' | 'pipas' | 'cal';

interface Profile {
  id: string;
  nome: string;
  sobrenome: string;
  email: string;
  telefone: string | null;
  whatsapp: string | null;
  foto_url: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  role: AppRole | null;
  modulosPermitidos: ModuloPermitido[];
  isApproved: boolean;
  isAdmin: boolean;
  isAdminPrincipal: boolean;
  loading: boolean;
  pendingApproval: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, nome: string, sobrenome: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  hasModuleAccess: (modulo: ModuloPermitido) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [modulosPermitidos, setModulosPermitidos] = useState<ModuloPermitido[]>([]);
  const [isApproved, setIsApproved] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileData) {
        setProfile(profileData as Profile);
      }

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role, approved, modulos_permitidos')
        .eq('user_id', userId)
        .single();

      if (roleData) {
        setRole(roleData.role as AppRole);
        setIsApproved(roleData.approved);
        // Se for admin, tem acesso a todos os módulos
        if (roleData.role === 'admin_principal' || roleData.role === 'admin') {
          setModulosPermitidos(['apropriacao', 'pedreira', 'pipas', 'cal']);
        } else {
          // Usar modulos_permitidos do banco ou padrão todos
          const modulos = (roleData as unknown as { modulos_permitidos?: string[] }).modulos_permitidos;
          setModulosPermitidos((modulos as ModuloPermitido[]) || ['apropriacao', 'pedreira', 'pipas', 'cal']);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Defer profile fetch to avoid deadlocks
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setRole(null);
          setModulosPermitidos([]);
          setIsApproved(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, nome: string, sobrenome: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          nome,
          sobrenome,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRole(null);
    setModulosPermitidos([]);
    setIsApproved(false);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const isAdmin = role === 'admin_principal' || role === 'admin';
  const isAdminPrincipal = role === 'admin_principal';
  const pendingApproval = !!user && !isApproved;

  // Função para verificar acesso a módulo
  const hasModuleAccess = (modulo: ModuloPermitido): boolean => {
    if (isAdmin) return true;
    return modulosPermitidos.includes(modulo);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        modulosPermitidos,
        isApproved,
        isAdmin,
        isAdminPrincipal,
        loading,
        pendingApproval,
        signIn,
        signUp,
        signOut,
        refreshProfile,
        hasModuleAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
