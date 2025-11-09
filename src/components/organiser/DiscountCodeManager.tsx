'use client';
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Copy, Check, Edit2, Ticket } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

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
}

interface DiscountCodeManagerProps {
  eventId: number;
  eventTitle: string;
  user: User | null;
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

  const fetchDiscountCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('DISCOUNT_CODES')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDiscountCodes(data || []);
    } catch (error) {
      console.error('Error fetching discount codes:', error);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  const handleSubmit = async () => {
    if (!user || !formData.code) {
      alert('Please enter a discount code');
      return;
    }

    setLoading(true);
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
        current_uses: editingCode ? undefined : 0
      };

      if (editingCode) {
        const { error } = await supabase
          .from('DISCOUNT_CODES')
          .update(codeData)
          .eq('id', editingCode.id);

        if (error) throw error;
        alert('Discount code updated successfully!');
      } else {
        const { error } = await supabase
          .from('DISCOUNT_CODES')
          .insert([codeData]);

        if (error) throw error;
        alert('Discount code created successfully!');
      }

      await fetchDiscountCodes();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving discount code:', error);
      const dbError = error as { code?: string; message?: string };
      if (dbError?.code === '23505') {
        alert('This discount code already exists. Please use a different code.');
      } else {
        alert(`Failed to save discount code: ${dbError?.message || 'Please try again.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, code: string) => {
    if (!confirm(`Are you sure you want to delete the discount code "${code}"?`)) return;

    try {
      const { error } = await supabase
        .from('DISCOUNT_CODES')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchDiscountCodes();
      alert('Discount code deleted successfully!');
    } catch (error) {
      console.error('Error deleting discount code:', error);
      alert('Failed to delete discount code. Please try again.');
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('DISCOUNT_CODES')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      await fetchDiscountCodes();
    } catch (error) {
      console.error('Error toggling discount code status:', error);
      alert('Failed to update discount code status. Please try again.');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleEdit = (discount: DiscountCode) => {
    setEditingCode(discount);
    setFormData({
      code: discount.code,
      discountType: discount.discount_type,
      discountValue: discount.discount_value,
      maxUses: discount.max_uses?.toString() || '',
      validFrom: discount.valid_from || '',
      validUntil: discount.valid_until || '',
      isActive: discount.is_active
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCode(null);
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

  const formatDiscountValue = (type: string, value: number) => {
    if (type === 'percentage') return `${value}% off`;
    if (type === 'free') return 'Free Ticket';
    return `$${value} off`;
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white">
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Discount Codes</h2>
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              Manage promotional codes for {eventTitle}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm flex items-center justify-center gap-2 touch-manipulation"
          >
            <Plus className="w-4 h-4" />
            Create Code
          </button>
        </div>
      </div>

      <div className="divide-y divide-gray-200">
        {discountCodes.length > 0 ? (
          discountCodes.map(discount => (
            <div key={discount.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <code className="text-base sm:text-lg font-bold text-gray-900 bg-gray-100 px-3 py-1 rounded">
                      {discount.code}
                    </code>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        discount.is_active
                      )}`}
                    >
                      {discount.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {discount.discount_type === 'free' && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Ticket className="w-3 h-3" />
                        Free Ticket
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
                    <div>
                      <span className="text-gray-500 block mb-0.5">Discount</span>
                      <p className="font-medium">
                        {formatDiscountValue(discount.discount_type, discount.discount_value)}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Usage</span>
                      <p className="font-medium">
                        {discount.current_uses}/{discount.max_uses || '∞'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Valid Until</span>
                      <p className="font-medium">
                        {discount.valid_until
                          ? new Date(discount.valid_until).toLocaleDateString()
                          : 'No expiry'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-500 block mb-0.5">Created</span>
                      <p className="font-medium">
                        {new Date(discount.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center gap-2 justify-end sm:ml-4">
                  <button
                    onClick={() => handleCopyCode(discount.code)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                    title="Copy code"
                  >
                    {copiedCode === discount.code ? (
                      <Check className="w-4 h-4 text-green-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => handleEdit(discount)}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors touch-manipulation"
                    title="Edit code"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(discount.id, discount.is_active)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors touch-manipulation ${
                      discount.is_active
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                    title={discount.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {discount.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(discount.id, discount.code)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors touch-manipulation"
                    title="Delete code"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 sm:p-12 text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ticket className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
              No discount codes yet
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              Create your first promotional code to boost ticket sales.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors touch-manipulation"
            >
              Create Your First Code
            </button>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-end sm:items-center justify-center">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md h-[90vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 p-4 rounded-t-2xl z-10">
              <div className="flex items-center justify-between">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {editingCode ? 'Edit Discount Code' : 'Create Discount Code'}
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors touch-manipulation"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Code *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))
                    }
                    placeholder="SAVE50"
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase font-mono text-sm"
                    maxLength={20}
                  />
                  <button
                    type="button"
                    onClick={generateRandomCode}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm whitespace-nowrap touch-manipulation"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Type *
                </label>
                <select
                  value={formData.discountType}
                  onChange={e =>
                    setFormData(prev => ({
                      ...prev,
                      discountType: e.target.value as 'percentage' | 'fixed' | 'free',
                      discountValue: e.target.value === 'free' ? 100 : prev.discountValue
                    }))
                  }
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="free">Free Ticket (100% off)</option>
                  <option value="percentage">Percentage Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                </select>
              </div>

              {formData.discountType !== 'free' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Value *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={formData.discountValue}
                      onChange={e =>
                        setFormData(prev => ({ ...prev, discountValue: Number(e.target.value) }))
                      }
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      min={1}
                      max={formData.discountType === 'percentage' ? 100 : undefined}
                    />
                    {formData.discountType === 'percentage' && (
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500">
                        %
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Uses
                </label>
                <input
                  type="number"
                  value={formData.maxUses}
                  onChange={e => setFormData(prev => ({ ...prev, maxUses: e.target.value }))}
                  placeholder="Unlimited"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  min={1}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty for unlimited uses
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid From
                  </label>
                  <input
                    type="date"
                    value={formData.validFrom}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, validFrom: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valid Until
                  </label>
                  <input
                    type="date"
                    value={formData.validUntil}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, validUntil: e.target.value }))
                    }
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, isActive: e.target.checked }))
                  }
                  className="w-4 h-4 mt-0.5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Activate this discount code immediately
                </label>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !formData.code}
                  className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed touch-manipulation"
                >
                  {loading ? 'Saving...' : editingCode ? 'Update Code' : 'Create Code'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscountCodeManager;