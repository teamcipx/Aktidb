import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ShieldAlert, Eye, EyeOff } from 'lucide-react';

export default function AddSpecialFb() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', country: '',
    purpose: '', link: '', two_fa: '', two_fa_code: '',
    security: '', creation_date: '', dob: '', note: '',
    recovery_email: '', recovery_phone: '', mother_name: '',
    primary_device: '', primary_location: '', master_password: '',
    secret_question: '', secret_answer: '', nid_number: '', pass_number: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Add current date for update_date
    const finalData = { ...formData, update_date: new Date().toISOString().split('T')[0] };

    const { error } = await supabase.from('special_fb_accounts').insert([finalData]);
    
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
        <CheckCircle2 className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-100 uppercase">Saved Successfully!</h2>
        <p className="text-slate-400 mt-2 text-sm">The Special FB account has been secured.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex flex-col h-full font-sans">
      <div className="flex justify-between items-center bg-slate-900 border-b border-rose-200 px-4 md:px-8 py-4 -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-4 shrink-0">
        <div className="flex items-center space-x-2 text-rose-400">
          <ShieldAlert className="w-5 h-5 font-bold" />
          <h1 className="text-xs font-bold uppercase tracking-wider">Add Special FB (High Security)</h1>
        </div>
      </div>

      <div className="bg-slate-900 border border-rose-200 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-[300px]">
        <div className="flex-1 overflow-y-auto scroll-hide p-4 md:p-8">
          <form id="special-fb-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            <div className="col-span-full text-xs font-bold uppercase tracking-widest text-rose-400 mb-2 border-b border-rose-100 pb-2">Primary Identity</div>
            <Field label="Account Name" name="name" value={formData.name} onChange={handleChange} required />
            <Field label="Email Address" name="email" value={formData.email} onChange={handleChange} type="email" />
            <Field label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
            <Field label="Password" name="password" value={formData.password} onChange={handleChange} type="password" required />
            <Field label="Country" name="country" value={formData.country} onChange={handleChange} />
            <Field label="Date of Birth" name="dob" value={formData.dob} onChange={handleChange} type="date" />
            
            <div className="col-span-full mt-4 text-xs font-bold uppercase tracking-widest text-rose-400 mb-2 border-b border-rose-100 pb-2">High Security & Recovery</div>
            <Field label="Recovery Email" name="recovery_email" value={formData.recovery_email} onChange={handleChange} type="email" />
            <Field label="Recovery Phone" name="recovery_phone" value={formData.recovery_phone} onChange={handleChange} />
            <Field label="Master Password" name="master_password" value={formData.master_password} onChange={handleChange} type="password" />
            <Field label="Secret Question" name="secret_question" value={formData.secret_question} onChange={handleChange} />
            <Field label="Secret Answer" name="secret_answer" value={formData.secret_answer} onChange={handleChange} type="password" />
            <Field label="Mother's Name" name="mother_name" value={formData.mother_name} onChange={handleChange} />
            
            <div className="col-span-full mt-4 text-xs font-bold uppercase tracking-widest text-rose-400 mb-2 border-b border-rose-100 pb-2">Device & Location Auth</div>
            <Field label="Primary Device" name="primary_device" value={formData.primary_device} onChange={handleChange} />
            <Field label="Primary Location" name="primary_location" value={formData.primary_location} onChange={handleChange} />
            <Field label="2FA Key" name="two_fa" value={formData.two_fa} onChange={handleChange} />
            <Field label="Recovery Code (2FA)" name="two_fa_code" value={formData.two_fa_code} onChange={handleChange} type="password" />
            
            <div className="col-span-full mt-4 text-xs font-bold uppercase tracking-widest text-rose-400 mb-2 border-b border-rose-100 pb-2">Physical Identities</div>
            <Field label="NID Number" name="nid_number" value={formData.nid_number} onChange={handleChange} />
            <Field label="Passport Number" name="pass_number" value={formData.pass_number} onChange={handleChange} />

            <div className="col-span-full mt-4 text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 border-b border-slate-800 pb-2">Status & Metadata</div>
            <Field label="Purpose" name="purpose" value={formData.purpose} onChange={handleChange} />
            <Field label="Account Link" name="link" value={formData.link} onChange={handleChange} />
            <Field label="Security Log" name="security" value={formData.security} onChange={handleChange} />
            <Field label="Creation Date" name="creation_date" value={formData.creation_date} onChange={handleChange} type="date" />

            <div className="col-span-full space-y-1.5 mt-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Highly Sensitive Note</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-slate-800 rounded text-sm focus:ring-1 focus:ring-rose-500 outline-none resize-none font-sans bg-rose-50/30"
                placeholder="Encrypted details or sensitive logs..."
              />
            </div>
          </form>
        </div>
        
        <div className="p-6 border-t border-rose-100 flex items-center justify-end bg-rose-50/50">
          <button
            type="submit"
            form="special-fb-form"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-bold text-white bg-rose-600 rounded shadow hover:bg-rose-700 transition-colors uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Securing...' : 'Secure Account'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", required = false }: any) {
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
          className={`w-full px-3 py-2 ${isPassword ? 'pr-9' : ''} border border-slate-800 rounded text-sm focus:ring-1 focus:ring-rose-500 outline-none text-slate-100 bg-slate-900 font-sans`}
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
