import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://cypxvoflvseljxevetqz.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN5cHh2b2ZsdnNlbGp4ZXZldHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1MTU2MzEsImV4cCI6MjA4NDA5MTYzMX0.9Clu6E57mJmDylI9_XaU04dllOPD8_1ML6H3_NvaO4k';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface UserProfile {
  id: string;
  email: string;
  user_type: 'regular' | 'corporate' | 'guest';
  company_domain?: string;
  company_logo_url?: string;
  zipcode?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  zipcode: string;
  h3_cell?: string;
  rating: number;
  message: string;
  lives_here: boolean;
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
}

export interface GreenInitiative {
  id: string;
  user_id: string;
  zipcode: string;
  h3_cell?: string;
  image_url: string;
  caption?: string;
  initiative_type: 'plant_flower' | 'hang_vines' | 'plant_tree' | 'general';
  created_at: string;
  updated_at: string;
  user_profile?: UserProfile;
}
