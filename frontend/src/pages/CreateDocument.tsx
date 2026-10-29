import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Send } from 'lucide-react';
import api from '../services/api';

const CreateDocument = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const docType = type?.toUpperCase() === 'BILL' ? 'BILL' : 'RECEIPT';
  
  const [formData, setFormData] = useState({
    customer_name: '',
    company_name: '',
    phone_number: '',
    email_address: '',
    billing_address: '',
    gstin: '',
    date: new Date().toISOString().split('T')[0],
    payment_status: 'UNPAID',
    payment_mode: '',
    transaction_reference: '',
    notes: '',
    tax_rate: 0,
    discount_rate: 0,
    discount: 0,
    amount_received: '',
    items: [{ description: '', quantity: '1', unit_price: '' }]
  });

  const [loading, setLoading] = useState(false);

  const calculateSubtotal = (items = formData.items) => {
    return items.reduce((sum, item) => sum + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)), 0);
  };

  const calculateTotal = (state = formData) => {
    const subtotal = calculateSubtotal(state.items);
    const discountAmount = subtotal * ((Number(state.discount_rate) || 0) / 100);
    const taxable = subtotal - discountAmount;
    const taxAmount = taxable * ((Number(state.tax_rate) || 0) / 100);
    return taxable + taxAmount;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const nextState = { ...prev, [name]: value };
      
      if (name === 'payment_status') {
        if (value === 'PAID') {
          nextState.amount_received = calculateTotal(nextState as any);
        } else if (value === 'UNPAID') {
          nextState.amount_received = 0;
        }
      }
      return nextState;
    });
  };

  const handleItemChange = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: '1', unit_price: '' }]
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length === 1) return;
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData(prev => ({ ...prev, items: newItems }));
  };



  const handleSubmit = async (e: React.FormEvent, issue: boolean) => {
    e.preventDefault();
    setLoading(true);
    try {
      // First save as draft
      // Calculate flat discount amount to send to backend
      const discountAmount = calculateSubtotal() * ((Number(formData.discount_rate) || 0) / 100);
      
      const response = await api.post('/documents/', {
        ...formData,
        discount: discountAmount,
        doc_type: docType
      });
      
      const docId = response.data.id;
      
      // If issuing, issue the document
      if (issue) {
        if (!window.confirm("Are you sure you want to issue this document? This will assign a permanent number and cannot be silently undone.")) {
          setLoading(false);
          return;
        }
        await api.post(`/documents/${docId}/issue`);
      }
      
      navigate('/history');
    } catch (err) {
      console.error("Failed to save document", err);
      alert("Failed to save document. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-company-navy">
          Create New {docType === 'BILL' ? 'Tax Invoice' : 'Proforma Invoice'}
        </h1>
      </div>

      <form className="space-y-6">
        {/* Customer Details */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-company-border">
          <h2 className="text-lg font-semibold text-company-charcoal mb-4 border-b pb-2">Customer Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer / Client Name *</label>
              <input type="text" name="customer_name" required value={formData.customer_name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue focus:border-company-blue outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input type="text" name="company_name" value={formData.company_name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue focus:border-company-blue outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="text" name="phone_number" value={formData.phone_number} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue focus:border-company-blue outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input type="email" name="email_address" value={formData.email_address} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue focus:border-company-blue outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
              <input type="text" name="gstin" value={formData.gstin} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue focus:border-company-blue outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Document Date *</label>
              <input type="date" name="date" required value={formData.date} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue focus:border-company-blue outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address</label>
              <textarea name="billing_address" rows={2} value={formData.billing_address} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue focus:border-company-blue outline-none"></textarea>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-company-border">
          <h2 className="text-lg font-semibold text-company-charcoal mb-4 border-b pb-2">Transaction Details</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-700 mb-2 px-2">
              <div className="col-span-5">Description / Particulars *</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Unit Price</div>
              <div className="col-span-2 text-right">Total</div>
              <div className="col-span-1"></div>
            </div>
            
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5">
                  <input type="text" required value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none" placeholder="Item description" />
                </div>
                <div className="col-span-2">
                  <input type="number" min="0.01" step="0.01" required value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none" />
                </div>
                <div className="col-span-2">
                  <input type="number" min="0" step="0.01" required value={item.unit_price} onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none" />
                </div>
                <div className="col-span-2 text-right font-medium text-gray-700 flex items-center justify-end overflow-hidden text-ellipsis whitespace-nowrap">
                  ₹{((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toFixed(2)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" disabled={formData.items.length === 1}>
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
            
            <button type="button" onClick={addItem} className="flex items-center space-x-2 text-company-blue font-medium hover:text-blue-700 mt-2 px-2">
              <Plus size={18} /> <span>Add Another Item</span>
            </button>
          </div>
          
          <div className="mt-8 border-t pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea name="notes" rows={3} value={formData.notes} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none"></textarea>
              </div>
              {docType === 'BILL' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                      <select name="payment_status" value={formData.payment_status} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none">
                        <option value="UNPAID">Unpaid</option>
                        <option value="PARTIAL">Partially Paid</option>
                        <option value="PAID">Paid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                      <input type="text" name="payment_mode" value={formData.payment_mode} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none" placeholder="e.g. Bank Transfer" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Ref</label>
                    <input type="text" name="transaction_reference" value={formData.transaction_reference} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none" />
                  </div>
                </>
              )}
            </div>
            
            <div className="bg-gray-50 p-6 rounded-lg space-y-3 border border-gray-200">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-medium">₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-600">Discount (%)</span>
                <input type="number" min="0" max="100" step="0.1" name="discount_rate" value={formData.discount_rate} onChange={handleInputChange} className="w-24 px-2 py-1 border border-gray-300 rounded text-right outline-none" />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Discount Amount (₹)</span>
                <span className="font-medium text-red-600">-₹{(calculateSubtotal() * (Number(formData.discount_rate) || 0) / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-600">Tax Rate (%)</span>
                <input type="number" min="0" step="0.1" name="tax_rate" value={formData.tax_rate} onChange={handleInputChange} className="w-24 px-2 py-1 border border-gray-300 rounded text-right outline-none" />
              </div>
              <div className="pt-3 border-t border-gray-300 flex justify-between">
                <span className="font-bold text-gray-800">Total Amount</span>
                <span className="font-bold text-company-navy text-lg">₹{calculateTotal().toFixed(2)}</span>
              </div>
              {docType === 'BILL' && (
                <div className="pt-3 flex justify-between text-sm items-center">
                  <span className="text-gray-600 font-medium">Amount Received (₹)</span>
                  <input type="number" min="0" step="0.01" name="amount_received" value={formData.amount_received} onChange={handleInputChange} className="w-32 px-2 py-1 border border-company-blue rounded text-right font-medium outline-none" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={(e) => handleSubmit(e, false)} disabled={loading} className="flex items-center space-x-2 px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors shadow-sm">
            <Save size={18} /> <span>Save as Draft</span>
          </button>
          <button type="button" onClick={(e) => handleSubmit(e, true)} disabled={loading} className="flex items-center space-x-2 px-6 py-2 bg-company-blue text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-sm">
            <Send size={18} /> <span>Issue Document</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDocument;
