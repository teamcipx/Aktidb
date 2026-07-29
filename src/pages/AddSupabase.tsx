import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Database, Eye, EyeOff } from 'lucide-react';

export default function AddSupabase() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', password: '', url: '', 
    anon_key: '', db_pass: '', purpose: '', status: 'Uncompleted', creation_date: '', note: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Add current date for update_date
    const finalData = { ...formData, update_date: new Date().toISOString().split('T')[0] };

    const { error } = await supabase.from('supabase_accounts').insert([finalData]);
    
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
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-100 uppercase">Saved Successfully!</h2>
        <p className="text-slate-400 mt-2 text-sm">The Supabase account has been added.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex flex-col h-full font-sans">
      <div className="flex justify-between items-center bg-slate-900 border-b border-slate-800 px-4 md:px-8 py-4 -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-4 shrink-0">
        <div className="flex items-center space-x-2 text-emerald-400">
          <Database className="w-5 h-5 font-bold" />
          <h1 className="text-xs font-bold uppercase tracking-wider">Add Supabase Account</h1>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-[300px]">
        <div className="flex-1 overflow-y-auto scroll-hide p-4 md:p-8">
          <form id="supabase-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            <div className="col-span-full text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-800 pb-2">Primary Information</div>
            <Field label="Project Name" name="name" value={formData.name} onChange={handleChange} required />
            <Field label="Login Email" name="email" value={formData.email} onChange={handleChange} type="email" required />
            <Field label="Login Password" name="password" value={formData.password} onChange={handleChange} type="password" required />
            
            <div className="col-span-full mt-4 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-800 pb-2">Project Credentials</div>
            <div className="col-span-full">
              <Field label="Project URL" name="url" value={formData.url} onChange={handleChange} placeholder="https://xyz.supabase.co" />
            </div>
            <div className="col-span-full">
              <Field label="Anon / Public Key" name="anon_key" value={formData.anon_key} onChange={handleChange} type="password" />
            </div>
            <Field label="Database Password" name="db_pass" value={formData.db_pass} onChange={handleChange} type="password" />
            
            <div className="col-span-full mt-4 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-800 pb-2">Metadata</div>
            <div className="space-y-1.5 flex flex-col relative w-full">
              <label className="text-[11px] font-bold text-teal-400 uppercase tracking-tighter block">Account Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-700 rounded text-sm font-semibold focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 bg-slate-950 font-sans"
              >
                <option value="Uncompleted">Uncompleted</option>
                <option value="Complete">Complete</option>
              </select>
            </div>
            <Field label="Purpose" name="purpose" value={formData.purpose} onChange={handleChange} />
            <Field label="Creation Date" name="creation_date" value={formData.creation_date} onChange={handleChange} type="date" />

            <div className="col-span-full space-y-1.5 mt-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Additional Note</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none font-sans"
                placeholder="Any extra details about this account..."
              />
            </div>
          </form>
        </div>
        
        <div className="p-6 border-t border-slate-800 flex items-center justify-end bg-slate-950">
          <button
            type="submit"
            form="supabase-form"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded shadow hover:bg-indigo-700 transition-colors uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", required = false, placeholder = "" }: any) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5 flex flex-col relative w-full">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter block">{label}</label>
      <div className="relative flex items-center w-full">
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={`w-full px-3 py-2 ${isPassword ? 'pr-9' : ''} border border-slate-700 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 bg-slate-950 font-sans`}
        />
        {isPassword && (
          <button 
            type="button" 
            onClick={() => setShow(!show)} 
            className="absolute inset-y-0 right-0 pr-3 pl-2 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
