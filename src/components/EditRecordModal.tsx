import React, { useState } from 'react';
import { X, Save, ShieldAlert } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

export default function EditRecordModal({ account, type, onClose, onSave }: any) {
  const [formData, setFormData] = useState({
    status: 'Uncompleted',
    ...account,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      let table = 'fb_accounts';
      if (type === 'gmail') table = 'gmail_accounts';
      if (type === 'supabase') table = 'supabase_accounts';
      if (type === 'github') table = 'github_accounts';
      if (type === 'special_fb') table = 'special_fb_accounts';
      if (type === 'special_gmail') table = 'special_gmail_accounts';
      if (type === 'contact') table = 'contact_numbers';
      if (type === 'brevo') table = 'brevo_accounts';
      if (type === 'vercel') table = 'vercel_accounts';
      if (type === 'project') table = 'projects';

      // Clean metadata before sending
      const dataToSave = { ...formData };
      delete dataToSave.created_at;

      const { error: dbError } = await supabase.from(table).update(dataToSave).eq('id', account.id);
      
      if (dbError) throw dbError;
      
      onSave(dataToSave);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const excludeFields = ['id', 'created_at'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col font-sans max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Edit Record</h2>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
              Modifying {type.toUpperCase().replace('_', ' ')} Entry
            </p>
          </div>
          <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 hover:border-slate-700 border border-transparent rounded transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded flex items-center mb-4">
              <ShieldAlert className="w-5 h-5 mr-3 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Status Field */}
            <div className="flex flex-col gap-1.5 sm:col-span-2 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
              <label className="text-[10px] font-bold text-teal-400 uppercase tracking-widest pl-1">
                Account Status (Complete / Uncompleted)
              </label>
              <select
                name="status"
                value={formData.status || 'Uncompleted'}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-sm font-semibold focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 font-sans"
              >
                <option value="Uncompleted">Uncompleted</option>
                <option value="Complete">Complete</option>
              </select>
            </div>

            {Object.keys(account).map((key) => {
              if (excludeFields.includes(key) || key === 'status') return null;
              
              const isNote = key === 'note';
              const isPassword = key.includes('password') || key.includes('pass') || key.includes('code');

              return (
                <div key={key} className={cn("flex flex-col gap-1.5", isNote ? "sm:col-span-2" : "")}>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest pl-1">
                    {key.replace(/_/g, ' ')}
                  </label>
                  {isNote ? (
                    <textarea
                      name={key}
                      value={formData[key] || ''}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none resize-none text-slate-100 font-sans"
                    />
                  ) : (
                    <input
                      type={isPassword ? 'text' : 'text'}
                      name={key}
                      value={formData[key] || ''}
                      onChange={handleChange}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none text-slate-100 font-sans"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex justify-end shrink-0">
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors text-sm font-semibold mr-4"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded font-medium text-sm transition-colors"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
