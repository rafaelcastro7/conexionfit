import { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Printer, QrCode } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClassQRDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classTitle: string;
  classDate: string;
  startTime: string;
  endTime: string;
  checkinToken: string;
}

const ClassQRDialog = ({ open, onOpenChange, classTitle, classDate, startTime, endTime, checkinToken }: ClassQRDialogProps) => {
  const svgRef = useRef<HTMLDivElement>(null);

  const checkinUrl = `${window.location.origin}/checkin/${checkinToken}`;

  const downloadPNG = () => {
    const svg = svgRef.current?.querySelector('svg');
    if (!svg) return;
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svg);
    const canvas = document.createElement('canvas');
    const size = 600;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, 0, 0, size, size);
      URL.revokeObjectURL(url);
      canvas.toBlob((b) => {
        if (!b) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = `qr-${classTitle.replace(/\s+/g, '-')}-${classDate}.png`;
        a.click();
      });
    };
    img.src = url;
  };

  const printQR = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    const dateStr = format(new Date(classDate + 'T12:00:00'), "EEEE d 'de' MMMM yyyy", { locale: es });
    w.document.write(`
      <html><head><title>QR ${classTitle}</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 40px; }
        h1 { font-size: 28px; margin-bottom: 8px; }
        p { font-size: 16px; color: #555; margin: 4px 0; }
        .qr { margin: 30px auto; display: inline-block; padding: 20px; border: 2px solid #000; }
        .footer { margin-top: 30px; font-size: 14px; color: #888; }
      </style></head><body>
        <h1>${classTitle}</h1>
        <p><strong>${dateStr}</strong></p>
        <p>${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}</p>
        <div class="qr">${svgRef.current?.innerHTML || ''}</div>
        <p class="footer">Escanea este código al llegar a clase para registrar tu asistencia</p>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => w.print(), 300);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wide flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" /> Check-in QR
          </DialogTitle>
          <DialogDescription className="font-body">
            {classTitle} · {format(new Date(classDate + 'T12:00:00'), "d MMM yyyy", { locale: es })} · {startTime.slice(0, 5)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center py-4 space-y-4">
          <div ref={svgRef} className="bg-white p-4 rounded-lg border-2 border-border">
            <QRCodeSVG value={checkinUrl} size={240} level="H" includeMargin={false} />
          </div>
          <p className="text-xs text-muted-foreground font-body text-center max-w-xs">
            Los clientes escanean este código al llegar para registrar su asistencia automáticamente. Imprímelo y pégalo en la entrada del salón.
          </p>
          <code className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded font-mono break-all max-w-full">
            {checkinUrl}
          </code>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={downloadPNG} className="gap-1.5">
            <Download className="h-4 w-4" /> PNG
          </Button>
          <Button onClick={printQR} className="gap-1.5">
            <Printer className="h-4 w-4" /> Imprimir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClassQRDialog;
