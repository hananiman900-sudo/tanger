
export enum UserRole {
  ADMIN = 'ADMIN',
  PROFESSIONAL = 'PROFESSIONAL',
  REGULAR = 'REGULAR'
}

export enum AccountStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED'
}

export type AccountType = 'PROFESSIONAL' | 'MARKETER';
export type PlanType = 'FREE' | 'PREMIUM';

export type Language = 'ar' | 'fr' | 'en';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  role: UserRole;
  status: AccountStatus;
  accountType: AccountType;
  plan: PlanType;
  neighborhood?: string;
  specialty?: string;
  buildingId?: string;
  floor?: string;
  officeNumber?: string;
  description?: string;
  profileImage?: string;
  balancePending: number;
  balanceCompleted: number;
  debtBalance: number; // المبلغ الذي يدينه الطبيب للتطبيق
  referralCode: string;
  bankAccount?: string;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
    linkedin?: string;
    whatsapp?: string;
  };
  activeHours?: string;
  gpsLocation?: string;
  referralCount?: number;
}

export interface Post {
  id: string;
  user_id: string;
  image_url: string;
  content: string;
  created_at: string;
}

export interface Neighborhood {
  id: string;
  name: string;
}

export interface Building {
  id: string;
  name: string;
  neighborhoodId: string;
  address: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  receiver_id: string;
  patient_name: string;
  patient_condition?: string;
  code: string;
  status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  created_at: string;
  referrer?: Partial<User>;
  receiver?: Partial<User>;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'REFERRAL' | 'PAYMENT' | 'SYSTEM';
  is_read: boolean;
  created_at: string;
}
