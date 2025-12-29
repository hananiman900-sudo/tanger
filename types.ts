
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

export type Language = 'ar' | 'fr' | 'en';

export interface User {
  id: string;
  fullName: string;
  phone: string;
  role: UserRole;
  status: AccountStatus;
  neighborhood?: string;
  specialty?: string;
  buildingId?: string;
  floor?: string;
  description?: string;
  profileImage?: string;
  balancePending: number;
  balanceCompleted: number;
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

/* Added missing Neighborhood interface exported to constants.tsx */
export interface Neighborhood {
  id: string;
  name: string;
}

/* Added missing Building interface exported to constants.tsx */
export interface Building {
  id: string;
  name: string;
  neighborhoodId: string;
  address: string;
}

/* Added missing Referral interface exported to App.tsx */
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
