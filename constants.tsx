
import { Neighborhood, Building } from './types';

export const NEIGHBORHOODS: Neighborhood[] = [
  { id: '1', name: 'Malabata' },
  { id: '2', name: 'Branes' },
  { id: '3', name: 'Mesnana' },
  { id: '4', name: 'California' },
  { id: '5', name: 'Centre Ville' },
  { id: '6', name: 'Iberia' },
  // Fixed the apostrophe issue by using double quotes
  { id: '7', name: "M'nar" },
  { id: '8', name: 'Beni Makada' }
];

export const BUILDINGS: Building[] = [
  { id: 'b1', name: 'Immeuble Abraj Al Madina', neighborhoodId: '5', address: 'Blvd Mohamed V' },
  { id: 'b2', name: 'Ibn Batouta Centre', neighborhoodId: '5', address: 'Blvd Mohamed VI' },
  { id: 'b3', name: 'Malabata Business Center', neighborhoodId: '1', address: 'Malabata Coast' },
  { id: 'b4', name: 'California Office Suites', neighborhoodId: '4', address: 'California Hills' }
];

export const SPECIALTIES = [
  'General Medicine',
  'Gastroenterology',
  'Dentistry',
  'Law Firm',
  'Accounting',
  'Real Estate',
  'IT Services',
  'Marketing Agency'
];

export const SUBSCRIPTION_PRICE = 300; // DH
export const REFERRAL_DISCOUNT = 10; // DH
export const REFERRAL_COMMISSION = 10; // DH (Referrer)
export const ADMIN_COMMISSION = 10; // DH