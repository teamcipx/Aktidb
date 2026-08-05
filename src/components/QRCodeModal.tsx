import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, QrCode, Copy, Check, Download, Smartphone, Sparkles, Sliders, FileText, Key, ShieldCheck } from 'lucide-react';
import { cn } from '../lib/utils';

interface QRCodeModalProps {
  title?: string;
  subtitle?: string;
  // Account data object OR direct string value
  data?: any;
  value?: string;
  onClose: () => void;
}

export default function QRCodeModal({ title = 'Account Credential QR Code', subtitle, data, value, onClose }: QRCodeModalProps) {
  const qrRef = useRef<SVGSVGElement | null>(null);

  // Determine initial format options if data is an object
  const hasAccountData = data && typeof data === 'object';
  const emailVal = data?.email || data?.admin_email || data?.username || '';
  const passVal = data?.password || data?.admin_password || '';
  const keyVal = data?.api_key || data?.smtp_key || data?.token || data?.two_fa || data?.two_factor_secret || value || '';

  // Options for QR payload mode
  const initialMode = hasAccountData && emailVal && passVal ? 'credentials' : 'raw';
  const [activeMode, setActiveMode] = useState<'credentials' | 'password' | 'email' | 'key' | 'custom'>(initialMode);

  // Custom text state
  const getInitialPayload = () => {
    if (value) return value;
    if (hasAccountData) {
      if (emailVal && passVal) {
        return JSON.stringify({
          name: data.name || 'Account Credential',
          email: emailVal,
          password: passVal
        }, null, 2);
      }
      return passVal || emailVal || keyVal || JSON.stringify(data);
    }
    return '';
  };

  const [customText, setCustomText] = useState<string>(getInitialPayload());

  // QR Code Styling options
  const [qrSize, setQrSize] = useState<number>(220);
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [includeMargin, setIncludeMargin] = useState<boolean>(true);
  const [themePreset, setThemePreset] = useState<'bw' | 'dark' | 'indigo' | 'amber' | 'emerald'>('bw');
  const [copied, setCopied] = useState<boolean>(false);

  // Calculate payload text based on active tab
  const getActivePayload = (): string => {
    if (activeMode === 'custom') return customText;
    if (activeMode === 'credentials' && hasAccountData) {
      return JSON.stringify({
        account: data.name || 'Credential',
        email: emailVal,
        password: passVal
      });
    }
    if (activeMode === 'password') return passVal;
    if (activeMode === 'email') return emailVal;
    if (activeMode === 'key') return keyVal;
    return value || customText;
  };

  const currentPayload = getActivePayload();

  // Color options based on preset
  const colorMap = {
    bw: { fg: '#000000', bg: '#ffffff', label: 'Classic White (Best for Phone Camera)' },
    dark: { fg: '#38bdf8', bg: '#0f172a', label: 'Cyber Dark' },
    indigo: { fg: '#4f46e5', bg: '#ffffff', label: 'Indigo Accent' },
    amber: { fg: '#d97706', bg: '#ffffff', label: 'Flame Amber' },
    emerald: { fg: '#059669', bg: '#ffffff', label: 'Emerald Mint' },
  };

  const activeColor = colorMap[themePreset];

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(currentPayload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleDownloadPNG = () => {
    if (!qrRef.current) return;
    const svgElement = qrRef.current;
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const blobURL = window.URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 3; // high DPI export
      canvas.width = qrSize * scale;
      canvas.height = qrSize * scale;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = activeColor.bg;
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        const filename = (data?.name || title || 'credential').toLowerCase().replace(/\s+/g, '_');
        downloadLink.href = pngUrl;
        downloadLink.download = `qrcode_${filename}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    };
    image.src = blobURL;
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
                {title}
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[10px] font-bold uppercase tracking-widest">
                  Mobile Scanner Ready
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                {subtitle || (data?.name ? `Credential payload for ${data.name}` : 'Scan with phone camera or QR scanner app')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">

          {/* Mode Selector Tabs (if account data exists) */}
          {hasAccountData && (
            <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800/80 text-xs overflow-x-auto">
              {emailVal && passVal && (
                <button
                  type="button"
                  onClick={() => setActiveMode('credentials')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0",
                    activeMode === 'credentials'
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  )}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Email + Password
                </button>
              )}
              {passVal && (
                <button
                  type="button"
                  onClick={() => setActiveMode('password')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0",
                    activeMode === 'password'
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  )}
                >
                  <Key className="w-3.5 h-3.5" />
                  Password Only
                </button>
              )}
              {emailVal && (
                <button
                  type="button"
                  onClick={() => setActiveMode('email')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0",
                    activeMode === 'email'
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  )}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Email Only
                </button>
              )}
              {keyVal && (
                <button
                  type="button"
                  onClick={() => setActiveMode('key')}
                  className={cn(
                    "px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0",
                    activeMode === 'key'
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                  )}
                >
                  <Key className="w-3.5 h-3.5" />
                  Key / Token
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveMode('custom')}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1.5 shrink-0",
                  activeMode === 'custom'
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                )}
              >
                <Sliders className="w-3.5 h-3.5" />
                Custom Payload
              </button>
            </div>
          )}

          {/* Custom Input Field (If Custom Mode) */}
          {activeMode === 'custom' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Custom Payload / Text
              </label>
              <textarea
                rows={3}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Type or paste any credentials, text, or link..."
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:ring-1 focus:ring-indigo-500 outline-none resize-none"
              />
            </div>
          )}

          {/* QR Display Card */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-950 rounded-2xl border border-slate-800/80 shadow-inner relative">
            <div
              className="p-5 rounded-2xl shadow-xl transition-all flex items-center justify-center"
              style={{ backgroundColor: activeColor.bg }}
            >
              <QRCodeSVG
                ref={qrRef}
                value={currentPayload || 'No Data'}
                size={qrSize}
                fgColor={activeColor.fg}
                bgColor={activeColor.bg}
                level={errorLevel}
                includeMargin={includeMargin}
              />
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-slate-400 bg-slate-900/90 px-3 py-1.5 rounded-full border border-slate-800">
              <Smartphone className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>Point your phone camera or QR app to scan</span>
            </div>
          </div>

          {/* Customization Options Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-950/50 rounded-xl border border-slate-800/60">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Theme / Scan Contrast
              </label>
              <select
                value={themePreset}
                onChange={(e) => setThemePreset(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="bw">Classic White & Black (Recommended for Camera)</option>
                <option value="dark">Cyber Dark Theme</option>
                <option value="indigo">Indigo Accent</option>
                <option value="amber">Flame Amber</option>
                <option value="emerald">Emerald Mint</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Error Correction Level
              </label>
              <select
                value={errorLevel}
                onChange={(e) => setErrorLevel(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs font-semibold text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="L">Level L (~7% recovery)</option>
                <option value="M">Level M (~15% recovery - Default)</option>
                <option value="Q">Level Q (~25% recovery)</option>
                <option value="H">Level H (~30% recovery - Max)</option>
              </select>
            </div>
          </div>

          {/* Current Encoded Text Preview */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Encoded Data Payload
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                {currentPayload.length} characters
              </span>
            </div>
            <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-indigo-300 max-h-24 overflow-y-auto whitespace-pre-wrap break-all">
              {currentPayload}
            </pre>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
            <button
              onClick={handleCopyText}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 transition-all"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Payload Copied!' : 'Copy Text Payload'}</span>
            </button>

            <button
              onClick={handleDownloadPNG}
              className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white border border-indigo-500/30 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              <span>Download QR Image (PNG)</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
