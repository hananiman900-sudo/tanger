
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://thszcwawojpblocppcmu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRoc3pjd2F3b2pwYmxvY3BwY211Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYyMzE0OTMsImV4cCI6MjA4MTgwNzQ5M30.VUz2A976Qtn__bzqwPBlSuxcMAbQ6w6kFqY2AZAOFDE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SQL_SNIPPETS = [
  {
    id: 'ADMIN_FULL_UPGRADE',
    title: '👑 ترقية الحساب وتجهيز النظام',
    description: 'يرقي رقمك لمدير وينشئ جداول العمارات والتخصصات.',
    code: `
-- ترقية المدير
UPDATE public.profiles SET role = 'ADMIN', status = 'ACTIVE' WHERE phone = '0617774846';

-- إنشاء جدول العمارات
CREATE TABLE IF NOT EXISTS public.buildings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    neighborhood_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- إنشاء جدول التخصصات
CREATE TABLE IF NOT EXISTS public.specialties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
    `
  }
];
