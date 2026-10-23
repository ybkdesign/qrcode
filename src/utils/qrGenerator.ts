import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import type { QRStyleConfig } from '../types';

export interface RenderQROptions {
  text: string;
  style: QRStyleConfig;
  canvas: HTMLCanvasElement;
  targetSize?: number;
}

// Check if a cell is part of the 3 corner finder patterns (7x7 corners)
function isFinderPattern(r: number, c: number, moduleCount: number): boolean {
  if (r < 7 && c < 7) return true; // Top-left
  if (r < 7 && c >= moduleCount - 7) return true; // Top-right
  if (r >= moduleCount - 7 && c < 7) return true; // Bottom-left
  return false;
}

export async function renderQRCodeToCanvas({
  text,
  style,
  canvas,
  targetSize = 512,
}: RenderQROptions): Promise<void> {
  // Generate QR Matrix
  const qr = QRCode.create(text, {
    errorCorrectionLevel: style.logoUrl ? 'H' : 'M',
  });

  const moduleCount = qr.modules.size;
  const margin = style.margin ?? 2;
  const totalGrid = moduleCount + margin * 2;

  canvas.width = targetSize;
  canvas.height = targetSize;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Background
  ctx.fillStyle = style.backgroundColor || '#ffffff';
  ctx.fillRect(0, 0, targetSize, targetSize);

  const cellSize = targetSize / totalGrid;
  const offsetX = margin * cellSize;
  const offsetY = margin * cellSize;

  ctx.fillStyle = style.foregroundColor || '#000000';

  // Draw modules
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      const isDark = qr.modules.get(r, c);
      if (!isDark) continue;

      // Skip finder patterns - we'll render custom eyes afterwards
      if (isFinderPattern(r, c, moduleCount)) {
        continue;
      }

      // If logo is present, reserve central ~20% area
      if (style.logoUrl) {
        const centerStart = Math.floor(moduleCount * 0.38);
        const centerEnd = Math.ceil(moduleCount * 0.62);
        if (r >= centerStart && r <= centerEnd && c >= centerStart && c <= centerEnd) {
          continue;
        }
      }

      const x = offsetX + c * cellSize;
      const y = offsetY + r * cellSize;

      ctx.beginPath();
      if (style.dotType === 'dots') {
        const radius = cellSize * 0.45;
        ctx.arc(x + cellSize / 2, y + cellSize / 2, radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (style.dotType === 'rounded') {
        if (typeof (ctx as any).roundRect === 'function') {
          (ctx as any).roundRect(x + cellSize * 0.05, y + cellSize * 0.05, cellSize * 0.9, cellSize * 0.9, cellSize * 0.35);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, cellSize, cellSize);
        }
      } else if (style.dotType === 'classy') {
        // Diamond / classy shape
        ctx.moveTo(x + cellSize / 2, y);
        ctx.lineTo(x + cellSize, y + cellSize / 2);
        ctx.lineTo(x + cellSize / 2, y + cellSize);
        ctx.lineTo(x, y + cellSize / 2);
        ctx.closePath();
        ctx.fill();
      } else {
        // Standard square
        ctx.fillRect(x, y, cellSize, cellSize);
      }
    }
  }

  // Draw 3 Corner Finder Patterns (Eyes)
  const eyePositions = [
    { r: 0, c: 0 }, // Top-Left
    { r: 0, c: moduleCount - 7 }, // Top-Right
    { r: moduleCount - 7, c: 0 }, // Bottom-Left
  ];

  eyePositions.forEach(({ r, c }) => {
    const eyeX = offsetX + c * cellSize;
    const eyeY = offsetY + r * cellSize;
    const eyeSize = 7 * cellSize;

    // Outer Frame (7x7)
    ctx.fillStyle = style.foregroundColor || '#000000';
    ctx.beginPath();
    if (style.eyeFrame === 'circle') {
      ctx.arc(eyeX + eyeSize / 2, eyeY + eyeSize / 2, eyeSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (style.eyeFrame === 'rounded' && 'roundRect' in ctx) {
      ctx.roundRect(eyeX, eyeY, eyeSize, eyeSize, cellSize * 1.8);
      ctx.fill();
    } else {
      ctx.fillRect(eyeX, eyeY, eyeSize, eyeSize);
    }

    // Inner Cutout (5x5)
    ctx.fillStyle = style.backgroundColor || '#ffffff';
    ctx.beginPath();
    const innerOffset = 1 * cellSize;
    const innerSize = 5 * cellSize;
    if (style.eyeFrame === 'circle') {
      ctx.arc(eyeX + eyeSize / 2, eyeY + eyeSize / 2, innerSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (style.eyeFrame === 'rounded' && 'roundRect' in ctx) {
      ctx.roundRect(eyeX + innerOffset, eyeY + innerOffset, innerSize, innerSize, cellSize * 1.2);
      ctx.fill();
    } else {
      ctx.fillRect(eyeX + innerOffset, eyeY + innerOffset, innerSize, innerSize);
    }

    // Eye Ball (3x3)
    ctx.fillStyle = style.foregroundColor || '#000000';
    ctx.beginPath();
    const ballOffset = 2 * cellSize;
    const ballSize = 3 * cellSize;
    if (style.eyeBall === 'circle') {
      ctx.arc(eyeX + eyeSize / 2, eyeY + eyeSize / 2, ballSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (style.eyeBall === 'rounded' && 'roundRect' in ctx) {
      ctx.roundRect(eyeX + ballOffset, eyeY + ballOffset, ballSize, ballSize, cellSize * 0.8);
      ctx.fill();
    } else {
      ctx.fillRect(eyeX + ballOffset, eyeY + ballOffset, ballSize, ballSize);
    }
  });

  // Draw Logo if specified
  if (style.logoUrl) {
    try {
      const img = new Image();
      if (style.logoUrl.startsWith('http://') || style.logoUrl.startsWith('https://')) {
        img.crossOrigin = 'anonymous';
      }
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Falha ao carregar imagem da logo'));
        img.src = style.logoUrl!;
      });

      const logoSize = targetSize * (style.logoSize ? style.logoSize / 100 : 0.22);
      const logoX = (targetSize - logoSize) / 2;
      const logoY = (targetSize - logoSize) / 2;
      const badgePadding = cellSize * 0.6;

      // Protective white background badge
      ctx.fillStyle = style.backgroundColor || '#ffffff';
      ctx.beginPath();
      if (typeof (ctx as any).roundRect === 'function') {
        (ctx as any).roundRect(
          logoX - badgePadding,
          logoY - badgePadding,
          logoSize + badgePadding * 2,
          logoSize + badgePadding * 2,
          cellSize * 1.2
        );
      } else {
        ctx.fillRect(
          logoX - badgePadding,
          logoY - badgePadding,
          logoSize + badgePadding * 2,
          logoSize + badgePadding * 2
        );
      }
      ctx.fill();

      // Subtle border for logo badge
      ctx.strokeStyle = `${style.foregroundColor}22`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw logo image
      ctx.drawImage(img, logoX, logoY, logoSize, logoSize);
    } catch (err) {
      console.warn('Could not draw logo on QR Code:', err);
    }
  }
}

// Download helpers
export async function downloadQRCodePNG(
  text: string,
  style: QRStyleConfig,
  filename = 'qrcode.png',
  resolution = 2048
) {
  const offCanvas = document.createElement('canvas');
  await renderQRCodeToCanvas({
    text,
    style,
    canvas: offCanvas,
    targetSize: resolution,
  });

  const url = offCanvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export async function downloadQRCodeSVG(
  text: string,
  style: QRStyleConfig,
  filename = 'qrcode.svg'
) {
  // Generate SVG string using QRCode library
  const svgString = await QRCode.toString(text, {
    type: 'svg',
    margin: style.margin ?? 2,
    color: {
      dark: style.foregroundColor || '#000000',
      light: style.backgroundColor || '#ffffff',
    },
    errorCorrectionLevel: 'H',
  });

  const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadQRCodePDF(
  text: string,
  style: QRStyleConfig,
  metadata: { name: string; clientName?: string; shortCode: string; destinationUrl: string },
  filename = 'qrcode-display.pdf'
) {
  const offCanvas = document.createElement('canvas');
  await renderQRCodeToCanvas({
    text,
    style,
    canvas: offCanvas,
    targetSize: 1200,
  });

  const imgData = offCanvas.toDataURL('image/png');

  // Create A4 PDF (210 x 297 mm)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;

  // Background subtle card frame
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(15, 15, pageWidth - 30, 267, 8, 8, 'F');

  // Outer Border
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.8);
  doc.roundedRect(15, 15, pageWidth - 30, 267, 8, 8, 'D');

  // Header Title
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text(metadata.name, pageWidth / 2, 42, { align: 'center' });

  // Client Name Subtitle
  if (metadata.clientName) {
    doc.setTextColor(79, 70, 229);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(metadata.clientName.toUpperCase(), pageWidth / 2, 50, { align: 'center' });
  }

  // QR Code Image in Center
  const qrSize = 120;
  const qrX = (pageWidth - qrSize) / 2;
  const qrY = 65;

  // White backing for QR code
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 6, 6, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.roundedRect(qrX - 5, qrY - 5, qrSize + 10, qrSize + 10, 6, 6, 'D');

  doc.addImage(imgData, 'PNG', qrX, qrY, qrSize, qrSize);

  // Scan instruction
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('Aponte a câmera do seu celular para escanear', pageWidth / 2, 205, { align: 'center' });

  // Dynamic link info
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Link Dinâmico Direto: ${text}`, pageWidth / 2, 215, { align: 'center' });

  // Destination preview
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  const truncatedDest = metadata.destinationUrl.length > 55
    ? metadata.destinationUrl.substring(0, 52) + '...'
    : metadata.destinationUrl;
  doc.text(`Destino Configurado: ${truncatedDest}`, pageWidth / 2, 222, { align: 'center' });

  // Footer branding
  doc.setDrawColor(226, 232, 240);
  doc.line(30, 250, pageWidth - 30, 250);
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Gerado profissionalmente por QR Dynamic Hub • Plataforma de QR Codes Dinâmicos', pageWidth / 2, 260, {
    align: 'center',
  });

  doc.save(filename);
}
