import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Github, Eye, EyeOff } from 'lucide-react';

export default function AddGithub() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', username: '', password: '', 
    two_fa: '', two_fa_code: '', purpose: '', profile_link: '', 
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

    const { error } = await supabase.from('github_accounts').insert([finalData]);
    
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
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-xl border border-slate-200 shadow-sm mt-8 mx-auto max-w-sm text-center">
        <CheckCircle2 className="w-12 h-12 text-indigo-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-900 uppercase">Saved Successfully!</h2>
        <p className="text-slate-500 mt-2 text-sm">The Github account has been added.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex flex-col h-full font-sans">
      <div className="flex justify-between items-center bg-white border-b border-slate-200 px-4 md:px-8 py-4 -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-4 shrink-0">
        <div className="flex items-center space-x-2 text-indigo-600">
          <Github className="w-5 h-5 font-bold" />
          <h1 className="text-xs font-bold uppercase tracking-wider">Add Github Account</h1>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-[300px]">
        <div className="flex-1 overflow-y-auto scroll-hide p-4 md:p-8">
          <form id="github-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            <div className="col-span-full text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-100 pb-2">Primary Information</div>
            <Field label="Display Name" name="name" value={formData.name} onChange={handleChange} required />
            <Field label="Login Email" name="email" value={formData.email} onChange={handleChange} type="email" required />
            <Field label="Username" name="username" value={formData.username} onChange={handleChange} required />
            <Field label="Login Password" name="password" value={formData.password} onChange={handleChange} type="password" required />
            
            <div className="col-span-full mt-4 text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-100 pb-2">Security</div>
            <Field label="2FA (Seed/Status)" name="two_fa" value={formData.two_fa} onChange={handleChange} type="password" />
            <Field label="Recovery Code" name="two_fa_code" value={formData.two_fa_code} onChange={handleChange} type="password" />
            
            <div className="col-span-full mt-4 text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-100 pb-2">Metadata</div>
            <Field label="Purpose" name="purpose" value={formData.purpose} onChange={handleChange} />
            <Field label="Profile Link" name="profile_link" value={formData.profile_link} onChange={handleChange} />
            <Field label="Creation Date" name="creation_date" value={formData.creation_date} onChange={handleChange} type="date" />

            <div className="col-span-full space-y-1.5 mt-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">Additional Note</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none font-sans"
                placeholder="Any extra details about this account..."
              />
            </div>
          </form>
        </div>
        
        <div className="p-6 border-t border-slate-100 flex items-center justify-end bg-slate-50/50">
          <button
            type="submit"
            form="github-form"
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
      <label className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter block">{label}</label>
      <div className="relative flex items-center w-full">
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          placeholder={placeholder}
          className={`w-full px-3 py-2 ${isPassword ? 'pr-9' : ''} border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-slate-900 bg-white font-sans`}
        />
        {isPassword && (
          <button 
            type="button" 
            onClick={() => setShow(!show)} 
            className="absolute inset-y-0 right-0 pr-3 pl-2 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
    </div>
  );
}
