
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://thszcwawojpblocppcmu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoc3pjd2F3b2pwYmxvY3BwY211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMzE0OTMsImV4cCI6MjA4MTgwNzQ5M30.VUz2A976Qtn__bzqwPBlSuxcMAbQ6w6kFqY2AZAOFDE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SQL_SNIPPETS = [
  {
    id: 'UPDATE_FOR_PLANS_AND_DEBTS',
    title: '🚀 تحديث الخطط والديون (V2)',
    description: 'يضيف أعمدة نوع الحساب (Account Type)، الخطة (Plan)، والديون (Debt) للبروفايلات.',
    code: `
-- تحديث جدول البروفايلات
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS account_type TEXT DEFAULT 'PROFESSIONAL',
ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS debt_balance NUMERIC DEFAULT 0;

-- تحديث الفئات لتشمل خيار المسوق
INSERT INTO public.business_categories (name_ar, name_fr, has_sub_specialties)
SELECT 'مسوق مستقل', 'Marketer Indépendant', false
WHERE NOT EXISTS (SELECT 1 FROM public.business_categories WHERE name_fr = 'Marketer Indépendant');
    `
  },
  {
    id: 'FIX_DATABASE_SCHEMA',
    title: '🛠️ إصلاح أعمدة قاعدة البيانات (Fix Schema)',
    description: 'إضافة الأعمدة الأساسية.',
    code: `
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS office_number TEXT,
ADD COLUMN IF NOT EXISTS building_id UUID,
ADD COLUMN IF NOT EXISTS floor TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS category_id UUID,
ADD COLUMN IF NOT EXISTS sub_specialty_id UUID;
    `
  }
];
