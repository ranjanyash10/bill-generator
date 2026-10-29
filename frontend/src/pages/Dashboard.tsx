import React, { useEffect, useState } from 'react';
import { FileText, FileCheck, IndianRupee, Clock } from 'lucide-react';
import api from '../services/api';

const StatCard = ({ title, value, icon: Icon, colorClass }: any) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-company-border flex items-center space-x-4">
    <div className={`p-3 rounded-lg ${colorClass}`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <h3 className="text-2xl font-bold text-company-navy">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/documents/dashboard');
        setStats(response.data);
      } catch (err) {
        console.error("Failed to load dashboard stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-gray-500">Loading dashboard...</div>;
  if (!stats) return <div className="text-red-500">Failed to load dashboard data.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-company-navy">Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Documents" 
          value={stats.total_documents} 
          icon={FileText} 
          colorClass="bg-blue-100 text-blue-600" 
        />
        <StatCard 
          title="Proforma Invoices" 
          value={stats.receipts_issued} 
          icon={FileCheck} 
          colorClass="bg-green-100 text-green-600" 
        />
        <StatCard 
          title="Amount Received" 
          value={`₹${stats.total_received.toLocaleString()}`} 
          icon={IndianRupee} 
          colorClass="bg-emerald-100 text-emerald-600" 
        />
        <StatCard 
          title="Outstanding" 
          value={`₹${stats.outstanding_amount.toLocaleString()}`} 
          icon={Clock} 
          colorClass="bg-orange-100 text-orange-600" 
        />
      </div>

      <div className="mt-8 bg-white rounded-xl shadow-sm border border-company-border overflow-hidden">
        <div className="p-6 border-b border-company-border">
          <h2 className="text-lg font-semibold text-company-charcoal">Recent Documents</h2>
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
              </tr>
            </thead>
            <tbody className="divide-y divide-company-border">
              {stats.recent_documents.map((doc: any) => (
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
                </tr>
              ))}
              {stats.recent_documents.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No documents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
