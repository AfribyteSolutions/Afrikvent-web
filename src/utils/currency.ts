// utils/currency.ts

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

export const currencies: Currency[] = [
  { code: 'XOF', symbol: 'CFA', name: 'West African CFA Franc', flag: '🇸🇳' },
  { code: 'GHS', symbol: '₵', name: 'Ghanaian Cedi', flag: '🇬🇭' },
  { code: 'NGN', symbol: '₦', name: 'Nigerian Naira', flag: '🇳🇬' },
  { code: 'XAF', symbol: 'FCFA', name: 'Central African CFA Franc', flag: '🇨🇲' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand', flag: '🇿🇦' },
  { code: 'KES', symbol: 'KSh', name: 'Kenyan Shilling', flag: '🇰🇪' },
  { code: 'UGX', symbol: 'USh', name: 'Ugandan Shilling', flag: '🇺🇬' },
  { code: 'TZS', symbol: 'TSh', name: 'Tanzanian Shilling', flag: '🇹🇿' },
  { code: 'ETB', symbol: 'Br', name: 'Ethiopian Birr', flag: '🇪🇹' },
  { code: 'EGP', symbol: '£', name: 'Egyptian Pound', flag: '🇪🇬' },
  { code: 'MAD', symbol: 'DH', name: 'Moroccan Dirham', flag: '🇲🇦' },
  { code: 'BWP', symbol: 'P', name: 'Botswanan Pula', flag: '🇧🇼' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' }
];

// Helper function
export function getCurrencyInfo(code?: string): Currency {
  return currencies.find(c => c.code === code) 
    || currencies.find(c => c.code === 'XOF') // fallback to XOF (CFA) if code is missing
    || currencies[0];
}

/**
* 💥 THE FIX: Export the convertCurrency function 💥
* Placeholder for real-world currency conversion logic.
*/
export async function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> {
  // ⚠️ WARNING: In a production app, this must fetch live rates.
  // This is a simplified mock using hardcoded ratios relative to XOF for demonstration.
  
  // Placeholder Rates (Relative to 1 XOF, simplified and NOT accurate for production)
  const MOCK_RATES: { [key: string]: number } = {
      'XOF': 1,
      'GHS': 0.02,  // 1 GHS ≈ 50 XOF
      'NGN': 0.76,  // 1 NGN ≈ 1.3 XOF
      'USD': 0.0016, // 1 USD ≈ 625 XOF
      'EUR': 0.0015, // 1 EUR ≈ 656 XOF
      'GBP': 0.0013, // 1 GBP ≈ 780 XOF
  };

  const rateFrom = MOCK_RATES[fromCurrency] || 1;
  const rateTo = MOCK_RATES[toCurrency] || 1;

  // Simulate an API delay
  await new Promise(resolve => setTimeout(resolve, 50)); 

  // Convert to a base currency (like XOF in this mock), then to the target currency
  // amount_in_XOF = amount * rateFrom
  // amount_in_target = amount_in_XOF * (1 / rateTo)
  
  if (rateFrom === 0 || rateTo === 0) {
      throw new Error("Invalid mock rate for conversion.");
  }

  return (amount / rateFrom) * rateTo; 
}