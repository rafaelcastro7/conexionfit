import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { LogIn, Loader2 } from 'lucide-react';
import logo from '@/assets/conexion-fit-logo.png';
import { realImages } from '@/lib/realImages';

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="grid grid-cols-3 grid-rows-2 w-full h-full">
          {realImages.map((img, i) => (
            <div key={i} className="relative overflow-hidden">
              <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-secondary/90 backdrop-blur-sm" />
      </div>

      <Card className="relative z-10 w-full max-w-md mx-4 bg-card/95 backdrop-blur-md shadow-2xl border-border/50">
        <CardHeader className="text-center pb-2">
          <img src={logo} alt="Conexion Fit" className="w-20 h-20 mx-auto rounded-xl mb-3" />
          <h1 className="font-display text-3xl text-secondary tracking-wider">CONEXION FIT</h1>
          <p className="text-xs text-muted-foreground font-body tracking-widest uppercase">Sistema de Gestión</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="text-destructive text-sm font-body">{error}</p>}
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
              Iniciar Sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
