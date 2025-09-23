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
      || currencies[0]; // fallback to XOF (CFA)
  }
  