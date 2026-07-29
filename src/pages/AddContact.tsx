import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Phone, UserCircle } from 'lucide-react';

export default function AddContact() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', organization: '',
    address: '', group_name: '', purpose: '', status: 'Uncompleted',
    creation_date: '', note: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Add current date for update_date
    const finalData = { ...formData, update_date: new Date().toISOString().split('T')[0] };

    const { error } = await supabase.from('contact_numbers').insert([finalData]);
    
    setLoading(false);
    if (error) {
      alert('Error inserting record: ' + error.message);
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/search'), 1500);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900 rounded-xl border border-slate-800 shadow-sm mt-8 mx-auto max-w-sm text-center">
        <CheckCircle2 className="w-12 h-12 text-amber-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-100 uppercase">Saved Successfully!</h2>
        <p className="text-slate-400 mt-2 text-sm">The contact has been added to your database.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex flex-col h-full font-sans">
      <div className="flex justify-between items-center bg-slate-900 border-b border-amber-200 px-4 md:px-8 py-4 -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-4 shrink-0">
        <div className="flex items-center space-x-2 text-amber-400">
          <UserCircle className="w-5 h-5 font-bold" />
          <h1 className="text-xs font-bold uppercase tracking-wider">Add Contact Number</h1>
        </div>
      </div>

      <div className="bg-slate-900 border border-amber-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-[300px]">
        <div className="flex-1 overflow-y-auto scroll-hide p-4 md:p-8">
          <form id="add-contact-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            <div className="col-span-full text-xs font-bold uppercase tracking-widest text-amber-400 mb-2 border-b border-amber-100 pb-2">Primary Details</div>
            
            <div className="col-span-1 sm:col-span-2 lg:col-span-1">
              <Field label="Full Name" name="name" value={formData.name} onChange={handleChange} required />
            </div>
            <Field label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} required />
            <Field label="Email Address" name="email" value={formData.email} onChange={handleChange} type="email" />
            
            <div className="col-span-full mt-4 text-xs font-bold uppercase tracking-widest text-amber-400 mb-2 border-b border-amber-100 pb-2">Additional Info</div>
            <Field label="Organization / Company" name="organization" value={formData.organization} onChange={handleChange} />
            <Field label="Group or Category" name="group_name" value={formData.group_name} onChange={handleChange} />
            <Field label="Creation Date" name="creation_date" value={formData.creation_date} onChange={handleChange} type="date" />
            
            <div className="col-span-full space-y-1.5 flex flex-col">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter block">Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-800 rounded text-sm focus:ring-1 focus:ring-amber-500 outline-none text-slate-100 bg-slate-900 font-sans"
              />
            </div>

            <div className="col-span-full text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 mt-4 border-b border-slate-800 pb-2">Status & Metadata</div>
            <div className="col-span-full grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 flex flex-col relative w-full">
                <label className="text-[11px] font-bold text-teal-400 uppercase tracking-tighter block">Account Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-700 rounded text-sm font-semibold focus:ring-1 focus:ring-amber-500 outline-none text-slate-100 bg-slate-900 font-sans"
                >
                  <option value="Uncompleted">Uncompleted</option>
                  <option value="Complete">Complete</option>
                </select>
              </div>
              <Field label="Purpose" name="purpose" value={formData.purpose} onChange={handleChange} />
            </div>

            <div className="col-span-full space-y-1.5 mt-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter block">Additional Notes</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-slate-800 rounded text-sm focus:ring-1 focus:ring-amber-500 outline-none resize-none font-sans bg-amber-50/10"
                placeholder="Any special remarks or details..."
              />
            </div>
          </form>
        </div>
        
        <div className="p-6 border-t border-amber-100 flex items-center justify-end bg-amber-50/50">
          <button
            type="submit"
            form="add-contact-form"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-bold text-white bg-amber-500 rounded shadow hover:bg-amber-600 transition-colors uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:opacity-50 flex items-center"
          >
            <Phone className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", required = false }: any) {
  return (
    <div className="space-y-1.5 flex flex-col w-full">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter block">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full px-3 py-2 border border-slate-800 rounded text-sm focus:ring-1 focus:ring-amber-500 outline-none text-slate-100 bg-slate-900 font-sans"
      />
    </div>
  );
}
