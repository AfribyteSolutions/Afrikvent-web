import { supabase } from '@/lib/supabaseClient';

export async function validateDiscountCode(
  code: string,
  eventId: number
): Promise<{ valid: boolean; error?: string }> {
  try {
    const { data: discount, error } = await supabase
      .from('DISCOUNT_CODES')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('event_id', eventId)
      .eq('is_active', true)
      .single();

    if (error || !discount) {
      return { valid: false, error: 'Invalid discount code' };
    }

    // Check usage limit
    if (discount.max_uses && discount.current_uses >= discount.max_uses) {
      return { valid: false, error: 'This discount code has reached its usage limit' };
    }

    // Only accept 100% discount codes
    if (discount.discount_type !== 'percentage' || discount.discount_value !== 100) {
      return { valid: false, error: 'Invalid discount code' };
    }

    return { valid: true };
  } catch (error) {
    console.error('Error validating discount code:', error);
    return { valid: false, error: 'Failed to validate discount code' };
  }
}

export async function incrementDiscountCodeUsage(code: string, eventId: number): Promise<void> {
  try {
    await supabase.rpc('increment_discount_usage', {
      discount_code: code.toUpperCase(),
      event_id_param: eventId
    });
  } catch (error) {
    console.error('Error incrementing discount usage:', error);
  }
}