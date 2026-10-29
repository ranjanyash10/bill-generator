import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import api from '../services/api';

const Settings = () => {
  const [companySettings, setCompanySettings] = useState({
    name: '', address: '', phone: '', email: '', gstin: '', cin: ''
  });
  
  const [docSettings, setDocSettings] = useState({
    receipt_prefix: '', bill_prefix: '', numbering_format: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [compRes, docRes] = await Promise.all([
          api.get('/settings/company'),
          api.get('/settings/document')
        ]);
        setCompanySettings(compRes.data);
        setDocSettings(docRes.data);
      } catch (err) {
        console.error("Failed to fetch settings");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setCompanySettings({ ...companySettings, [e.target.name]: e.target.value });
  };

  const handleDocChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocSettings({ ...docSettings, [e.target.name]: e.target.value });
  };

  const handleSave = async (type: 'company' | 'document') => {
    setSaving(true);
    try {
      if (type === 'company') {
        await api.post('/settings/company', companySettings);
      } else {
        await api.post('/settings/document', docSettings);
      }
      alert('Settings saved successfully');
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <h1 className="text-2xl font-bold text-company-navy">Application Settings</h1>
      
      {/* Company Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-company-border">
        <h2 className="text-lg font-semibold text-company-charcoal mb-4 border-b pb-2">Company Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <input type="text" name="name" value={companySettings.name || ''} onChange={handleCompanyChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" name="email" value={companySettings.email || ''} onChange={handleCompanyChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <input type="text" name="phone" value={companySettings.phone || ''} onChange={handleCompanyChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN</label>
            <input type="text" name="gstin" value={companySettings.gstin || ''} onChange={handleCompanyChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CIN</label>
            <input type="text" name="cin" value={companySettings.cin || ''} onChange={handleCompanyChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Registered Address</label>
            <textarea name="address" rows={2} value={companySettings.address || ''} onChange={handleCompanyChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none"></textarea>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={() => handleSave('company')} disabled={saving} className="flex items-center space-x-2 px-4 py-2 bg-company-blue text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Save size={18} /> <span>Save Company Settings</span>
          </button>
        </div>
      </div>

      {/* Document Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-company-border">
        <h2 className="text-lg font-semibold text-company-charcoal mb-4 border-b pb-2">Document Numbering</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Receipt Prefix</label>
            <input type="text" name="receipt_prefix" value={docSettings.receipt_prefix || ''} onChange={handleDocChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bill Prefix</label>
            <input type="text" name="bill_prefix" value={docSettings.bill_prefix || ''} onChange={handleDocChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none" />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Numbering Format</label>
            <input type="text" name="numbering_format" value={docSettings.numbering_format || ''} onChange={handleDocChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-company-blue outline-none" placeholder="e.g. {prefix}-{year}-{sequence}" />
            <p className="text-xs text-gray-500 mt-1">Available variables: {'{prefix}, {year}, {sequence}'}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button onClick={() => handleSave('document')} disabled={saving} className="flex items-center space-x-2 px-4 py-2 bg-company-blue text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Save size={18} /> <span>Save Document Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
