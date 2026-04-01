import logo from '@/assets/conexion-fit-logo.png';

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
    </div>
  </header>
);

export default Header;
