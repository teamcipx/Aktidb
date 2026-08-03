import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, FolderKanban, Eye, EyeOff, Globe, Github, Triangle, Database, Sparkles, Send, Mail, Lock } from 'lucide-react';

export default function AddProject() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    link: '',
    brevo_account: '',
    github_repo: '',
    vercel_account: '',
    supabase_details: '',
    ai_studio_details: '',
    admin_email: '',
    admin_password: '',
    purpose: '',
    status: 'Uncompleted',
    note: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from('projects').insert([formData]);
    
    setLoading(false);
    if (error) {
      alert('Error inserting record: ' + error.message + '\n\nPlease ensure you executed the SQL update in supabase_schema.sql.');
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/search'), 1500);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-900 rounded-xl border border-slate-800 shadow-sm mt-8 mx-auto max-w-sm text-center">
        <CheckCircle2 className="w-12 h-12 text-indigo-500 mb-4" />
        <h2 className="text-xl font-bold text-slate-100 uppercase">Project Saved!</h2>
        <p className="text-slate-400 mt-2 text-sm">The Project entry has been successfully created.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 flex flex-col h-full font-sans">
      <div className="flex justify-between items-center bg-slate-900 border-b border-slate-800 px-4 md:px-8 py-4 -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-4 shrink-0">
        <div className="flex items-center space-x-2 text-indigo-400">
          <FolderKanban className="w-5 h-5 font-bold" />
          <h1 className="text-xs font-bold uppercase tracking-wider">Add New Project</h1>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-[300px]">
        <div className="flex-1 overflow-y-auto scroll-hide p-4 md:p-8">
          <form id="project-form" onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5">
            
            {/* General Project Info */}
            <div className="col-span-full text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              <span>Project Core & Overview</span>
            </div>
            <Field label="Project Name *" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. E-Commerce Master Suite" />
            <Field label="Live Project Link / URL" name="link" value={formData.link} onChange={handleChange} placeholder="https://my-app.vercel.app" icon={Globe} />
            <Field label="Purpose / Tag" name="purpose" value={formData.purpose} onChange={handleChange} placeholder="SaaS, Mobile App, Portfolio..." />

            {/* Cloud & Dev Credentials */}
            <div className="col-span-full mt-4 text-xs font-bold uppercase tracking-widest text-teal-400 mb-2 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Triangle className="w-4 h-4" />
              <span>Connected Infrastructure & Services</span>
            </div>
            <Field label="Brevo Account Name" name="brevo_account" value={formData.brevo_account} onChange={handleChange} placeholder="brevo-prod-account@domain.com" icon={Send} />
            <Field label="GitHub Repo / Account" name="github_repo" value={formData.github_repo} onChange={handleChange} placeholder="github.com/username/repo-name" icon={Github} />
            <Field label="Vercel Account / App" name="vercel_account" value={formData.vercel_account} onChange={handleChange} placeholder="Vercel Team / Pro Account" icon={Triangle} />
            <Field label="Supabase DB Details" name="supabase_details" value={formData.supabase_details} onChange={handleChange} placeholder="Project Ref / DB URL" icon={Database} />
            <Field label="AI Studio Details" name="ai_studio_details" value={formData.ai_studio_details} onChange={handleChange} placeholder="Gemini API Key / Applet ID / Prompt" icon={Sparkles} />
            
            {/* Admin Credentials */}
            <div className="col-span-full mt-4 text-xs font-bold uppercase tracking-widest text-rose-400 mb-2 border-b border-slate-800 pb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span>Project Admin Credentials</span>
            </div>
            <Field label="Admin Email" name="admin_email" value={formData.admin_email} onChange={handleChange} type="email" placeholder="admin@project-domain.com" icon={Mail} />
            <Field label="Admin Password" name="admin_password" value={formData.admin_password} onChange={handleChange} type="password" placeholder="••••••••••••" />

            <div className="space-y-1.5 flex flex-col relative w-full">
              <label className="text-[11px] font-bold text-teal-400 uppercase tracking-tighter block">Project Status</label>
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

            {/* Note */}
            <div className="col-span-full space-y-1.5 mt-2">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Additional Documentation / Notes</label>
              <textarea
                name="note"
                value={formData.note}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none font-sans text-slate-100"
                placeholder="Any special deployment instructions, environment variables, or notes..."
              />
            </div>
          </form>
        </div>
        
        <div className="p-6 border-t border-slate-800 flex items-center justify-end bg-slate-950">
          <button
            type="submit"
            form="project-form"
            disabled={loading}
            className="px-6 py-2.5 text-sm font-bold text-white bg-indigo-600 rounded shadow hover:bg-indigo-700 transition-colors uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Project Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange, type = "text", required = false, placeholder = "", icon: Icon }: any) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className="space-y-1.5 flex flex-col relative w-full">
      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter block flex items-center gap-1.5">
        {Icon && <Icon className="w-3.5 h-3.5 text-slate-500" />}
        <span>{label}</span>
      </label>
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
