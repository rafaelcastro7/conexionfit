import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, AlertCircle, ScanLine, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const Scanner = () => {
  const navigate = useNavigate();
  const containerId = 'qr-scanner-region';
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [lastScan, setLastScan] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const html5Qr = new Html5Qrcode(containerId, { verbose: false });
    scannerRef.current = html5Qr;

    const start = async () => {
      try {
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          setError('No se detectó ninguna cámara en este dispositivo.');
          setStarting(false);
          return;
        }
        // Prefer rear camera
        const rear = cameras.find((c) => /back|rear|environment/i.test(c.label)) || cameras[cameras.length - 1];
        if (cancelled) return;
        await html5Qr.start(
          rear.id,
          { fps: 10, qrbox: { width: 280, height: 280 } },
          (decoded) => {
            if (cancelled) return;
            // Expect URLs like https://<host>/checkin/<token>
            try {
              const url = new URL(decoded);
              const match = url.pathname.match(/^\/checkin\/([0-9a-f-]+)/i);
              if (match) {
                if (lastScan === decoded) return;
                setLastScan(decoded);
                toast.success('QR detectado, abriendo check-in…');
                navigate(`/checkin/${match[1]}`);
              } else {
                setError('QR no reconocido como código de clase Conexión Fit.');
              }
            } catch {
              setError('El código escaneado no es una URL válida.');
            }
          },
          () => { /* per-frame failures ignored */ },
        );
        setStarting(false);
      } catch (e: any) {
        setError(e?.message || 'No se pudo acceder a la cámara.');
        setStarting(false);
      }
    };

    start();

    return () => {
      cancelled = true;
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          scannerRef.current?.clear();
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background p-4 flex flex-col">
      <header className="flex items-center justify-between mb-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/portal"><ArrowLeft className="h-4 w-4" /> Volver</Link>
        </Button>
        <h1 className="font-display text-lg tracking-wide text-secondary flex items-center gap-2">
          <ScanLine className="h-5 w-5 text-primary" /> Escáner de Recepción
        </h1>
        <span className="w-20" />
      </header>

      <Card className="flex-1 max-w-2xl w-full mx-auto shadow-xl">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-xl tracking-wide text-secondary flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" /> Apunta al QR de la clase
          </CardTitle>
          <p className="text-xs text-muted-foreground font-body">
            Coloca el código QR de la clase frente a la cámara. La detección es automática.
          </p>
        </CardHeader>
        <CardContent>
          <div className="relative rounded-lg overflow-hidden bg-muted aspect-square max-w-md mx-auto border-2 border-primary/30">
            <div id={containerId} className="w-full h-full" />
            {starting && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-body text-muted-foreground">Iniciando cámara…</p>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-destructive">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="text-xs font-body">
                <p className="font-semibold">No se puede escanear</p>
                <p>{error}</p>
                <p className="mt-1 text-destructive/80">
                  Asegúrate de permitir el acceso a la cámara y de usar HTTPS.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Scanner;
