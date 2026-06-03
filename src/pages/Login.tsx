import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LogIn, Loader2, UserPlus } from 'lucide-react';
import logo from '@/assets/conexion-fit-logo.png';
import { realImages } from '@/lib/realImages';

const Login = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    const { error } = await signIn(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      navigate('/portal');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    const { error } = await signUp(email, password, fullName);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      // Intentar iniciar sesión inmediatamente (auto-confirm está activado)
      const { error: signInErr } = await signIn(email, password);
      if (signInErr) {
        setInfo('Cuenta creada. Revisa tu correo para confirmar e inicia sesión.');
        setLoading(false);
      } else {
        navigate('/portal');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
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
          <Tabs value={mode} onValueChange={(v) => { setMode(v as 'signin' | 'signup'); setError(''); setInfo(''); }}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="signin">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Registrarse</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-in">Correo electrónico</Label>
                  <Input id="email-in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-in">Contraseña</Label>
                  <Input id="password-in" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
                </div>
                {error && <p className="text-destructive text-sm font-body">{error}</p>}
                {info && <p className="text-primary text-sm font-body">{info}</p>}
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                  Iniciar Sesión
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name-up">Nombre completo</Label>
                  <Input id="name-up" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Tu nombre" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email-up">Correo electrónico</Label>
                  <Input id="email-up" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="correo@ejemplo.com" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password-up">Contraseña</Label>
                  <Input id="password-up" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" minLength={6} required />
                </div>
                {error && <p className="text-destructive text-sm font-body">{error}</p>}
                {info && <p className="text-primary text-sm font-body">{info}</p>}
                <Button type="submit" className="w-full gap-2" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Crear cuenta
                </Button>
                <p className="text-[11px] text-muted-foreground text-center font-body">
                  Las nuevas cuentas tienen acceso al Portal de Cliente. Para acceso de administrador o instructor, contacta al equipo.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
