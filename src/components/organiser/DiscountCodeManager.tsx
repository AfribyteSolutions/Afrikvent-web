'use client';
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Copy, Check, Edit2, Ticket, AlertCircle } from 'lucide-react';
import { createClient, PostgrestError } from '@supabase/supabase-js';

// Initialize Supabase client - replace with your actual values
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface DiscountCode {
  id: number;
  event_id: number;
  code: string;
  discount_type: 'percentage' | 'fixed' | 'free';
  discount_value: number;
  max_uses: number | null;
  current_uses: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string;
}

interface DiscountCodeManagerProps {
  eventId: number;
  eventTitle: string;
  user: { id: string } | null;
}

const DiscountCodeManager: React.FC<DiscountCodeManagerProps> = ({
  eventId,
  eventTitle,
  user
}) => {
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [editingCode, setEditingCode] = useState<DiscountCode | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'free' as 'percentage' | 'fixed' | 'free',
    discountValue: 100,
    maxUses: '',
    validFrom: '',
    validUntil: '',
    isActive: true
  });

  useEffect(() => {
    if (eventId) {
      fetchDiscountCodes();
    }
  }, [eventId]);

  const fetchDiscountCodes = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('DISCOUNT_CODES')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
        throw error;
      }
      setDiscountCodes(data || []);
    } catch (err) {
      console.error('Error fetching discount codes:', err);
      setError('Failed to load discount codes');
    }
  };

  const generateRandomCode = (): void => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  const handleSubmit = async (): Promise<void> => {
    if (!user) {
      setError('You must be logged in to create discount codes');
      return;
    }

    if (!formData.code.trim()) {
      setError('Please enter a discount code');
      return;
    }

    const codeRegex = /^[A-Z0-9]+$/;
    if (!codeRegex.test(formData.code.toUpperCase())) {
      setError('Discount code can only contain letters and numbers');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const codeData = {
        event_id: eventId,
        code: formData.code.toUpperCase().trim(),
        discount_type: formData.discountType,
        discount_value: formData.discountType === 'free' ? 100 : Number(formData.discountValue),
        max_uses: formData.maxUses ? Number(formData.maxUses) : null,
        valid_from: formData.validFrom || null,
        valid_until: formData.validUntil || null,
        is_active: formData.isActive,
        created_by: user.id
      };

      if (editingCode) {
        // Update existing code
        const { error } = await supabase
          .from('DISCOUNT_CODES')
          .update(codeData)
          .eq('id', editingCode.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        alert('Discount code updated successfully!');
      } else {
        // Insert new code
        const { error } = await supabase
          .from('DISCOUNT_CODES')
          .insert([{ ...codeData, current_uses: 0 }]);

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        alert('Discount code created successfully!');
      }

      await fetchDiscountCodes();
      handleCloseModal();
    } catch (err) {
      console.error('Error saving discount code:', err);
      const e = err as PostgrestError | Error;

      if ('code' in e && e.code === '23505') {
        setError('This discount code already exists. Please use a different code.');
      } else if ('code' in e && e.code === '42501') {
        setError('Permission denied. You may not have access to manage discount codes for this event.');
      } else if ('code' in e && e.code === '23503') {
        setError('Invalid event or user reference. Please refresh the page and try again.');
      } else if ('message' in e && e.message.includes('violates foreign key')) {
        setError('Invalid event. Please refresh the page and try again.');
      } else if ('message' in e) {
        setError(`Failed to save: ${e.message}`);
      } else {
        setError('Failed to save discount code. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, code: string): Promise<void> => {
    if (!confirm(`Are you sure you want to delete the discount code "${code}"?`)) return;

    try {
      const { error } = await supabase
        .from('DISCOUNT_CODES')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchDiscountCodes();
      alert('Discount code deleted successfully!');
    } catch (err) {
      console.error('Error deleting discount code:', err);
      setError('Failed to delete discount code. Please try again.');
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean): Promise<void> => {
    try {
      const { error } = await supabase
        .from('DISCOUNT_CODES')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchDiscountCodes();
    } catch (err) {
      console.error('Error toggling discount code status:', err);
      setError('Failed to update discount code status. Please try again.');
    }
  };

  const handleCopyCode = (code: string): void => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleEdit = (discount: DiscountCode): void => {
    setEditingCode(discount);
    setFormData({
      code: discount.code,
      discountType: discount.discount_type,
      discountValue: discount.discount_value,
      maxUses: discount.max_uses?.toString() || '',
      validFrom: discount.valid_from ? discount.valid_from.split('T')[0] : '',
      validUntil: discount.valid_until ? discount.valid_until.split('T')[0] : '',
      isActive: discount.is_active
    });
    setIsModalOpen(true);
    setError(null);
  };

  const handleCloseModal = (): void => {
    setIsModalOpen(false);
    setEditingCode(null);
    setError(null);
    setFormData({
      code: '',
      discountType: 'free',
      discountValue: 100,
      maxUses: '',
      validFrom: '',
      validUntil: '',
      isActive: true
    });
  };

  const formatDiscountValue = (type: string, value: number): string => {
    if (type === 'percentage') return `${value}% off`;
    if (type === 'free') return 'Free Ticket';
    return `$${value} off`;
  };

  const getStatusColor = (isActive: boolean): string => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Authentication Required</h3>
        <p className="text-gray-600">Please log in to manage discount codes.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Ticket className="w-6 h-6" />
              Discount Codes
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Manage discount codes for {eventTitle}
            </p>
          </div>
          <button
            onClick={() => {
              setIsModalOpen(true);
              setEditingCode(null);
              setError(null);
            }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Create Code
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-800">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="p-6">
        {discountCodes.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No discount codes yet</h3>
            <p className="text-gray-600 mb-4">Create your first discount code to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {discountCodes.map((discount) => (
              <div
                key={discount.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <code className="text-lg font-mono font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded">
                        {discount.code}
                      </code>
                      <button
                        onClick={() => handleCopyCode(discount.code)}
                        className="text-gray-500 hover:text-gray-700 transition"
                        title="Copy code"
                      >
                        {copiedCode === discount.code ? (
                          <Check className="w-5 h-5 text-green-600" />
                        ) : (
                          <Copy className="w-5 h-5" />
                        )}
                      </button>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(discount.is_active)}`}>
                        {discount.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Discount:</strong> {formatDiscountValue(discount.discount_type, discount.discount_value)}
                      </p>
                      <p>
                        <strong>Usage:</strong> {discount.current_uses}
                        {discount.max_uses ? ` / ${discount.max_uses}` : ' / Unlimited'}
                      </p>
                      {(discount.valid_from || discount.valid_until) && (
                        <p>
                          <strong>Valid:</strong>{' '}
                          {discount.valid_from ? new Date(discount.valid_from).toLocaleDateString() : 'Anytime'} -{' '}
                          {discount.valid_until ? new Date(discount.valid_until).toLocaleDateString() : 'No expiry'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(discount.id, discount.is_active)}
                      className={`px-3 py-1 text-sm rounded transition ${
                        discount.is_active
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {discount.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEdit(discount)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(discount.id, discount.code)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCode ? 'Edit Discount Code' : 'Create Discount Code'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                    placeholder="SUMMER2024"
                  />
                  <button
                    onClick={generateRandomCode}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type
                </label>
                <select
                  value={formData.discountType}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData({
                      ...formData,
                      discountType: e.target.value as 'percentage' | 'fixed' | 'free',
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="free">Free Ticket (100% off)</option>
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                </select>
              </div>

              {formData.discountType !== 'free' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Value {formData.discountType === 'percentage' ? '(%)' : '($)'}
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max={formData.discountType === 'percentage' ? '100' : undefined}
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Max Uses (optional)
                </label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Unlimited"
                  min="1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid From (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Until (optional)
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Code is active
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Saving...' : editingCode ? 'Update Code' : 'Create Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountCodeManager;