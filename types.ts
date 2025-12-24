
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
  subscriptionStart?: string;
  subscriptionExpiry?: string;
  referralCode: string;
  bankAccount?: string;
}

export interface Referral {
  id: string;
  code: string;
  referrer_id: string;
  receiver_id: string;
  patient_name: string;
  reason: string;
  status: 'PENDING' | 'COMPLETED';
  commission_amount: number;
  created_at: string;
  referrer_name?: string;
  receiver_name?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  sender: string;
  is_read: boolean;
  created_at: string;
}
