
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://thszcwawojpblocppcmu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoc3pjd2F3b2pwYmxvY3BwY211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMzE0OTMsImV4cCI6MjA4MTgwNzQ5M30.VUz2A976Qtn__bzqwPBlSuxcMAbQ6w6kFqY2AZAOFDE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SQL_SNIPPETS = [
  {
    id: 'FIX_DATABASE_SCHEMA',
    title: '🛠️ إصلاح أعمدة قاعدة البيانات (Fix Schema)',
    description: 'تشغيل هذا الكود سيضيف عمود "رقم المكتب" وأي أعمدة أخرى ناقصة تسبب أخطاء التسجيل.',
    code: `
-- إضافة الأعمدة الناقصة لجدول البروفايلات لتفادي أخطاء التسجيل
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS office_number TEXT,
ADD COLUMN IF NOT EXISTS building_id UUID,
ADD COLUMN IF NOT EXISTS floor TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS category_id UUID,
ADD COLUMN IF NOT EXISTS sub_specialty_id UUID;

-- تحديث الـ Cache لـ PostgREST (يتم آلياً في العادة لكن هذا للتأكيد)
NOTIFY pgrst, 'reload schema';
    `
  },
  {
    id: 'RECOVER_OWNER_ADMIN',
    title: '👑 استرجاع حساب المالك (Owner Admin)',
    description: 'كود مخصص لاسترجاع صلاحيات المدير للرقم الأساسي 0617774846.',
    code: `
UPDATE public.profiles 
SET role = 'ADMIN', 
    status = 'ACTIVE' 
WHERE phone = '0617774846';
    `
  },
  {
    id: 'CLEAN_DATABASE_V3',
    title: '🧹 تنظيف وإعادة بناء الفئات (حل نهائي)',
    description: 'مسح شامل وإعادة بناء الفئات والتخصصات الطبية.',
    code: `
TRUNCATE public.sub_specialties CASCADE;
TRUNCATE public.business_categories CASCADE;

INSERT INTO public.business_categories (name_ar, name_fr, has_sub_specialties) VALUES 
('مكتب محاماة', 'Cabinet d''Avocat', false),
('مكتب محاسبة', 'Cabinet de Comptabilité', false),
('عيادة طبية', 'Clinique Médicale', true),
('مختبر طبي', 'Laboratoire Médical', false),
('مسوق بالعمولة', 'Affilié / Marketeur', false);

DO $$ 
DECLARE 
    medical_id UUID;
BEGIN
    SELECT id INTO medical_id FROM public.business_categories WHERE name_fr = 'Clinique Médicale' LIMIT 1;
    IF medical_id IS NOT NULL THEN
        INSERT INTO public.sub_specialties (category_id, name_ar, name_fr) VALUES 
        (medical_id, 'طب الأسنان', 'Dentisterie'),
        (medical_id, 'طب الجلد', 'Dermatologie'),
        (medical_id, 'طب العيون', 'Ophtalmologie'),
        (medical_id, 'طب الأطفال', 'Pédiatrie'),
        (medical_id, 'الطب العام', 'Médecine Générale');
    END IF;
END $$;
    `
  }
];
