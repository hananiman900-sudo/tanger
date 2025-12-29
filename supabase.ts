
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://thszcwawojpblocppcmu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoc3pjd2F3b2pwYmxvY3BwY211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMzE0OTMsImV4cCI6MjA4MTgwNzQ5M30.VUz2A976Qtn__bzqwPBlSuxcMAbQ6w6kFqY2AZAOFDE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SQL_SNIPPETS = [
  {
    id: 'TOTAL_REPAIR_V2',
    title: '🚀 الإصلاح الشامل والنهائي لقاعدة البيانات',
    description: 'شغل هذا الكود لإصلاح كافة المشاكل (الاسم، الهاتف، الصورة، الروابط، الحساب البنكي) وضمان حفظ البيانات.',
    code: `
-- 1. التأكد من وجود كافة الأعمدة المطلوبة في جدول profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS profile_image TEXT,
ADD COLUMN IF NOT EXISTS bank_account TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{"facebook": "", "instagram": "", "linkedin": "", "whatsapp": ""}',
ADD COLUMN IF NOT EXISTS active_hours TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS gps_location TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS referral_code TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING',
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'PROFESSIONAL';

-- 2. تصحيح وظيفة إنشاء الملف الشخصي التلقائي
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, status, referral_code)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE(new.raw_user_meta_data->>'phone', ''),
    'PROFESSIONAL',
    'PENDING',
    'TGR' || floor(random() * 1000000)::text
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. تفعيل الـ Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. إصلاح سياسات الحماية (RLS) لضمان قدرة المستخدم على التحديث
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles 
FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- 5. تحديث الـ Schema
NOTIFY pgrst, 'reload schema';
    `
  }
];
