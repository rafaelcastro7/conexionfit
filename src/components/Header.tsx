import logo from '@/assets/conexion-fit-logo.png';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserCircle, BarChart3, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const Header = () => {
  const { pathname } = useLocation();

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="container mx-auto flex items-center justify-between py-4 px-4">
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Conexion Fit" width={56} height={56} className="rounded-lg" />
          <div>
            <h1 className="text-3xl text-secondary tracking-wider leading-none">CONEXION FIT</h1>
            <p className="text-xs text-muted-foreground font-body tracking-widest uppercase">Control de Asistencia</p>
          </div>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/">
            <Button variant={pathname === '/' ? 'default' : 'ghost'} size="sm" className="gap-1.5 text-xs">
              <Users className="h-3.5 w-3.5" /> Clientes
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant={pathname === '/dashboard' ? 'default' : 'ghost'} size="sm" className="gap-1.5 text-xs">
              <BarChart3 className="h-3.5 w-3.5" /> Dashboard
            </Button>
          </Link>
          <Link to="/portal">
            <Button variant={pathname === '/portal' ? 'default' : 'outline'} size="sm" className="gap-1.5 text-xs">
              <UserCircle className="h-3.5 w-3.5" /> Portal
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
