-- ============================================================
-- Whiskora: Database Security & Storage Setup
-- วิธีใช้: Copy ทั้งหมดแล้ว Paste ใน Supabase Dashboard → SQL Editor → Run
-- ============================================================


-- ============================================================
-- SECTION 1: ROW LEVEL SECURITY (RLS) — ทุกตาราง
-- ============================================================

-- ---- profiles ----
-- ปัญหา: ตอนนี้ anon key อ่าน email ทุก user ได้ → ต้องปิด
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);


-- ---- pets ----
ALTER TABLE pets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own pets" ON pets;
DROP POLICY IF EXISTS "Public can view available pets" ON pets;

-- เจ้าของทำได้ทุกอย่างกับสัตว์ตัวเอง
CREATE POLICY "Users can manage own pets"
  ON pets FOR ALL
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- สาธารณชนเห็นได้เฉพาะสัตว์ที่ "พร้อมย้ายบ้าน" (สำหรับหน้า marketplace)
CREATE POLICY "Public can view available pets"
  ON pets FOR SELECT
  USING (status = 'พร้อมย้ายบ้าน');


-- ---- vaccines ----
ALTER TABLE vaccines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own vaccines" ON vaccines;

-- เข้าถึงได้เฉพาะเจ้าของสัตว์ตัวนั้น
CREATE POLICY "Users can manage own vaccines"
  ON vaccines FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id::text = vaccines.pet_id::text
        AND pets.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pets
      WHERE pets.id::text = vaccines.pet_id::text
        AND pets.user_id::text = auth.uid()::text
    )
  );


-- ---- farms ----
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own farms" ON farms;
DROP POLICY IF EXISTS "Public can view farms" ON farms;

CREATE POLICY "Users can manage own farms"
  ON farms FOR ALL
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- ฟาร์มเปิดสาธารณะ (marketplace แสดงชื่อฟาร์มในการ์ดสัตว์)
CREATE POLICY "Public can view farms"
  ON farms FOR SELECT
  USING (true);


-- ---- litters ----
ALTER TABLE litters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farm owners can manage litters" ON litters;

CREATE POLICY "Farm owners can manage litters"
  ON litters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id::text = litters.farm_id::text
        AND farms.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id::text = litters.farm_id::text
        AND farms.user_id::text = auth.uid()::text
    )
  );


-- ---- farm_transactions ----
ALTER TABLE farm_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farm owners can manage transactions" ON farm_transactions;

CREATE POLICY "Farm owners can manage transactions"
  ON farm_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id::text = farm_transactions.farm_id::text
        AND farms.user_id::text = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM farms
      WHERE farms.id::text = farm_transactions.farm_id::text
        AND farms.user_id::text = auth.uid()::text
    )
  );


-- ---- shops ----
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own shops" ON shops;
DROP POLICY IF EXISTS "Public can view shops" ON shops;

CREATE POLICY "Users can manage own shops"
  ON shops FOR ALL
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Public can view shops"
  ON shops FOR SELECT
  USING (true);


-- ---- services ----
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own services" ON services;
DROP POLICY IF EXISTS "Public can view services" ON services;

CREATE POLICY "Users can manage own services"
  ON services FOR ALL
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Public can view services"
  ON services FOR SELECT
  USING (true);


-- ============================================================
-- SECTION 2: AUTO-CREATE PROFILE ON SIGNUP
-- เมื่อ user ลงทะเบียนใหม่ จะสร้าง profile ให้อัตโนมัติ
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- SECTION 3: STORAGE BUCKETS
-- สร้าง bucket สำหรับ upload รูปสัตว์เลี้ยงและ avatar
-- ============================================================

-- สร้าง bucket (public = ทุกคนดูรูปได้ แต่ upload ต้อง login)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('pet-photos', 'pet-photos', true, 5242880, ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('avatars',    'avatars',    true, 2097152, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;


-- ---- Storage RLS: pet-photos ----
DROP POLICY IF EXISTS "Public read pet-photos" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload pet-photos" ON storage.objects;
DROP POLICY IF EXISTS "Owner update pet-photos" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete pet-photos" ON storage.objects;

CREATE POLICY "Public read pet-photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-photos');

CREATE POLICY "Auth upload pet-photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pet-photos'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owner update pet-photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'pet-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owner delete pet-photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pet-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ---- Storage RLS: avatars ----
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Auth upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Owner update avatars" ON storage.objects;
DROP POLICY IF EXISTS "Owner delete avatars" ON storage.objects;

CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Auth upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owner update avatars"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Owner delete avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ============================================================
-- SECTION 4: MISSING COLUMNS (เพิ่มถ้ายังไม่มี)
-- ============================================================

-- pets: price (สำหรับหน้า marketplace)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS price numeric(10,2) DEFAULT NULL;

-- pets: created_at (สำหรับ sort ใน marketplace)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- farm_transactions: description
ALTER TABLE farm_transactions ADD COLUMN IF NOT EXISTS description text DEFAULT NULL;

-- farm_transactions: created_at
ALTER TABLE farm_transactions ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- litters: actual_birth_date (บันทึกวันคลอดจริง)
ALTER TABLE litters ADD COLUMN IF NOT EXISTS actual_birth_date date DEFAULT NULL;

-- litters: puppy_count (จำนวนลูกที่คลอด)
ALTER TABLE litters ADD COLUMN IF NOT EXISTS puppy_count int DEFAULT NULL;

-- litters: notes
ALTER TABLE litters ADD COLUMN IF NOT EXISTS notes text DEFAULT NULL;
