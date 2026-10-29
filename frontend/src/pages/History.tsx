import React, { useState, useEffect } from 'react';
import { Search, Download, Eye, FileText, IndianRupee, Trash2 } from 'lucide-react';
import api from '../services/api';

const History = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState('');
  const [amountReceived, setAmountReceived] = useState<number | string>(0);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const response = await api.get('/documents/');
        setDocuments(response.data);
      } catch (err) {
        console.error("Failed to fetch documents");
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, []);

  const handleDownload = async (id: number, docNumber: string) => {
    try {
      const response = await api.get(`/documents/${id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${docNumber || 'Draft'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download PDF");
    }
  };

  const filteredDocs = documents.filter((doc: any) => 
    (doc.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (doc.document_number?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this document? This action cannot be undone.")) return;
    
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(documents.filter((d: any) => d.id !== id));
    } catch (err) {
      alert("Failed to delete document");
    }
  };

  const openPaymentModal = (doc: any) => {
    setSelectedDoc(doc);
    setPaymentStatus(doc.payment_status);
    setAmountReceived(doc.amount_received);
  };

  const closePaymentModal = () => {
    setSelectedDoc(null);
  };

  const handlePaymentUpdate = async () => {
    if (!selectedDoc) return;
    
    const maxAmount = selectedDoc.total_amount;
    const received = Number(amountReceived);
    if (paymentStatus === 'PARTIAL' && (received <= 0 || received >= maxAmount)) {
      alert(`Partial payment amount must be between 0 and ${maxAmount}`);
      return;
    }
    
    setUpdating(true);
    try {
      await api.patch(`/documents/${selectedDoc.id}/payment`, {
        payment_status: paymentStatus,
        amount_received: paymentStatus === 'PARTIAL' ? received : 0
      });
      const response = await api.get('/documents/');
      setDocuments(response.data);
      closePaymentModal();
    } catch (err) {
      alert("Failed to update payment status");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-company-navy">Document History</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-company-border overflow-hidden">
        <div className="p-4 border-b border-company-border flex justify-between items-center">
          <div className="relative w-64">
            <input 
              type="text" 
              placeholder="Search by customer or number..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none text-sm"
            />
            <Search size={16} className="absolute left-3 top-3 text-gray-400" />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm">
                <th className="px-6 py-4 font-medium">Document No</th>
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Type</th>
                <th className="px-6 py-4 font-medium">Amount</th>
                <th className="px-6 py-4 font-medium">Payment</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-company-border">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredDocs.map((doc: any) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-company-blue">
                    {doc.document_number || 'DRAFT'}
                  </td>
                  <td className="px-6 py-4">{doc.customer_name}</td>
                  <td className="px-6 py-4">{doc.date}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                      doc.doc_type === 'BILL' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {doc.doc_type === 'BILL' ? 'TAX INVOICE' : 'PROFORMA'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">₹{doc.total_amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      doc.payment_status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 
                      doc.payment_status === 'UNPAID' ? 'bg-red-100 text-red-700' : 
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {doc.payment_status}
                      {doc.payment_status === 'PARTIAL' && ` (₹${doc.amount_received})`}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      doc.status === 'ISSUED' ? 'bg-green-100 text-green-700' : 
                      doc.status === 'DRAFT' ? 'bg-gray-100 text-gray-700' : 
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => openPaymentModal(doc)} className="p-2 text-company-blue hover:bg-blue-50 rounded-lg transition-colors" title="Update Payment Status">
                        <IndianRupee size={16} />
                      </button>
                      <button onClick={() => handleDownload(doc.id, doc.document_number)} className="p-2 text-company-charcoal hover:bg-gray-200 rounded-lg transition-colors" title="Download PDF">
                        <Download size={16} />
                      </button>
                      <button onClick={() => handleDelete(doc.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Document">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredDocs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No documents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Update Modal */}
      {selectedDoc && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-company-navy">
                Update Payment Status
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Document {selectedDoc.document_number || 'DRAFT'}
              </p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select 
                  value={paymentStatus}
                  onChange={(e) => {
                    const status = e.target.value;
                    setPaymentStatus(status);
                    if (status === 'PAID') {
                      setAmountReceived(selectedDoc.total_amount);
                    } else if (status === 'UNPAID') {
                      setAmountReceived(0);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none"
                >
                  <option value="UNPAID">Unpaid</option>
                  <option value="PARTIAL">Partially Paid</option>
                  <option value="PAID">Paid</option>
                </select>
              </div>
              
              {paymentStatus === 'PARTIAL' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received (₹)</label>
                  <input 
                    type="number" 
                    min="0" 
                    max={selectedDoc.total_amount}
                    step="0.01" 
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">Total Bill: ₹{selectedDoc.total_amount.toLocaleString()}</p>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
              <button 
                onClick={closePaymentModal}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={updating}
              >
                Cancel
              </button>
              <button 
                onClick={handlePaymentUpdate}
                disabled={updating}
                className="px-4 py-2 bg-company-blue text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>{updating ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default History;
