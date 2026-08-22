import React, { useState, useRef, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { 
  X, 
  QrCode, 
  Copy, 
  Check, 
  Download, 
  Smartphone, 
  Sparkles, 
  Sliders, 
  FileText, 
  Key, 
  ShieldCheck, 
  Globe, 
  Wifi, 
  User, 
  Mail, 
  MessageSquare, 
  ExternalLink,
  Share2,
  Palette,
  Layers,
  Image as ImageIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

interface QRCodeModalProps {
  title?: string;
  subtitle?: string;
  // Account data object OR direct string value
  data?: any;
  value?: string;
  onClose: () => void;
}

type QRMode = 'url' | 'credentials' | 'vcard' | 'wifi' | 'email' | 'sms' | 'custom';

export default function QRCodeModal({ title = 'Advanced QR Code Studio', subtitle, data, value, onClose }: QRCodeModalProps) {
  const qrRef = useRef<SVGSVGElement | null>(null);

  // Extract initial account data
  const hasAccountData = data && typeof data === 'object';
  const nameVal = data?.name || data?.title || 'ZX Hub Resource';
  const emailVal = data?.email || data?.admin_email || data?.username || '';
  const passVal = data?.password || data?.admin_password || '';
  const phoneVal = data?.phone || data?.contact_number || '';
  const linkVal = data?.link || data?.url || data?.profile_link || value || '';
  const keyVal = data?.api_key || data?.smtp_key || data?.token || data?.two_fa || data?.two_fa_code || data?.anon_key || '';
  const descVal = data?.description || data?.note || '';
  const orgVal = data?.organization || data?.purpose || '';
  const addressVal = data?.address || '';

  // Determine initial mode smartly
  const getInitialMode = (): QRMode => {
    if (phoneVal && (nameVal || emailVal)) return 'vcard';
    if (linkVal && (linkVal.startsWith('http') || linkVal.includes('.'))) return 'url';
    if (emailVal && passVal) return 'credentials';
    if (value) return 'custom';
    return 'custom';
  };

  const [activeMode, setActiveMode] = useState<QRMode>(getInitialMode());

  // Form states for different modes
  const [urlInput, setUrlInput] = useState(linkVal || 'https://');
  const [customText, setCustomText] = useState(
    value || (hasAccountData ? JSON.stringify(data, null, 2) : '')
  );

  // vCard State
  const [vcard, setVcard] = useState({
    firstName: nameVal.split(' ')[0] || '',
    lastName: nameVal.split(' ').slice(1).join(' ') || '',
    phone: phoneVal,
    email: emailVal,
    org: orgVal,
    title: '',
    address: addressVal,
    url: linkVal,
    note: descVal
  });

  // WiFi State
  const [wifi, setWifi] = useState({
    ssid: '',
    password: '',
    encryption: 'WPA' as 'WPA' | 'WEP' | 'nopass',
    hidden: false
  });

  // Email State
  const [mail, setMail] = useState({
    to: emailVal,
    subject: nameVal ? `Inquiry regarding ${nameVal}` : '',
    body: ''
  });

  // SMS State
  const [sms, setSms] = useState({
    phone: phoneVal,
    message: ''
  });

  // Credentials State
  const [credFormat, setCredFormat] = useState<'json' | 'plain' | 'password_only'>('json');

  // Styling options
  const [qrSize, setQrSize] = useState<number>(240);
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('Q');
  const [includeMargin, setIncludeMargin] = useState<boolean>(true);
  const [themePreset, setThemePreset] = useState<'classic' | 'cyber' | 'oled' | 'emerald' | 'indigo' | 'sunset' | 'custom'>('classic');
  const [customFg, setCustomFg] = useState('#000000');
  const [customBg, setCustomBg] = useState('#ffffff');
  const [centerIcon, setCenterIcon] = useState<'none' | 'globe' | 'key' | 'shield' | 'user' | 'wifi' | 'sparkles'>('none');
  
  // UI states
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [showDesignTab, setShowDesignTab] = useState<boolean>(false);

  // Color preset mapping
  const colorPresets = {
    classic: { fg: '#000000', bg: '#ffffff', label: 'Classic Print (Best for Phone Camera)' },
    cyber: { fg: '#38bdf8', bg: '#090d16', label: 'Cyber Neon' },
    oled: { fg: '#ffffff', bg: '#000000', label: 'OLED Pure Dark' },
    emerald: { fg: '#059669', bg: '#f0fdf4', label: 'Emerald Mint' },
    indigo: { fg: '#4f46e5', bg: '#f5f3ff', label: 'Indigo Royal' },
    sunset: { fg: '#ea580c', bg: '#fff7ed', label: 'Sunset Amber' },
    custom: { fg: customFg, bg: customBg, label: 'Custom Palette' },
  };

  const activeColors = themePreset === 'custom' 
    ? { fg: customFg, bg: customBg } 
    : colorPresets[themePreset];

  // Compute final QR payload string
  const getPayload = (): string => {
    switch (activeMode) {
      case 'url': {
        let u = urlInput.trim();
        if (u && !u.startsWith('http://') && !u.startsWith('https://')) {
          u = `https://${u}`;
        }
        return u || 'https://';
      }

      case 'vcard': {
        // Standard vCard 3.0 string
        const lines = [
          'BEGIN:VCARD',
          'VERSION:3.0',
          `N:${vcard.lastName};${vcard.firstName};;;`,
          `FN:${vcard.firstName} ${vcard.lastName}`.trim(),
          vcard.org ? `ORG:${vcard.org}` : '',
          vcard.title ? `TITLE:${vcard.title}` : '',
          vcard.phone ? `TEL;TYPE=CELL:${vcard.phone}` : '',
          vcard.email ? `EMAIL;TYPE=WORK:${vcard.email}` : '',
          vcard.url ? `URL:${vcard.url}` : '',
          vcard.address ? `ADR;TYPE=WORK:;;${vcard.address};;;;` : '',
          vcard.note ? `NOTE:${vcard.note}` : '',
          'END:VCARD'
        ].filter(Boolean);
        return lines.join('\n');
      }

      case 'wifi': {
        // Standard WiFi QR format: WIFI:S:<SSID>;T:<WPA|WEP|nopass>;P:<PASSWORD>;H:<true|false>;;
        return `WIFI:S:${wifi.ssid};T:${wifi.encryption};P:${wifi.password};H:${wifi.hidden};;`;
      }

      case 'email': {
        const queryParams = [];
        if (mail.subject) queryParams.push(`subject=${encodeURIComponent(mail.subject)}`);
        if (mail.body) queryParams.push(`body=${encodeURIComponent(mail.body)}`);
        const query = queryParams.length > 0 ? `?${queryParams.join('&')}` : '';
        return `mailto:${mail.to}${query}`;
      }

      case 'sms': {
        return `SMSTO:${sms.phone}:${sms.message}`;
      }

      case 'credentials': {
        if (credFormat === 'password_only') {
          return passVal || customText;
        }
        if (credFormat === 'plain') {
          const parts = [
            nameVal ? `Account: ${nameVal}` : '',
            emailVal ? `User/Email: ${emailVal}` : '',
            passVal ? `Password: ${passVal}` : '',
            keyVal ? `Key/2FA: ${keyVal}` : '',
            linkVal ? `Link: ${linkVal}` : ''
          ].filter(Boolean);
          return parts.join('\n');
        }
        // JSON format
        return JSON.stringify({
          account: nameVal,
          username: emailVal,
          password: passVal,
          api_key: keyVal || undefined,
          link: linkVal || undefined
        }, null, 2);
      }

      case 'custom':
      default:
        return customText || value || linkVal || '';
    }
  };

  const currentPayload = getPayload();

  // Copy raw payload text
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(currentPayload);
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  // Copy PNG image to clipboard
  const handleCopyImage = async () => {
    if (!qrRef.current) return;
    try {
      const svgElement = qrRef.current;
      const svgData = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const blobURL = window.URL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = qrSize * 2;
        canvas.height = qrSize * 2;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Fill background
        ctx.fillStyle = activeColors.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        window.URL.revokeObjectURL(blobURL);

        canvas.toBlob(async (blob) => {
          if (!blob) return;
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob })
            ]);
            setCopiedImage(true);
            setTimeout(() => setCopiedImage(false), 2000);
          } catch (e) {
            console.error('Clipboard item write error:', e);
          }
        });
      };
      image.src = blobURL;
    } catch (err) {
      console.error('Failed to copy QR image:', err);
    }
  };

  // Download High-Res PNG
  const handleDownloadPNG = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = window.URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const exportScale = 4; // 4x high-res
      canvas.width = qrSize * exportScale;
      canvas.height = qrSize * exportScale;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw background
      ctx.fillStyle = activeColors.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      const pngURL = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.href = pngURL;
      const cleanName = (title || 'zxhub_qr').toLowerCase().replace(/[^a-z0-9]/g, '_');
      downloadLink.download = `${cleanName}_${Date.now()}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  // Download SVG
  const handleDownloadSVG = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = window.URL.createObjectURL(svgBlob);

    const downloadLink = document.createElement('a');
    downloadLink.href = blobURL;
    const cleanName = (title || 'zxhub_qr').toLowerCase().replace(/[^a-z0-9]/g, '_');
    downloadLink.download = `${cleanName}_${Date.now()}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    window.URL.revokeObjectURL(blobURL);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto font-sans animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[94vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-teal-500/20 text-cyan-400 border border-cyan-500/30 shadow-inner">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white tracking-wide flex items-center gap-2">
                {title}
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-wider">
                  Pro QR Engine
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {subtitle || 'Encode URLs, Digital vCards, WiFi Credentials & Secrets instantly'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Data Form & Mode Selectors (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Mode Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setActiveMode('url')}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shrink-0 transition-all",
                  activeMode === 'url' ? "bg-cyan-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Web URL</span>
              </button>

              <button
                onClick={() => setActiveMode('credentials')}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shrink-0 transition-all",
                  activeMode === 'credentials' ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Key className="w-3.5 h-3.5" />
                <span>Credentials</span>
              </button>

              <button
                onClick={() => setActiveMode('vcard')}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shrink-0 transition-all",
                  activeMode === 'vcard' ? "bg-teal-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <User className="w-3.5 h-3.5" />
                <span>vCard Contact</span>
              </button>

              <button
                onClick={() => setActiveMode('wifi')}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shrink-0 transition-all",
                  activeMode === 'wifi' ? "bg-amber-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span>WiFi Hotspot</span>
              </button>

              <button
                onClick={() => setActiveMode('email')}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shrink-0 transition-all",
                  activeMode === 'email' ? "bg-rose-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>

              <button
                onClick={() => setActiveMode('sms')}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shrink-0 transition-all",
                  activeMode === 'sms' ? "bg-purple-600 text-white shadow" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>SMS</span>
              </button>

              <button
                onClick={() => setActiveMode('custom')}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 shrink-0 transition-all",
                  activeMode === 'custom' ? "bg-slate-700 text-white shadow" : "text-slate-400 hover:text-slate-200"
                )}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Raw Text</span>
              </button>
            </div>

            {/* Mode-Specific Input Form */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3.5">
              
              {/* URL Mode */}
              {activeMode === 'url' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">
                      Destination Web Address
                    </label>
                    {urlInput && (
                      <a
                        href={urlInput.startsWith('http') ? urlInput : `https://${urlInput}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-cyan-400 hover:underline flex items-center gap-1 text-[10px]"
                      >
                        <ExternalLink className="w-3 h-3" /> Test Link
                      </a>
                    )}
                  </div>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://example.com/vault-resource"
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Scanning will immediately open or prompt the browser to visit this URL.
                  </p>
                </div>
              )}

              {/* Credentials Mode */}
              {activeMode === 'credentials' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
                      Format Encoding
                    </label>
                    <div className="flex items-center space-x-1">
                      {(['json', 'plain', 'password_only'] as const).map(fmt => (
                        <button
                          key={fmt}
                          onClick={() => setCredFormat(fmt)}
                          className={cn(
                            "px-2 py-0.5 rounded text-[10px] font-bold transition-all",
                            credFormat === fmt ? "bg-indigo-600 text-white" : "text-slate-400 bg-slate-900"
                          )}
                        >
                          {fmt === 'json' ? 'JSON' : (fmt === 'plain' ? 'Plain Text' : 'Pass Only')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Account</span>
                      <span className="text-slate-200 font-medium truncate block">{nameVal || 'N/A'}</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Email / User</span>
                      <span className="text-slate-200 font-medium truncate block">{emailVal || 'N/A'}</span>
                    </div>
                    <div className="col-span-2 p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Password</span>
                      <span className="text-emerald-400 font-mono text-[11px] truncate block">{passVal || '••••••••'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* vCard Mode */}
              {activeMode === 'vcard' && (
                <div className="space-y-3 text-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-teal-400 flex items-center justify-between">
                    <span>Digital Business Card (vCard)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Phone scans auto-prompt "Save Contact"</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="First Name"
                      value={vcard.firstName}
                      onChange={(e) => setVcard({ ...vcard, firstName: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      value={vcard.lastName}
                      onChange={(e) => setVcard({ ...vcard, lastName: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number (+880...)"
                      value={vcard.phone}
                      onChange={(e) => setVcard({ ...vcard, phone: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500 font-mono"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={vcard.email}
                      onChange={(e) => setVcard({ ...vcard, email: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                    <input
                      type="text"
                      placeholder="Organization / Company"
                      value={vcard.org}
                      onChange={(e) => setVcard({ ...vcard, org: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                    <input
                      type="text"
                      placeholder="Address / Location"
                      value={vcard.address}
                      onChange={(e) => setVcard({ ...vcard, address: e.target.value })}
                      className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>
              )}

              {/* WiFi Mode */}
              {activeMode === 'wifi' && (
                <div className="space-y-3 text-xs">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    WiFi Network Fast Connect
                  </div>
                  <div className="space-y-2">
                    <input
                      type="text"
                      placeholder="Network SSID (WiFi Name) *"
                      value={wifi.ssid}
                      onChange={(e) => setWifi({ ...wifi, ssid: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                    <input
                      type="text"
                      placeholder="WiFi Password"
                      value={wifi.password}
                      onChange={(e) => setWifi({ ...wifi, password: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                    />
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <select
                        value={wifi.encryption}
                        onChange={(e: any) => setWifi({ ...wifi, encryption: e.target.value })}
                        className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                      >
                        <option value="WPA">WPA / WPA2 / WPA3</option>
                        <option value="WEP">WEP</option>
                        <option value="nopass">Open (No Password)</option>
                      </select>
                      <label className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={wifi.hidden}
                          onChange={(e) => setWifi({ ...wifi, hidden: e.target.checked })}
                          className="rounded text-amber-500 focus:ring-0"
                        />
                        <span className="text-[11px]">Hidden Network</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Email Mode */}
              {activeMode === 'email' && (
                <div className="space-y-2 text-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 block">
                    Pre-filled Email (Mailto)
                  </span>
                  <input
                    type="email"
                    placeholder="Recipient Email (to:)"
                    value={mail.to}
                    onChange={(e) => setMail({ ...mail, to: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                  <input
                    type="text"
                    placeholder="Subject line"
                    value={mail.subject}
                    onChange={(e) => setMail({ ...mail, subject: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                  <textarea
                    rows={2}
                    placeholder="Body message content..."
                    value={mail.body}
                    onChange={(e) => setMail({ ...mail, body: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-rose-500"
                  />
                </div>
              )}

              {/* SMS Mode */}
              {activeMode === 'sms' && (
                <div className="space-y-2 text-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 block">
                    SMS Message Dispatch
                  </span>
                  <input
                    type="text"
                    placeholder="Phone number (+880...)"
                    value={sms.phone}
                    onChange={(e) => setSms({ ...sms, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500 font-mono"
                  />
                  <textarea
                    rows={2}
                    placeholder="SMS Text message body..."
                    value={sms.message}
                    onChange={(e) => setSms({ ...sms, message: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              {/* Raw / Custom Mode */}
              {activeMode === 'custom' && (
                <div className="space-y-2 text-xs">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block">
                    Raw Multiline Payload Text
                  </span>
                  <textarea
                    rows={4}
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Paste tokens, private keys, custom JSON or credentials..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}
            </div>

            {/* Customization & Design Controls Toggle */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  Styling & Color Palettes
                </span>
                <button
                  onClick={() => setShowDesignTab(!showDesignTab)}
                  className="text-cyan-400 hover:underline text-[11px] font-bold"
                >
                  {showDesignTab ? 'Collapse Options' : 'Customize QR'}
                </button>
              </div>

              {/* Preset Palette Pills */}
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(['classic', 'cyber', 'oled', 'emerald', 'indigo', 'sunset'] as const).map(presetKey => {
                  const p = colorPresets[presetKey];
                  return (
                    <button
                      key={presetKey}
                      onClick={() => setThemePreset(presetKey)}
                      className={cn(
                        "p-2 rounded-xl border flex flex-col items-center gap-1.5 transition-all",
                        themePreset === presetKey 
                          ? "border-cyan-500 bg-cyan-500/10 shadow-sm" 
                          : "border-slate-800 bg-slate-900/80 hover:border-slate-700"
                      )}
                    >
                      <div 
                        className="w-5 h-5 rounded-full border shadow-inner flex items-center justify-center text-[9px] font-bold" 
                        style={{ backgroundColor: p.bg, borderColor: p.fg, color: p.fg }}
                      >
                        QR
                      </div>
                      <span className="text-[10px] font-bold text-slate-300 capitalize truncate w-full text-center">
                        {presetKey}
                      </span>
                    </button>
                  );
                })}
              </div>

              {showDesignTab && (
                <div className="pt-3 border-t border-slate-800 space-y-3 animate-fade-in text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Error Correction */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Error Correction</label>
                      <select
                        value={errorLevel}
                        onChange={(e: any) => setErrorLevel(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
                      >
                        <option value="L">L (7% Recovery)</option>
                        <option value="M">M (15% Recovery)</option>
                        <option value="Q">Q (25% High)</option>
                        <option value="H">H (30% Ultra)</option>
                      </select>
                    </div>

                    {/* Size */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Canvas Size: {qrSize}px</label>
                      <input
                        type="range"
                        min="160"
                        max="340"
                        step="20"
                        value={qrSize}
                        onChange={(e) => setQrSize(Number(e.target.value))}
                        className="w-full accent-cyan-500 mt-1"
                      />
                    </div>

                    {/* Margin Toggle */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Quiet Zone Margin</label>
                      <button
                        onClick={() => setIncludeMargin(!includeMargin)}
                        className={cn(
                          "w-full py-1.5 rounded-lg border text-xs font-bold transition-all",
                          includeMargin ? "bg-indigo-600/20 text-indigo-300 border-indigo-500/30" : "bg-slate-900 text-slate-400 border-slate-800"
                        )}
                      >
                        {includeMargin ? 'Margin Enabled' : 'No Margin'}
                      </button>
                    </div>

                    {/* Center Icon */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Center Logo</label>
                      <select
                        value={centerIcon}
                        onChange={(e: any) => setCenterIcon(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200"
                      >
                        <option value="none">None (Clean)</option>
                        <option value="globe">Globe (Web)</option>
                        <option value="key">Key (Security)</option>
                        <option value="shield">Shield (Vault)</option>
                        <option value="user">User (Contact)</option>
                        <option value="wifi">WiFi</option>
                        <option value="sparkles">Sparkles</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Interactive Live QR Display & Export Actions (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between space-y-4 bg-slate-950 p-5 rounded-2xl border border-slate-800/80">
            
            {/* Live QR Box */}
            <div className="flex flex-col items-center text-center space-y-3 w-full">
              <div 
                className="p-4 rounded-2xl shadow-2xl transition-all duration-300 relative group border"
                style={{ backgroundColor: activeColors.bg, borderColor: `${activeColors.fg}30` }}
              >
                <div className="relative inline-block">
                  <QRCodeSVG
                    ref={qrRef}
                    value={currentPayload || 'ZX_HUB_DEFAULT'}
                    size={Math.min(qrSize, 240)}
                    level={errorLevel}
                    bgColor={activeColors.bg}
                    fgColor={activeColors.fg}
                    includeMargin={includeMargin}
                  />

                  {/* Central Badge Overlay if chosen */}
                  {centerIcon !== 'none' && (
                    <div 
                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                      <div 
                        className="p-1.5 rounded-full shadow-lg border-2 flex items-center justify-center"
                        style={{ backgroundColor: activeColors.bg, borderColor: activeColors.fg, color: activeColors.fg }}
                      >
                        {centerIcon === 'globe' && <Globe className="w-4 h-4" />}
                        {centerIcon === 'key' && <Key className="w-4 h-4" />}
                        {centerIcon === 'shield' && <ShieldCheck className="w-4 h-4" />}
                        {centerIcon === 'user' && <User className="w-4 h-4" />}
                        {centerIcon === 'wifi' && <Wifi className="w-4 h-4" />}
                        {centerIcon === 'sparkles' && <Sparkles className="w-4 h-4" />}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Byte & Mode Tag */}
              <div className="flex items-center justify-center space-x-2 text-[10px] font-mono text-slate-400">
                <span className="px-2 py-0.5 bg-slate-900 rounded-md border border-slate-800 text-cyan-400 font-bold uppercase">
                  {activeMode}
                </span>
                <span>•</span>
                <span>{currentPayload.length} Chars / {new Blob([currentPayload]).size} Bytes</span>
              </div>
            </div>

            {/* Quick Payload Preview Box */}
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-left space-y-1">
              <div className="flex items-center justify-between text-[10px] font-bold uppercase text-slate-400">
                <span>Payload Content</span>
                <button
                  onClick={handleCopyText}
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-bold lowercase text-[10px]"
                >
                  {copiedText ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedText ? 'copied text' : 'copy text'}</span>
                </button>
              </div>
              <div className="font-mono text-[10px] text-slate-300 max-h-16 overflow-y-auto break-all bg-slate-950 p-2 rounded border border-slate-800">
                {currentPayload || <span className="text-slate-600 italic">Empty payload</span>}
              </div>
            </div>

            {/* Export & Action Buttons */}
            <div className="w-full space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadPNG}
                  className="py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg transition-all hover:scale-102 active:scale-98"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PNG</span>
                </button>

                <button
                  onClick={handleDownloadSVG}
                  className="py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5 border border-slate-700 transition-all"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  <span>Vector SVG</span>
                </button>
              </div>

              <button
                onClick={handleCopyImage}
                className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-800 transition-all"
              >
                {copiedImage ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-teal-400" />
                    <span className="text-teal-400">QR Image Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Copy QR Image to Clipboard</span>
                  </>
                )}
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
