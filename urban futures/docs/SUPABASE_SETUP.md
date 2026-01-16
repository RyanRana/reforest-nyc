# Supabase Setup Instructions

## 1. Run the Database Migration

Go to your Supabase project dashboard:
https://supabase.com/dashboard/project/cypxvoflvseljxevetqz

Navigate to **SQL Editor** and run the migration file:
`supabase/migrations/001_initial_schema.sql`

This will create:
- `user_profiles` table
- `reviews` table
- `green_initiatives` table
- All necessary indexes
- Row Level Security (RLS) policies

## 2. Create Storage Buckets

Go to **Storage** in your Supabase dashboard and create two public buckets:

### Bucket 1: `company-logos`
- **Name**: `company-logos`
- **Public**: Yes
- **File size limit**: 2MB
- **Allowed MIME types**: `image/*`

### Bucket 2: `green-initiative-images`
- **Name**: `green-initiative-images`
- **Public**: Yes
- **File size limit**: 5MB
- **Allowed MIME types**: `image/*`

## 3. Set Storage Policies

For each bucket, add these policies:

### company-logos policies:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'company-logos');

-- Allow public read access
CREATE POLICY "Public can view logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'company-logos');

-- Allow users to update their own logos
CREATE POLICY "Users can update own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'company-logos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### green-initiative-images policies:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'green-initiative-images');

-- Allow public read access
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'green-initiative-images');

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'green-initiative-images' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 4. Enable Email Authentication

Go to **Authentication** → **Providers** and ensure:
- Email provider is enabled
- Email confirmations are configured (or disabled for testing)

## 5. Test the Setup

1. Start the frontend: `npm start`
2. Navigate to the map
3. You should see the auth modal
4. Try signing up as a regular user or corporate ambassador
5. Test leaving reviews and uploading green initiative images

## Troubleshooting

- If you get RLS errors, ensure all policies are created correctly
- If storage uploads fail, check bucket permissions and policies
- Check browser console for detailed error messages
