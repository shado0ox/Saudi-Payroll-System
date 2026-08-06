import { TaxBracket } from '../types';

/**
 * Calculates progressive tax based on tax brackets
 */
export function calculateProgressiveTax(taxableIncome: number, brackets: TaxBracket[]): number {
  if (taxableIncome <= 0) return 0;

  let totalTax = 0;

  for (const bracket of brackets) {
    if (taxableIncome > bracket.min) {
      const taxableInBracket = bracket.max === null 
        ? taxableIncome - bracket.min 
        : Math.min(taxableIncome - bracket.min, bracket.max - bracket.min);
      
      totalTax += taxableInBracket * bracket.rate;
    }
  }

  return Math.round(totalTax * 100) / 100;
}

/**
 * Calculates Social Security / Pension / GOSI contribution
 */
export function calculateSocialSecurity(
  contributorySalary: number,
  employeeRate: number,
  employerRate: number,
  isEnrolled: boolean
) {
  if (!isEnrolled || contributorySalary <= 0) {
    return { employeeShare: 0, employerShare: 0 };
  }

  // Cap contributory salary at 45,000 SAR max
  const cappedSalary = Math.min(contributorySalary, 45000);

  const employeeShare = Math.round(cappedSalary * employeeRate * 100) / 100;
  const employerShare = Math.round(cappedSalary * employerRate * 100) / 100;

  return { employeeShare, employerShare };
}
