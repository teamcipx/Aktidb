import React, { useState } from 'react';
import { X, Download, FileText, Image as ImageIcon, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function AccountDetailsModal({ account, type, onClose }: any) {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  if (!account) return null;

  const handleCopy = (value: string, fieldName: string) => {
    navigator.clipboard.writeText(value);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getVisibleData = () => {
    // Return all fields except internal ones
    const data = { ...account };
    delete data.id;
    return data;
  };

  const ts = format(new Date(), 'yyyy-MM-dd-HHmm');
  const filenameBase = `akti_${type}_${account.name ? account.name.replace(/\s+/g, '_') : 'account'}_${ts}`;

  const exportCSV = () => {
    const data = getVisibleData();
    const rows = [
      Object.keys(data).join(','),
      Object.values(data).map(v => `"${String(v || '').replace(/"/g, '""')}"`).join(',')
    ];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filenameBase}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportIMG = async () => {
    const el = document.getElementById('account-details-print-area');
    if (!el) return;
    const dataUrl = await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff' });
    const link = document.createElement('a');
    link.download = `${filenameBase}.png`;
    link.href = dataUrl;
    link.click();
  };

  const exportPDF = async () => {
    const el = document.getElementById('account-details-print-area');
    if (!el) return;
    const imgData = await toPng(el, { pixelRatio: 2, backgroundColor: '#ffffff' });
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (el.offsetHeight * pdfWidth) / el.offsetWidth;
    
    // Add white background
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pdfWidth, pdf.internal.pageSize.getHeight(), 'F');
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${filenameBase}.pdf`);
  };

  const fields = Object.entries(getVisibleData()).filter(([k]) => k !== 'password');
  const metadataFields = ['creation_date', 'update_date', 'dob'];
  const sensitiveFields = ['two_fa', 'two_fa_code', 'master_password', 'secret_answer', 'db_pass', 'recovery_code', 'nid_number', 'pass_number', 'anon_key', 'phone', 'email'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col font-sans max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Account Details</h2>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
              {type === 'fb' ? 'Facebook Entry' : 
               type === 'gmail' ? 'Gmail Entry' : 
               type === 'supabase' ? 'Supabase Entry' : 
               type === 'special_fb' ? 'Special FB Entry' :
               type === 'special_gmail' ? 'Special Gmail Entry' :
               type === 'contact' ? 'Contact Entry' :
               'Github Entry'}
            </p>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
             <button onClick={exportCSV} title="Export CSV" className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 border border-transparent rounded transition-all">
               <Download className="w-4 h-4" />
             </button>
             <button onClick={exportIMG} title="Export Image" className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 border border-transparent rounded transition-all">
               <ImageIcon className="w-4 h-4" />
             </button>
             <button onClick={exportPDF} title="Export PDF" className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 border border-transparent rounded transition-all">
               <FileText className="w-4 h-4" />
             </button>
             <div className="h-6 w-px bg-slate-200 mx-2"></div>
             <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-100 border border-transparent rounded transition-all">
               <X className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-1 p-0 sm:p-6 bg-slate-50 relative">
          {/* Print Area - Has white background and explicit padding for captured image layout */}
          <div id="account-details-print-area" className="bg-white sm:rounded-xl sm:border sm:border-slate-200 sm:shadow-sm p-6 sm:p-8">
            <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start pb-6 border-b border-slate-100 gap-4">
               <div>
                 <h1 className="text-2xl font-bold text-slate-900">{account.name || 'Unnamed Account'}</h1>
                 <p className="text-sm font-medium text-slate-500 mt-1">{account.email || account.phone || 'No direct contact'}</p>
               </div>
               <div className="text-left sm:text-right">
                  <span className={cn("inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border", 
                    type === 'fb' ? "bg-indigo-50 text-indigo-700 border-indigo-100" :
                    type === 'gmail' ? "bg-sky-50 text-sky-700 border-sky-100" :
                    type === 'supabase' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                    type === 'special_fb' || type === 'special_gmail' ? "bg-rose-50 text-rose-700 border-rose-100" :
                    type === 'contact' ? "bg-amber-50 text-amber-700 border-amber-100" :
                    "bg-violet-50 text-violet-700 border-violet-100"
                  )}>
                    {type.toUpperCase().replace('_', ' ')}
                  </span>
               </div>
            </div>

            {account.password && (
              <div className="mb-8 p-5 bg-rose-50 border border-rose-100 rounded-lg shadow-sm">
                 <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-3">Account Password</p>
                 <div className="flex items-center justify-between">
                   <span className="font-mono text-xl sm:text-2xl font-bold text-slate-800 tracking-wider">
                     {showPassword ? account.password : '••••••••••••'}
                   </span>
                   <div className="flex items-center space-x-2">
                     <button
                        onClick={() => handleCopy(account.password, 'main_password')}
                        className={cn("p-2 bg-white rounded-md shadow-sm border transition-colors", 
                           copiedField === 'main_password' ? "border-emerald-200 text-emerald-600" : "border-rose-100 text-slate-400 hover:text-slate-600"
                        )}
                        title="Copy Password"
                     >
                        {copiedField === 'main_password' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                     </button>
                     <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-rose-500 hover:text-rose-700 p-2 bg-white rounded-md shadow-sm border border-rose-100 transition-colors"
                        title={showPassword ? "Hide password" : "Show password"}
                      >
                       {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                     </button>
                   </div>
                 </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              {fields.map(([key, value]) => {
                const displayKey = key.replace(/_/g, ' ');
                let displayValue = String(value || '-');
                if (metadataFields.includes(key) && value) {
                   displayValue = format(new Date(value as string), 'PPP');
                }
                const isSensitive = sensitiveFields.includes(key) && value;

                return (
                  <div key={key} className="flex flex-col border-b border-slate-100 pb-3 group">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{displayKey}</span>
                    <div className="flex justify-between items-center">
                      <span className={cn("text-sm break-words flex-1", isSensitive ? "font-mono font-bold text-slate-800" : "font-semibold text-slate-800")}>{displayValue}</span>
                      {isSensitive && (
                        <button
                          onClick={() => handleCopy(String(value), key)}
                          className={cn("p-1.5 rounded-md transition-all ml-2", 
                            copiedField === key ? "text-emerald-600 bg-emerald-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 opacity-0 group-hover:opacity-100"
                          )}
                          title="Copy"
                        >
                          {copiedField === key ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {account.note && (
              <div className="mt-8 pt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Additional Notes</span>
                <div className="text-sm text-slate-700 bg-slate-50 p-5 rounded-lg border border-slate-100 whitespace-pre-wrap leading-relaxed">
                  {account.note}
                </div>
              </div>
            )}
            
            <div className="mt-10 text-center">
               <p className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Generated securely by Akti DB</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
