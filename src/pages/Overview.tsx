import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database, UserPlus, Users, Search as SearchIcon, Phone, Download, FileJson, Send, Triangle, Facebook, Mail, ShieldAlert, Github, Layers, Sparkles, ArrowRight, ShieldCheck, CheckSquare, FileText, Image, FolderKanban, Terminal, Activity } from 'lucide-react';
import { logActivity, getActivityLogs, ActivityLog } from '../lib/logger';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import PdfExportModal from '../components/PdfExportModal';

export default function Overview() {
  const [fbCount, setFbCount] = useState<number | null>(null);
  const [gmailCount, setGmailCount] = useState<number | null>(null);
  const [supabaseCount, setSupabaseCount] = useState<number | null>(null);
  const [githubCount, setGithubCount] = useState<number | null>(null);
  const [specialFbCount, setSpecialFbCount] = useState<number | null>(null);
  const [specialGmailCount, setSpecialGmailCount] = useState<number | null>(null);
  const [contactCount, setContactCount] = useState<number | null>(null);
  const [brevoCount, setBrevoCount] = useState<number | null>(null);
  const [vercelCount, setVercelCount] = useState<number | null>(null);
  const [imgbbCount, setImgbbCount] = useState<number | null>(null);
  const [projectCount, setProjectCount] = useState<number | null>(null);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  useEffect(() => {
    logActivity('DASHBOARD', 'SYSTEM', 'Overview Command Center Accessed', 'User navigated to Overview Dashboard');

    async function fetchStats() {
      const { count: fb } = await supabase.from('fb_accounts').select('*', { count: 'exact', head: true });
      const { count: gmail } = await supabase.from('gmail_accounts').select('*', { count: 'exact', head: true });
      const { count: sup } = await supabase.from('supabase_accounts').select('*', { count: 'exact', head: true });
      const { count: git } = await supabase.from('github_accounts').select('*', { count: 'exact', head: true });
      const { count: specFb } = await supabase.from('special_fb_accounts').select('*', { count: 'exact', head: true });
      const { count: specGm } = await supabase.from('special_gmail_accounts').select('*', { count: 'exact', head: true });
      const { count: contact } = await supabase.from('contact_numbers').select('*', { count: 'exact', head: true });
      const { count: brevo } = await supabase.from('brevo_accounts').select('*', { count: 'exact', head: true });
      const { count: vercel } = await supabase.from('vercel_accounts').select('*', { count: 'exact', head: true });
      const { count: imgbb } = await supabase.from('imgbb_api_keys').select('*', { count: 'exact', head: true });
      const { count: project } = await supabase.from('projects').select('*', { count: 'exact', head: true });
      
      setFbCount(fb || 0);
      setGmailCount(gmail || 0);
      setSupabaseCount(sup || 0);
      setGithubCount(git || 0);
      setSpecialFbCount(specFb || 0);
      setSpecialGmailCount(specGm || 0);
      setContactCount(contact || 0);
      setBrevoCount(brevo || 0);
      setVercelCount(vercel || 0);
      setImgbbCount(imgbb || 0);
      setProjectCount(project || 0);

      const logs = await getActivityLogs(6);
      setRecentLogs(logs);

      setLoading(false);
    }
    fetchStats();
  }, []);

  const exportData = async (formatType: 'json' | 'csv' | 'pdf') => {
    if (formatType === 'pdf') {
      setIsPdfModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const tables = [
        'projects', 'fb_accounts', 'gmail_accounts', 'supabase_accounts', 
        'github_accounts', 'special_fb_accounts', 'special_gmail_accounts', 
        'contact_numbers', 'brevo_accounts', 'vercel_accounts', 'imgbb_api_keys'
      ];
      
      const responses = await Promise.all(
        tables.map(table => supabase.from(table).select('*').order('created_at', { ascending: false }))
      );
      
      const allData: Record<string, any[]> = {};
      tables.forEach((table, index) => {
        allData[table] = responses[index].data || [];
      });

      const dateStr = format(new Date(), 'yyyy-MM-dd');
      
      if (formatType === 'json') {
        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `zxhub_full_backup_${dateStr}.json`;
        link.click();
      } else if (formatType === 'csv') {
        // Find all possible headers
        const allKeys = new Set<string>();
        tables.forEach(table => {
          allData[table].forEach(row => {
            Object.keys(row).forEach(k => allKeys.add(k));
          });
        });
        const headers = ['table_source', ...Array.from(allKeys)];
        
        let csvContent = headers.join(',') + '\n';
        tables.forEach(table => {
          allData[table].forEach(row => {
            const rowValues = headers.map(header => {
              if (header === 'table_source') return `"${table}"`;
              let val = row[header];
              if (val === null || val === undefined) return '';
              return `"${String(val).replace(/"/g, '""')}"`;
            });
            csvContent += rowValues.join(',') + '\n';
          });
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `zxhub_full_backup_${dateStr}.csv`;
        link.click();
      }
    } catch (err) {
      console.error(err);
      alert('Error exporting data.');
    } finally {
      setLoading(false);
    }
  };

  const performPdfExport = async (includePassword: boolean) => {
    setLoading(true);
    try {
      const tables = [
        'projects', 'fb_accounts', 'gmail_accounts', 'supabase_accounts', 
        'github_accounts', 'special_fb_accounts', 'special_gmail_accounts', 
        'contact_numbers', 'brevo_accounts', 'vercel_accounts', 'imgbb_api_keys'
      ];
      
      const responses = await Promise.all(
        tables.map(table => supabase.from(table).select('*').order('created_at', { ascending: false }))
      );
      
      const allData: Record<string, any[]> = {};
      tables.forEach((table, index) => {
        allData[table] = responses[index].data || [];
      });

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      
      // Header Background Banner
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(0, 0, 210, 42, 'F');
      
      // Accent bar
      doc.setFillColor(79, 70, 229); // indigo-600
      doc.rect(0, 40, 210, 2, 'F');
      
      // Title text
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('AKTI DB - CLOUD & ASSET VAULT REPORT', 14, 18);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text(`Executive Master Security Report (${includePassword ? 'WITH PASSWORDS' : 'WITHOUT PASSWORDS'})`, 14, 26);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Generated Date: ${format(new Date(), 'PPpp')}  |  Issue by : Ali Hosen`, 14, 33);
      
      // Total Stats Box
      let currentY = 50;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(14, currentY, 182, 22, 3, 3, 'FD');
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Vault Executive Overview', 20, currentY + 8);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const totalCount = Object.values(allData).reduce((sum, arr) => sum + arr.length, 0);
      doc.text(`Total Protected Assets: ${totalCount} records verified. Export Mode: ${includePassword ? 'Full Credentials (Email + Password)' : 'Privacy Safe (No Passwords)'}`, 20, currentY + 16);
      
      currentY += 30;
      
      const tableLabels: Record<string, { label: string; colName: string }> = {
        projects: { label: 'Projects & Core Software Hub', colName: 'Project Name' },
        fb_accounts: { label: 'Facebook Accounts', colName: 'Account Name / ID' },
        gmail_accounts: { label: 'Gmail Accounts', colName: 'Name / ID' },
        supabase_accounts: { label: 'Supabase DB Projects', colName: 'Project Name' },
        github_accounts: { label: 'Github Repositories & Tokens', colName: 'Account / User' },
        special_fb_accounts: { label: 'Special FB (High Security)', colName: 'Account Name / ID' },
        special_gmail_accounts: { label: 'Special Gmail (High Security)', colName: 'Email / ID' },
        contact_numbers: { label: 'Emergency Contact Numbers', colName: 'Contact Name' },
        brevo_accounts: { label: 'Brevo Mail SMTP Accounts', colName: 'Account / Email' },
        vercel_accounts: { label: 'Vercel Cloud Deployments', colName: 'Team / Project' },
        imgbb_api_keys: { label: 'ImgBB API Keys Vault', colName: 'Note / Identifier' },
      };

      tables.forEach((table) => {
        const records = allData[table] || [];
        if (records.length === 0) return;
        
        const meta = tableLabels[table] || { label: table, colName: 'Primary Identifier' };
        
        if (currentY > 240) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(79, 70, 229);
        doc.text(`${meta.label} (${records.length} items)`, 14, currentY);
        currentY += 4;
        
        const head = [['#', meta.colName, 'Email / Phone', includePassword ? 'Protected Details (Email + Pass)' : 'Details (Email Only)', 'Status']];
        const body = records.map((r, i) => {
          const idCol = r.name || r.username || r.project_name || r.account_name || 'N/A';
          const emailOrPhone = r.email || r.phone || '-';
          
          const detailsArr = [
            r.email ? `Email: ${r.email}` : '',
            (includePassword && r.password) ? `Pass: ${r.password}` : '',
            r.recovery_email ? `Rec Email: ${r.recovery_email}` : '',
            (includePassword && r.master_password) ? `Master Pass: ${r.master_password}` : '',
            r.two_fa || r.two_factor_secret ? `2FA: ${r.two_fa || r.two_factor_secret}` : '',
            (includePassword && r.db_pass) ? `DB Pass: ${r.db_pass}` : '',
            r.api_key ? `API Key: ${r.api_key.substring(0, 15)}...` : '',
            r.smtp_key ? `SMTP Key: ${r.smtp_key.substring(0, 15)}...` : '',
            r.token ? `Token: ${r.token.substring(0, 15)}...` : '',
            r.purpose ? `Purpose: ${r.purpose}` : ''
          ].filter(Boolean);

          const detailsStr = detailsArr.length > 0 ? detailsArr.join(' | ') : 'Standard Record';
          const statusVal = r.status || 'Uncompleted';
          
          return [String(i + 1), String(idCol), String(emailOrPhone), detailsStr, statusVal];
        });

        autoTable(doc, {
          startY: currentY,
          head: head,
          body: body,
          theme: 'grid',
          headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontSize: 8.5,
            fontStyle: 'bold',
            halign: 'left',
            cellPadding: 2.5,
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [30, 41, 59],
            cellPadding: 2,
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252],
          },
          columnStyles: {
            0: { cellWidth: 8, halign: 'center' },
            1: { cellWidth: 35, fontStyle: 'bold' },
            2: { cellWidth: 45 },
            3: { cellWidth: 70 },
            4: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
          },
          margin: { left: 14, right: 14 },
          didDrawPage: (data) => {
            const pageCount = (doc as any).internal.getNumberOfPages();
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            doc.text(`Akti DB Command Center - Security Report  |  Issue by : Ali Hosen`, 14, 287);
            doc.text(`Page ${data.pageNumber} of ${pageCount}`, 175, 287);
          }
        });

        currentY = (doc as any).lastAutoTable.finalY + 10;
      });

      const modeTag = includePassword ? 'full_credentials' : 'no_passwords';
      doc.save(`zxhub_vault_report_${modeTag}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF export.');
    } finally {
      setLoading(false);
    }
  };

  const totalEntries = (fbCount || 0) + (gmailCount || 0) + (supabaseCount || 0) + (githubCount || 0) + (specialFbCount || 0) + (specialGmailCount || 0) + (contactCount || 0) + (brevoCount || 0) + (vercelCount || 0) + (imgbbCount || 0) + (projectCount || 0);

  const statCards = [
    { label: 'Projects', count: projectCount, icon: FolderKanban, color: 'from-indigo-600/20 to-indigo-900/10 border-indigo-500/30 text-indigo-400', glow: 'hover:shadow-indigo-500/20' },
    { label: 'ImgBB Keys', count: imgbbCount, icon: Image, color: 'from-teal-600/20 to-teal-900/10 border-teal-500/30 text-teal-300', glow: 'hover:shadow-teal-500/20' },
    { label: 'Facebook', count: fbCount, icon: Facebook, color: 'from-blue-600/20 to-blue-900/10 border-blue-500/30 text-blue-400', glow: 'hover:shadow-blue-500/20' },
    { label: 'Gmail', count: gmailCount, icon: Mail, color: 'from-red-600/20 to-red-900/10 border-red-500/30 text-red-400', glow: 'hover:shadow-red-500/20' },
    { label: 'Supabase', count: supabaseCount, icon: Database, color: 'from-emerald-600/20 to-emerald-900/10 border-emerald-500/30 text-emerald-400', glow: 'hover:shadow-emerald-500/20' },
    { label: 'Github', count: githubCount, icon: Github, color: 'from-slate-600/20 to-slate-900/10 border-slate-500/30 text-slate-300', glow: 'hover:shadow-slate-500/20' },
    { label: 'Brevo Mail', count: brevoCount, icon: Send, color: 'from-teal-600/20 to-teal-900/10 border-teal-500/30 text-teal-400', glow: 'hover:shadow-teal-500/20' },
    { label: 'Vercel Cloud', count: vercelCount, icon: Triangle, color: 'from-purple-600/20 to-purple-900/10 border-purple-500/30 text-purple-400', glow: 'hover:shadow-purple-500/20' },
    { label: 'Contacts', count: contactCount, icon: Phone, color: 'from-amber-600/20 to-amber-900/10 border-amber-500/30 text-amber-400', glow: 'hover:shadow-amber-500/20' },
    { label: 'Special FB', count: specialFbCount, icon: ShieldAlert, color: 'from-rose-600/20 to-rose-900/10 border-rose-500/30 text-rose-400', glow: 'hover:shadow-rose-500/20' },
  ];

  const quickActions = [
    { name: 'Add New Project', desc: 'Manage Name, Links, Repo & Keys', href: '/add-project', icon: FolderKanban, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    { name: 'ImgBB API Vault', desc: 'Dispense & bulk store API keys', href: '/imgbb', icon: Image, color: 'bg-teal-500/10 text-teal-300 border-teal-500/20' },
    { name: 'Add Vercel Cloud', desc: 'Deployments, tokens & team IDs', href: '/add-vercel', icon: Triangle, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    { name: 'Add Supabase DB', desc: 'Project keys, secrets & JWTs', href: '/add-supabase', icon: Database, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { name: 'Add Brevo Mail', desc: 'SMTP keys & transactional email', href: '/add-brevo', icon: Send, color: 'bg-teal-500/10 text-teal-400 border-teal-500/20' },
    { name: 'Add Github Repo', desc: 'Personal access tokens & SSH', href: '/add-github', icon: Github, color: 'bg-slate-500/10 text-slate-300 border-slate-500/20' },
    { name: 'Add FB Account', desc: 'Standard credentials & cookies', href: '/add-fb', icon: Facebook, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { name: 'Add Gmail Account', desc: 'Google login & recovery codes', href: '/add-gmail', icon: Mail, color: 'bg-red-500/10 text-red-400 border-red-500/20' },
    { name: 'Add Contact', desc: 'Phone, address & NID records', href: '/add-contact', icon: Phone, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  ];

  return (
    <div className="space-y-8 flex flex-col h-full font-sans">
      {/* Top Banner & Title Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden shrink-0">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-center space-x-4 mb-4 md:mb-0 z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-teal-400 p-[2px] shadow-lg shadow-indigo-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Layers className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight font-display">ZX HUB COMMAND CENTER</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-widest animate-pulse">Live Vault</span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Securely manage your cloud platforms, developer tokens, and social credentials</p>
          </div>
        </div>

        {/* Backup Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto z-10 justify-end mt-4 md:mt-0">
          <button 
            onClick={() => exportData('pdf')}
            title="Export Executive Report (PDF)"
            disabled={loading}
            className="flex items-center justify-center px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all duration-150 shadow-sm hover:scale-105 active:scale-95"
          >
            <FileText className="w-4 h-4 mr-2 text-rose-400" />
            <span>PDF Report</span>
          </button>
          <button 
            onClick={() => exportData('csv')}
            title="Export Backup (CSV)"
            disabled={loading}
            className="flex items-center justify-center px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition-all duration-150 shadow-sm hover:scale-105 active:scale-95"
          >
            <Download className="w-4 h-4 mr-2" />
            <span>CSV Backup</span>
          </button>
          <button 
            onClick={() => exportData('json')}
            title="Export Backup (JSON)"
            disabled={loading}
            className="flex items-center justify-center px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 rounded-xl transition-all duration-150 shadow-sm hover:scale-105 active:scale-95"
          >
            <FileJson className="w-4 h-4 mr-2" />
            <span>JSON Backup</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" /> Asset Distribution
          </h2>
          <div className="text-xs font-bold text-slate-400 bg-slate-900/80 px-3 py-1 rounded-full border border-slate-800">
            Total Stored: <span className="text-white font-mono text-sm ml-1">{loading ? '...' : totalEntries}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {/* Total Hero Card */}
          <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-indigo-900/40 via-purple-900/20 to-slate-900/90 rounded-2xl border border-indigo-500/40 p-5 shadow-xl flex flex-col justify-between relative overflow-hidden group hover:border-indigo-400 transition-all duration-300">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/10 rounded-full blur-xl group-hover:bg-indigo-500/20 transition-all"></div>
            <div className="flex items-center justify-between mb-2 z-10">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-300">Total Vault</span>
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="z-10 mt-2">
              <p className="text-4xl lg:text-5xl font-extrabold text-white font-display tracking-tight">
                {loading ? '-' : totalEntries}
              </p>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Across all 9 categories</p>
            </div>
          </div>

          {/* Individual Category Cards */}
          {statCards.map((card) => (
            <div 
              key={card.label}
              className={`bg-gradient-to-br ${card.color} bg-slate-900/80 rounded-2xl border p-5 shadow-lg flex flex-col justify-between relative overflow-hidden group transition-all duration-200 ${card.glow} hover:-translate-y-0.5`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider opacity-80">{card.label}</span>
                <card.icon className="w-4 h-4 opacity-75 group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2">
                <p className="text-3xl font-extrabold text-white font-display">
                  {loading ? '-' : card.count || 0}
                </p>
                <p className="text-[10px] text-slate-400 opacity-70 mt-0.5 font-medium">Stored Records</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Terminal Live Activity Widget */}
      <div className="bg-slate-950 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl font-mono text-xs">
        <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2 ml-1">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" /> Live Terminal Activity Log
            </span>
          </div>
          <Link to="/logs" className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold uppercase tracking-wider flex items-center gap-1">
            <span>Open Full Terminal</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="p-3.5 space-y-2 bg-slate-950/95 font-mono text-[11px]">
          {recentLogs.length === 0 ? (
            <p className="text-slate-600 italic">No activity recorded yet.</p>
          ) : (
            recentLogs.map((log) => {
              const dateObj = new Date(log.created_at);
              const formattedDate = isNaN(dateObj.getTime()) ? log.created_at : format(dateObj, 'HH:mm:ss');
              let badgeColor = 'text-slate-400 border-slate-700 bg-slate-800/40';
              if (log.action_type === 'LOGIN') badgeColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
              if (log.action_type === 'CREATE') badgeColor = 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10';
              if (log.action_type === 'UPDATE') badgeColor = 'text-amber-300 border-amber-500/30 bg-amber-500/10';
              if (log.action_type === 'DELETE') badgeColor = 'text-rose-400 border-rose-500/30 bg-rose-500/10';
              if (log.action_type === 'DASHBOARD') badgeColor = 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10';

              return (
                <div key={log.id} className="flex items-center space-x-2 text-slate-300 truncate">
                  <span className="text-slate-500 font-semibold">[{formattedDate}]</span>
                  <span className={`px-1.5 py-0.5 rounded border text-[9px] font-bold uppercase tracking-wider ${badgeColor}`}>
                    {log.action_type}
                  </span>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">[{log.category}]</span>
                  <span className="truncate text-slate-200">{log.title}</span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Quick Action Cards Grid */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-teal-400" /> Quick Add & Actions
          </h2>
          <Link to="/search" className="text-xs text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 group">
            <span>View all items</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((act) => (
            <Link 
              key={act.name}
              to={act.href} 
              className="group flex items-center p-4 bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 rounded-2xl shadow-md hover:shadow-xl hover:bg-slate-800/60 transition-all duration-200 hover:-translate-y-1"
            >
              <div className={`p-3.5 rounded-xl border mr-4 shrink-0 transition-transform group-hover:scale-110 ${act.color}`}>
                <act.icon className="w-5 h-5" />
              </div>
              <div className="text-left min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 group-hover:text-white truncate font-display">{act.name}</h3>
                  <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-all transform -translate-x-2 group-hover:translate-x-0 shrink-0 ml-1" />
                </div>
                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{act.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Bottom Features Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
        <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/30 to-slate-900/80 border border-indigo-900/40 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-display">Row Level Security</h4>
            <p className="text-xs text-slate-400 mt-0.5">All credentials protected via Supabase policies</p>
          </div>
        </div>
        
        <div className="p-5 rounded-2xl bg-gradient-to-r from-teal-950/30 to-slate-900/80 border border-teal-900/40 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-display">Integrated Task Manager</h4>
            <p className="text-xs text-slate-400 mt-0.5">Track DevOps tasks, maintenance & due dates</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/30 to-slate-900/80 border border-purple-900/40 flex items-center space-x-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white font-display">Public Workspace Locker</h4>
            <p className="text-xs text-slate-400 mt-0.5">Share non-sensitive accounts without master key</p>
          </div>
        </div>
      </div>

      {/* PDF Option Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onExport={(includePassword) => performPdfExport(includePassword)}
        title="Full Apps Vault PDF Export"
        subtitle="Select whether to include passwords in the exported master vault PDF."
        recordCount={totalEntries}
      />
    </div>
  );
}
