import React, { useState } from 'react';
import { X, Download, FileText, Image as ImageIcon, Eye, EyeOff, Copy, Check } from 'lucide-react';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    const dataUrl = await toPng(el, { 
      pixelRatio: 3, 
      backgroundColor: '#0f172a',
      filter: (node: any) => {
        return !node.classList?.contains('export-hide');
      }
    });
    const link = document.createElement('a');
    link.download = `${filenameBase}.png`;
    link.href = dataUrl;
    link.click();
  };

  const metadataFields = ['creation_date', 'update_date', 'dob'];

  const exportPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    
    // Top Banner Background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 210, 42, 'F');
    
    // Accent Line
    doc.setFillColor(79, 70, 229); // indigo-600
    doc.rect(0, 40, 210, 2, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('AKTI DB - OFFICIAL ACCOUNT RECORD', 14, 18);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(203, 213, 225);
    doc.text(`Category: ${type.toUpperCase().replace('_', ' ')} | Account Record ID: ${account.name || account.email || 'N/A'}`, 14, 26);
    doc.setTextColor(148, 163, 184);
    doc.text(`Generated Date: ${format(new Date(), 'PPpp')} | Issue by : Ali Hosen | Status: ${(account.status || 'Uncompleted').toUpperCase()}`, 14, 33);
    
    let currentY = 50;

    // Primary Summary Box
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(14, currentY, 182, 24, 3, 3, 'FD');

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(account.name || 'Unnamed Account', 20, currentY + 9);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Primary Contact: ${account.email || account.phone || 'No direct contact'} | Status: ${account.status || 'Uncompleted'}`, 20, currentY + 17);

    currentY += 32;

    // Primary Login Credentials Table (Includes both Email and Password in plain text)
    if (account.email || account.password || account.phone || account.username) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text('Primary Login Credentials', 14, currentY);
      currentY += 4;

      const credHead = [['Credential Field', 'Stored Value']];
      const credBody = [
        account.name ? ['Account Name', String(account.name)] : null,
        account.email ? ['Email Address', String(account.email)] : null,
        account.username ? ['Username / Handle', String(account.username)] : null,
        account.password ? ['Account Password', String(account.password)] : null,
        account.phone ? ['Phone Number', String(account.phone)] : null,
        account.two_fa || account.two_factor_secret ? ['2FA Secret Code', String(account.two_fa || account.two_factor_secret)] : null,
        account.recovery_email ? ['Recovery Email', String(account.recovery_email)] : null,
        account.recovery_phone ? ['Recovery Phone', String(account.recovery_phone)] : null,
      ].filter(Boolean) as string[][];

      autoTable(doc, {
        startY: currentY,
        head: credHead,
        body: credBody,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
        columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' }, 1: { cellWidth: 132 } },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // All Other Fields Table
    const excludeKeys = ['id', 'user_id', 'name', 'email', 'username', 'password', 'phone', 'two_fa', 'two_factor_secret', 'recovery_email', 'recovery_phone', 'note', 'status'];
    const otherEntries = Object.entries(getVisibleData()).filter(([k]) => !excludeKeys.includes(k) && account[k]);

    if (otherEntries.length > 0) {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text('Security & Additional Attributes', 14, currentY);
      currentY += 4;

      const otherBody = otherEntries.map(([k, v]) => {
        let valStr = String(v || '-');
        if (metadataFields.includes(k) && v) {
          try {
            valStr = format(new Date(v as string), 'PPP');
          } catch (e) {
            valStr = String(v);
          }
        }
        return [k.replace(/_/g, ' ').toUpperCase(), valStr];
      });

      autoTable(doc, {
        startY: currentY,
        head: [['Attribute Key', 'Attribute Details']],
        body: otherBody,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
        bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59] },
        columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' }, 1: { cellWidth: 132 } },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;
    }

    // Notes Section
    if (account.note) {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(79, 70, 229);
      doc.text('Additional Account Notes', 14, currentY);
      currentY += 6;

      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);

      const splitNotes = doc.splitTextToSize(String(account.note), 176);
      const noteBoxHeight = Math.max(16, splitNotes.length * 5 + 6);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, currentY, 182, noteBoxHeight, 2, 2, 'FD');

      doc.text(splitNotes, 18, currentY + 6);
      currentY += noteBoxHeight + 10;
    }

    // Issue By Block
    if (currentY > 255) {
      doc.addPage();
      currentY = 20;
    }
    currentY += 4;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(79, 70, 229);
    doc.text('Issue by : Ali Hosen', 14, currentY);

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Akti DB Command Center — Strictly Confidential | Issue by : Ali Hosen', 14, 287);
      doc.text(`Page ${i} of ${pageCount}`, 175, 287);
    }

    doc.save(`${filenameBase}.pdf`);
  };

  const fields = Object.entries(getVisibleData()).filter(([k]) => k !== 'password');
  const sensitiveFields = ['two_fa', 'two_fa_code', 'master_password', 'secret_answer', 'db_pass', 'recovery_code', 'nid_number', 'pass_number', 'anon_key', 'phone', 'email', 'api_key', 'smtp_key', 'token'];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col font-sans max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-800 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-slate-100">Account Details</h2>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
              {type === 'fb' ? 'Facebook Entry' : 
               type === 'gmail' ? 'Gmail Entry' : 
               type === 'supabase' ? 'Supabase Entry' : 
               type === 'special_fb' ? 'Special FB Entry' :
               type === 'special_gmail' ? 'Special Gmail Entry' :
               type === 'contact' ? 'Contact Entry' :
               type === 'brevo' ? 'Brevo Entry' :
               type === 'vercel' ? 'Vercel Entry' :
               'Github Entry'}
            </p>
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
             <button onClick={exportCSV} title="Export CSV" className="p-2.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 hover:border-slate-700 border border-transparent rounded transition-all">
               <Download className="w-4 h-4" />
             </button>
             <button onClick={exportIMG} title="Export Image" className="p-2.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 hover:border-slate-700 border border-transparent rounded transition-all">
               <ImageIcon className="w-4 h-4" />
             </button>
             <button onClick={exportPDF} title="Export PDF" className="p-2.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 hover:border-slate-700 border border-transparent rounded transition-all">
               <FileText className="w-4 h-4" />
             </button>
             <div className="h-6 w-px bg-slate-800 mx-2"></div>
             <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 hover:border-slate-700 border border-transparent rounded transition-all">
               <X className="w-5 h-5" />
             </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="overflow-y-auto flex-1 p-0 sm:p-6 bg-slate-950 relative">
          {/* Print Area */}
          <div id="account-details-print-area" className="bg-slate-900 sm:rounded-xl sm:border sm:border-slate-800 sm:shadow-sm p-6 sm:p-8">
            <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start pb-6 border-b border-slate-800 gap-4">
               <div>
                 <h1 className="text-2xl font-bold text-slate-100">{account.name || 'Unnamed Account'}</h1>
                 <p className="text-sm font-medium text-slate-400 mt-1">{account.email || account.phone || 'No direct contact'}</p>
               </div>
               <div className="text-left sm:text-right flex items-center gap-2">
                  <span className={cn("inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border", 
                    (account.status === 'Complete') 
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                      : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                  )}>
                    {account.status || 'Uncompleted'}
                  </span>

                  <span className={cn("inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border", 
                    type === 'fb' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                    type === 'gmail' ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
                    type === 'supabase' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                    type === 'special_fb' || type === 'special_gmail' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                    type === 'contact' ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                    type === 'brevo' ? "bg-teal-500/10 text-teal-400 border-teal-500/20" :
                    type === 'vercel' ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                    "bg-violet-500/10 text-violet-400 border-violet-500/20"
                  )}>
                    {type.toUpperCase().replace('_', ' ')}
                  </span>
               </div>
            </div>

            {account.password && (
              <div className="mb-8 p-5 bg-rose-950/30 border border-rose-900/50 rounded-lg shadow-sm">
                 <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-3">Account Password</p>
                 <div className="flex items-center justify-between">
                   <span className="font-mono text-xl sm:text-2xl font-bold text-slate-100 tracking-wider">
                     {showPassword ? account.password : '••••••••••••'}
                   </span>
                   <div className="flex items-center space-x-2 export-hide">
                     <button
                        onClick={() => handleCopy(account.password, 'main_password')}
                        className={cn("p-2 bg-slate-800 rounded-md shadow-sm border transition-colors export-hide", 
                           copiedField === 'main_password' ? "border-emerald-500/50 text-emerald-400" : "border-slate-700 text-slate-400 hover:text-slate-200"
                        )}
                        title="Copy Password"
                      >
                        {copiedField === 'main_password' ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-rose-400 hover:text-rose-300 p-2 bg-slate-800 rounded-md shadow-sm border border-slate-700 transition-colors export-hide"
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
                  <div key={key} className="flex flex-col border-b border-slate-800 pb-3 group">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{displayKey}</span>
                    <div className="flex justify-between items-center">
                      <span className={cn("text-sm break-words flex-1", isSensitive ? "font-mono font-bold text-slate-200" : "font-semibold text-slate-200")}>{displayValue}</span>
                      {isSensitive && (
                        <button
                          onClick={() => handleCopy(String(value), key)}
                          className={cn("p-1.5 rounded-md transition-all ml-2 export-hide", 
                            copiedField === key ? "text-emerald-400 bg-emerald-500/10" : "text-slate-500 hover:text-slate-300 hover:bg-slate-800 opacity-0 group-hover:opacity-100"
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
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Additional Notes</span>
                <div className="text-sm text-slate-300 bg-slate-950 p-5 rounded-lg border border-slate-800 whitespace-pre-wrap leading-relaxed">
                  {account.note}
                </div>
              </div>
            )}
            
            <div className="mt-10 text-center border-t border-slate-800/80 pt-6 flex flex-col items-center justify-center gap-1">
               <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Official Master Account Record — Generated securely by Akti DB</p>
               <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">Issue by : Ali Hosen</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
