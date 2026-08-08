import { SystemConfig } from '../types';

export const defaultConfig: SystemConfig = {
  companyName: 'Apex Enterprise Solutions Co.',
  currency: 'SAR',
  currencySymbol: 'ر.س',
  socialSecurityEmployeeRate: 0.09, // 9% GOSI / Social Insurance employee share
  socialSecurityEmployerRate: 0.11, // 11% GOSI / Social Insurance employer share
  standardMonthlyWorkDays: 30,
  overtimeHourlyMultiplier: 1.5,
  taxBrackets: [
    { min: 0, max: 3000, rate: 0 },
    { min: 3000, max: 8000, rate: 0.05 },
    { min: 8000, max: 15000, rate: 0.10 },
    { min: 15000, max: 30000, rate: 0.15 },
    { min: 30000, max: null, rate: 0.20 }
  ],
  autoProcessSchedule: 'Monthly on 25th',
  updatedAt: new Date().toISOString()
};