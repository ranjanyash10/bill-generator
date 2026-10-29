import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Send } from 'lucide-react';
import api from '../services/api';
import { numberToWordsINR } from '../utils/currency';

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
    tax_type: 'INTRA_STATE',
    tax_rate: 0,
    discount_rate: 0,
    discount: 0,
    amount_received: '',
    items: [{ description: '', hsn_sac: '', quantity: '1', unit_price: '' }]
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
          nextState.amount_received = calculateTotal(nextState as any).toString();
        } else if (value === 'UNPAID') {
          nextState.amount_received = '0';
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
      items: [...prev.items, { description: '', hsn_sac: '', quantity: '1', unit_price: '' }]
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
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900">
              Create New {docType === 'BILL' ? 'Tax Invoice' : 'Proforma Invoice'}
            </h1>
            <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-semibold rounded-full border border-rose-200 uppercase tracking-wide">
              {docType === 'BILL' ? 'Official GST Bill' : 'Proforma Estimate'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Fill in the customer details and line items below</p>
        </div>
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-rose-100">
          <div className="flex justify-between items-center mb-4 border-b border-rose-100 pb-2">
            <h2 className="text-lg font-semibold text-gray-800">Transaction Details</h2>
            <span className="text-xs px-2.5 py-1 bg-rose-50 text-rose-700 font-medium rounded-full border border-rose-200">
              Taxable Items
            </span>
          </div>
          
          <div className="space-y-4">
            <div className="grid grid-cols-12 gap-3 text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2 px-2">
              <div className="col-span-4">Description / Particulars *</div>
              <div className="col-span-2">HSN / SAC</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Unit Price (₹)</div>
              <div className="col-span-1 text-right">Total (₹)</div>
              <div className="col-span-1"></div>
            </div>
            
            {formData.items.map((item, index) => (
              <div key={index} className="grid grid-cols-12 gap-3 items-center bg-gray-50/50 hover:bg-rose-50/20 p-2 rounded-lg transition-colors border border-gray-100">
                <div className="col-span-4">
                  <input 
                    type="text" 
                    required 
                    value={item.description} 
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)} 
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm" 
                    placeholder="Item or service description" 
                  />
                </div>
                <div className="col-span-2">
                  <input 
                    type="text" 
                    value={item.hsn_sac || ''} 
                    onChange={(e) => handleItemChange(index, 'hsn_sac', e.target.value)} 
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm font-mono" 
                    placeholder="e.g. 998313" 
                  />
                </div>
                <div className="col-span-2">
                  <input 
                    type="number" 
                    min="0.01" 
                    step="0.01" 
                    required 
                    value={item.quantity} 
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} 
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm text-right" 
                  />
                </div>
                <div className="col-span-2">
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    required 
                    value={item.unit_price} 
                    onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)} 
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm text-right font-mono" 
                    placeholder="0.00" 
                  />
                </div>
                <div className="col-span-1 text-right font-semibold text-gray-800 text-sm overflow-hidden text-ellipsis whitespace-nowrap">
                  ₹{((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)).toFixed(2)}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button 
                    type="button" 
                    onClick={() => removeItem(index)} 
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors" 
                    disabled={formData.items.length === 1}
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            
            <button 
              type="button" 
              onClick={addItem} 
              className="flex items-center space-x-2 text-rose-700 hover:text-rose-900 font-medium mt-2 px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors text-sm"
            >
              <Plus size={16} /> <span>Add Another Item</span>
            </button>
          </div>
          
          <div className="mt-8 border-t border-rose-100 pt-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea 
                  name="notes" 
                  rows={3} 
                  value={formData.notes} 
                  onChange={handleInputChange} 
                  placeholder="Terms, bank account details, or payment instructions..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
                ></textarea>
              </div>
              {docType === 'BILL' && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                      <select 
                        name="payment_status" 
                        value={formData.payment_status} 
                        onChange={handleInputChange} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm"
                      >
                        <option value="UNPAID">Unpaid</option>
                        <option value="PARTIAL">Partially Paid</option>
                        <option value="PAID">Paid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                      <input 
                        type="text" 
                        name="payment_mode" 
                        value={formData.payment_mode} 
                        onChange={handleInputChange} 
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm" 
                        placeholder="e.g. UPI / NEFT" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Ref / UTR</label>
                    <input 
                      type="text" 
                      name="transaction_reference" 
                      value={formData.transaction_reference} 
                      onChange={handleInputChange} 
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-sm" 
                      placeholder="e.g. UTR983726152"
                    />
                  </div>
                </>
              )}
            </div>
            
            <div className="bg-gradient-to-br from-rose-50/60 to-pink-50/40 p-6 rounded-xl space-y-3 border border-rose-200 shadow-xs">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold text-gray-800">₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-600">Discount (%)</span>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  step="0.1" 
                  name="discount_rate" 
                  value={formData.discount_rate} 
                  onChange={handleInputChange} 
                  className="w-24 px-2 py-1 bg-white border border-gray-300 rounded-md text-right outline-none focus:ring-1 focus:ring-rose-500" 
                />
              </div>
              {Number(formData.discount_rate) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Discount Amount (₹)</span>
                  <span className="font-medium text-rose-600">-₹{(calculateSubtotal() * (Number(formData.discount_rate) || 0) / 100).toFixed(2)}</span>
                </div>
              )}

              {/* GST Supply Type Toggle */}
              <div className="pt-2 border-t border-rose-200/70">
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Supply Type (GST)
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tax_type: 'INTRA_STATE' }))}
                    className={`py-1.5 px-2 rounded-lg border font-medium text-center transition-all ${
                      formData.tax_type === 'INTRA_STATE'
                        ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-rose-50/60'
                    }`}
                  >
                    Intra-State (CGST + SGST)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, tax_type: 'INTER_STATE' }))}
                    className={`py-1.5 px-2 rounded-lg border font-medium text-center transition-all ${
                      formData.tax_type === 'INTER_STATE'
                        ? 'bg-rose-700 text-white border-rose-700 shadow-xs'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-rose-50/60'
                    }`}
                  >
                    Inter-State (IGST)
                  </button>
                </div>
              </div>

              <div className="flex justify-between text-sm items-center">
                <span className="text-gray-600">Total GST Rate (%)</span>
                <input 
                  type="number" 
                  min="0" 
                  step="0.1" 
                  name="tax_rate" 
                  value={formData.tax_rate} 
                  onChange={handleInputChange} 
                  className="w-24 px-2 py-1 bg-white border border-gray-300 rounded-md text-right outline-none focus:ring-1 focus:ring-rose-500" 
                />
              </div>

              {/* Dynamic GST Breakdown */}
              {Number(formData.tax_rate) > 0 && (() => {
                const subtotal = calculateSubtotal();
                const discount = subtotal * ((Number(formData.discount_rate) || 0) / 100);
                const taxable = Math.max(0, subtotal - discount);
                const totalTax = taxable * ((Number(formData.tax_rate) || 0) / 100);

                if (formData.tax_type === 'INTER_STATE') {
                  return (
                    <div className="flex justify-between text-xs text-rose-800 bg-rose-100/70 px-2.5 py-1.5 rounded-lg border border-rose-200">
                      <span className="font-medium">IGST ({Number(formData.tax_rate)}%)</span>
                      <span className="font-semibold font-mono">₹{totalTax.toFixed(2)}</span>
                    </div>
                  );
                } else {
                  const halfRate = (Number(formData.tax_rate) || 0) / 2;
                  const halfTax = totalTax / 2;
                  return (
                    <div className="space-y-1 bg-rose-100/70 p-2.5 rounded-lg border border-rose-200 text-xs text-rose-800">
                      <div className="flex justify-between">
                        <span className="font-medium">CGST ({halfRate}%)</span>
                        <span className="font-semibold font-mono">₹{halfTax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">SGST ({halfRate}%)</span>
                        <span className="font-semibold font-mono">₹{halfTax.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                }
              })()}

              <div className="pt-3 border-t border-rose-200 flex justify-between items-center">
                <span className="font-bold text-gray-900">Total Amount</span>
                <span className="font-bold text-rose-800 text-xl font-mono">₹{calculateTotal().toFixed(2)}</span>
              </div>

              <div className="bg-white/80 p-2.5 rounded-lg border border-rose-200/80 text-xs">
                <span className="font-semibold text-gray-600 block mb-0.5">Amount in Words:</span>
                <span className="font-medium text-rose-950 italic leading-relaxed">{numberToWordsINR(calculateTotal())}</span>
              </div>
              {docType === 'BILL' && (
                <div className="pt-3 border-t border-rose-200 flex justify-between text-sm items-center">
                  <span className="text-gray-700 font-medium">Amount Received (₹)</span>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    name="amount_received" 
                    value={formData.amount_received} 
                    onChange={handleInputChange} 
                    className="w-32 px-2.5 py-1 bg-white border border-rose-300 rounded-md text-right font-semibold text-rose-900 outline-none focus:ring-2 focus:ring-rose-500" 
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-4">
          <button 
            type="button" 
            onClick={(e) => handleSubmit(e, false)} 
            disabled={loading} 
            className="flex items-center space-x-2 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors shadow-xs"
          >
            <Save size={18} /> <span>Save as Draft</span>
          </button>
          <button 
            type="button" 
            onClick={(e) => handleSubmit(e, true)} 
            disabled={loading} 
            className="flex items-center space-x-2 px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-colors shadow-sm shadow-rose-200"
          >
            <Send size={18} /> <span>Issue Document</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateDocument;
