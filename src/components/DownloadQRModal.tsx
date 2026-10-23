import React, { useRef, useEffect, useState } from 'react';
import {
  X,
  Download,
  FileImage,
  FileCode,
  FileText,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import type { QRCodeItem } from '../types';
import {
  renderQRCodeToCanvas,
  downloadQRCodePNG,
  downloadQRCodeSVG,
  downloadQRCodePDF,
} from '../utils/qrGenerator';

interface DownloadQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  qr: QRCodeItem | null;
  onTestScan?: (id: string) => void;
}

export const DownloadQRModal: React.FC<DownloadQRModalProps> = ({
  isOpen,
  onClose,
  qr,
  onTestScan,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const dynamicUrl = qr
    ? `${typeof window !== 'undefined' ? window.location.origin : 'https://qrdynamic.app'}/r/${qr.shortCode}`
    : '';

  useEffect(() => {
    if (!isOpen || !qr || !canvasRef.current) return;
    renderQRCodeToCanvas({
      text: dynamicUrl,
      style: qr.style || {
        foregroundColor: '#0f172a',
        backgroundColor: '#ffffff',
        dotType: 'rounded',
        eyeFrame: 'rounded',
        eyeBall: 'rounded',
        margin: 2,
        size: 512,
      },
      canvas: canvasRef.current,
      targetSize: 320,
    });
  }, [isOpen, qr, dynamicUrl]);

  if (!isOpen || !qr) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(dynamicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = async (resolution = 2048) => {
    try {
      setIsDownloading(true);
      await downloadQRCodePNG(
        dynamicUrl,
        qr.style,
        `qrcode-${qr.shortCode}-${resolution}px.png`,
        resolution
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadSVG = async () => {
    try {
      setIsDownloading(true);
      await downloadQRCodeSVG(dynamicUrl, qr.style, `qrcode-${qr.shortCode}.svg`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloading(true);
      await downloadQRCodePDF(
        dynamicUrl,
        qr.style,
        {
          name: qr.name,
          clientName: qr.clientName,
          shortCode: qr.shortCode,
          destinationUrl: qr.destinationUrl,
        },
        `display-${qr.shortCode}.pdf`
      );
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">{qr.name}</h2>
            <p className="text-xs text-slate-500">
              Cliente: <span className="font-semibold text-slate-700">{qr.clientName || 'Cliente'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
          {/* Left Canvas Preview */}
          <div className="flex flex-col items-center text-center space-y-3">
            <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-md inline-block max-w-[240px]">
              <canvas
                ref={canvasRef}
                className="rounded-2xl w-full h-auto aspect-square block"
              />
            </div>

            <div className="w-full max-w-[260px] bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-left">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Link Dinâmico</span>
              <div className="flex items-center justify-between gap-1 mt-0.5">
                <span className="font-mono text-xs text-indigo-600 font-bold truncate">
                  /r/{qr.shortCode}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="p-1 text-slate-500 hover:text-slate-800 rounded-md"
                  title="Copiar link"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {onTestScan && (
              <button
                onClick={() => onTestScan(qr.id)}
                className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Simular Leitura / Test Scan</span>
              </button>
            )}
          </div>

          {/* Right Export Formats */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Formatos de Exportação Profissional
            </h3>

            {/* PNG High Res Button */}
            <button
              onClick={() => handleDownloadPNG(2048)}
              disabled={isDownloading}
              className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileImage className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-600">
                    PNG Alta Resolução (2048px)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Ideal para embalagens, adesivos e banners
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </button>

            {/* SVG Vector Button */}
            <button
              onClick={handleDownloadSVG}
              disabled={isDownloading}
              className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileCode className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-600">
                    SVG Vetorial Escalável
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Para designers e gráficas (sem perda de resolução)
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </button>

            {/* PDF Display Print Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloading}
              className="w-full p-3.5 rounded-2xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 text-left flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-600">
                    PDF Display A4 Pronto para Imprimir
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Com cabeçalho da empresa e guia de leitura
                  </p>
                </div>
              </div>
              <Download className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
