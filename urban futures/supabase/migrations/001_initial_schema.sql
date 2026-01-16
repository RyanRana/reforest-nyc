-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('regular', 'corporate', 'guest')),
  company_domain TEXT, -- For corporate users (e.g., 'microsoft.com')
  company_logo_url TEXT, -- For corporate users
  zipcode TEXT, -- Where user lives (can only be one)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  zipcode TEXT NOT NULL,
  h3_cell TEXT, -- Optional H3 cell reference
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  lives_here BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, zipcode) -- One review per user per zipcode
);

-- Green initiatives table (images with captions)
CREATE TABLE public.green_initiatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  zipcode TEXT NOT NULL,
  h3_cell TEXT, -- Optional H3 cell reference
  image_url TEXT NOT NULL,
  caption TEXT,
  initiative_type TEXT NOT NULL CHECK (initiative_type IN ('plant_flower', 'hang_vines', 'plant_tree', 'general')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_reviews_zipcode ON public.reviews(zipcode);
CREATE INDEX idx_reviews_h3_cell ON public.reviews(h3_cell);
CREATE INDEX idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX idx_green_initiatives_zipcode ON public.green_initiatives(zipcode);
CREATE INDEX idx_green_initiatives_h3_cell ON public.green_initiatives(h3_cell);
CREATE INDEX idx_green_initiatives_user_id ON public.green_initiatives(user_id);
CREATE INDEX idx_user_profiles_company_domain ON public.user_profiles(company_domain);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.green_initiatives ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
-- Anyone can read user profiles (for displaying company logos, etc.)
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.user_profiles FOR SELECT
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for reviews
-- Anyone can read reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

-- Authenticated users can insert reviews
CREATE POLICY "Authenticated users can insert reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update their own reviews"
  ON public.reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own reviews
CREATE POLICY "Users can delete their own reviews"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for green_initiatives
-- Anyone can read green initiatives
CREATE POLICY "Green initiatives are viewable by everyone"
  ON public.green_initiatives FOR SELECT
  USING (true);

-- Authenticated users can insert green initiatives
CREATE POLICY "Authenticated users can insert green initiatives"
  ON public.green_initiatives FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own green initiatives
CREATE POLICY "Users can update their own green initiatives"
  ON public.green_initiatives FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own green initiatives
CREATE POLICY "Users can delete their own green initiatives"
  ON public.green_initiatives FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_green_initiatives_updated_at
  BEFORE UPDATE ON public.green_initiatives
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
