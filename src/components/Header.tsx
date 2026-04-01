import logo from '@/assets/conexion-fit-logo.png';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserCircle, BarChart3, Users, LogOut } from 'lucide-react';
import { realImages } from '@/lib/realImages';
import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Badge } from '@/components/ui/badge';

const Header = () => {
  const { pathname } = useLocation();
  const { user, role, signOut } = useAuth();
  const bgImage = useMemo(() => realImages[Math.floor(Math.random() * realImages.length)], []);

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    instructor: 'Instructor',
    client: 'Cliente',
  };

  return (
    <header className="relative overflow-hidden bg-card border-b border-border shadow-sm">
      <div className="absolute inset-0 z-0">
        <img src={bgImage} alt="" className="w-full h-full object-cover opacity-[0.07]" />
      </div>
      <div className="relative z-10 container mx-auto flex items-center justify-between py-3 px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Conexion Fit" width={48} height={48} className="rounded-lg" />
          <div>
            <h1 className="text-2xl sm:text-3xl text-secondary tracking-wider leading-none">CONEXION FIT</h1>
            <p className="text-[10px] text-muted-foreground font-body tracking-widest uppercase">Control de Asistencia</p>
          </div>
        </Link>
        <div className="flex items-center gap-2">
          <nav className="hidden sm:flex items-center gap-1">
            {(role === 'admin' || role === 'instructor') && (
              <Link to="/">
                <Button variant={pathname === '/' ? 'default' : 'ghost'} size="sm" className="gap-1.5 text-xs">
                  <Users className="h-3.5 w-3.5" /> Clientes
                </Button>
              </Link>
            )}
            {role === 'admin' && (
              <Link to="/dashboard">
                <Button variant={pathname === '/dashboard' ? 'default' : 'ghost'} size="sm" className="gap-1.5 text-xs">
                  <BarChart3 className="h-3.5 w-3.5" /> Dashboard
                </Button>
              </Link>
            )}
            <Link to="/portal">
              <Button variant={pathname === '/portal' ? 'default' : 'outline'} size="sm" className="gap-1.5 text-xs">
                <UserCircle className="h-3.5 w-3.5" /> Portal
              </Button>
            </Link>
          </nav>
          {user && (
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-[10px] font-body hidden sm:inline-flex">
                {roleLabels[role || ''] || 'Usuario'}
              </Badge>
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-1 text-xs text-muted-foreground">
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
      {/* Mobile nav */}
      <div className="sm:hidden relative z-10 border-t border-border/50 flex">
        {(role === 'admin' || role === 'instructor') && (
          <Link to="/" className="flex-1">
            <Button variant={pathname === '/' ? 'default' : 'ghost'} size="sm" className="w-full rounded-none gap-1 text-[10px]">
              <Users className="h-3 w-3" /> Clientes
            </Button>
          </Link>
        )}
        {role === 'admin' && (
          <Link to="/dashboard" className="flex-1">
            <Button variant={pathname === '/dashboard' ? 'default' : 'ghost'} size="sm" className="w-full rounded-none gap-1 text-[10px]">
              <BarChart3 className="h-3 w-3" /> Dashboard
            </Button>
          </Link>
        )}
        <Link to="/portal" className="flex-1">
          <Button variant={pathname === '/portal' ? 'default' : 'ghost'} size="sm" className="w-full rounded-none gap-1 text-[10px]">
            <UserCircle className="h-3 w-3" /> Portal
          </Button>
        </Link>
      </div>
    </header>
  );
};

export default Header;
