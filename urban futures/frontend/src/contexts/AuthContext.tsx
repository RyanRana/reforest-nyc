import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, UserProfile } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  isGuest: boolean;
  loading: boolean;
  signUp: (email: string, password: string, userType: 'regular' | 'corporate', companyLogo?: File) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userType: 'regular' | 'corporate',
    companyLogo?: File
  ): Promise<{ error: any }> => {
    try {
      // Validate corporate email
      if (userType === 'corporate') {
        const emailDomain = email.split('@')[1].toLowerCase();
        const blockedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'aol.com', 'icloud.com'];
        
        if (blockedDomains.includes(emailDomain)) {
          return { error: { message: 'Corporate accounts must use a company email address' } };
        }

        // Check if company already exists
        const { data: existingCompany } = await supabase
          .from('user_profiles')
          .select('company_domain')
          .eq('company_domain', emailDomain)
          .limit(1);

        if (existingCompany && existingCompany.length > 0) {
          return { error: { message: 'A corporate ambassador from this company already exists' } };
        }
      }

      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            user_type: userType,
          }
        }
      });

      if (authError) {
        console.error('Supabase signup error:', authError);
        // Provide helpful message for common errors
        if (authError.message?.includes('Email signups are disabled')) {
          return { 
            error: { 
              message: 'Email signups are disabled. Please enable email authentication in your Supabase dashboard: Authentication → Providers → Email. See ENABLE_EMAIL_AUTH.md for instructions.' 
            } 
          };
        }
        return { error: authError };
      }
      
      if (!authData.user) {
        console.error('No user returned from signup');
        return { error: { message: 'Failed to create user' } };
      }

      // Upload company logo if provided
      let logoUrl: string | undefined;
      if (companyLogo && userType === 'corporate') {
        const fileExt = companyLogo.name.split('.').pop();
        const fileName = `${authData.user.id}-logo.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('company-logos')
          .upload(fileName, companyLogo, { upsert: true });

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('company-logos')
            .getPublicUrl(fileName);
          logoUrl = publicUrl;
        }
      }

      // Create user profile
      const emailDomain = userType === 'corporate' ? email.split('@')[1].toLowerCase() : null;
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          email: email,
          user_type: userType,
          company_domain: emailDomain,
          company_logo_url: logoUrl,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // If profile creation fails, try to delete the auth user to clean up
        // (This is optional - you might want to keep the auth user)
        if (profileError.code === '42P01') {
          return { error: { message: 'Database tables not set up. Please run the Supabase migration first. See SUPABASE_QUICK_START.md' } };
        }
        return { error: profileError };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Signup error:', error);
      return { error: error?.message ? { message: error.message } : { message: 'An unexpected error occurred during signup' } };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: any }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signOut = async () => {
    setIsGuest(false);
    await supabase.auth.signOut();
  };

  const continueAsGuest = () => {
    setIsGuest(true);
    setLoading(false);
  };

  const updateProfile = async (updates: Partial<UserProfile>): Promise<{ error: any }> => {
    if (!user) return { error: { message: 'No user logged in' } };

    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id);

    if (!error && profile) {
      setProfile({ ...profile, ...updates });
    }

    return { error };
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      isGuest,
      loading,
      signUp,
      signIn,
      signOut,
      continueAsGuest,
      updateProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
