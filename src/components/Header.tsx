import logo from '@/assets/conexion-fit-logo.png';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { UserCircle } from 'lucide-react';

const Header = () => (
  <header className="bg-card border-b border-border shadow-sm">
    <div className="container mx-auto flex items-center justify-between py-4 px-4">
      <div className="flex items-center gap-3">
        <img src={logo} alt="Conexion Fit" width={56} height={56} className="rounded-lg" />
        <div>
          <h1 className="text-3xl text-secondary tracking-wider leading-none">CONEXION FIT</h1>
          <p className="text-xs text-muted-foreground font-body tracking-widest uppercase">Control de Asistencia</p>
        </div>
      </div>
      <Link to="/portal">
        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
          <UserCircle className="h-3.5 w-3.5" /> Portal Cliente
        </Button>
      </Link>
    </div>
  </header>
);

export default Header;
