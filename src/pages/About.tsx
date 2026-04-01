import { Link } from 'react-router-dom';
import logo from '@/assets/conexion-fit-logo.png';
import { realImages } from '@/lib/realImages';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users, BarChart3, CalendarCheck, Shield, Smartphone, FileSpreadsheet,
  Download, UserCircle, Dumbbell, TrendingUp, ArrowLeft, CheckCircle2,
  Star, Zap, Globe, Lock, Heart
} from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Gestión de Clientes',
    description: 'Matricula clientes con múltiples programas simultáneos. Cada programa tiene su propio paquete de clases, valor unitario y seguimiento independiente.',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: CalendarCheck,
    title: 'Control de Asistencia',
    description: 'Registro preciso de cada clase con fecha, número de sesión y cálculo automático del valor acumulado. Historial completo accesible en todo momento.',
    color: 'text-success',
    bg: 'bg-success/10',
  },
  {
    icon: UserCircle,
    title: 'Portal del Cliente',
    description: 'Cada cliente consulta su progreso ingresando su cédula: clases tomadas, pendientes, valor acumulado, historial de asistencia y estado del programa.',
    color: 'hsl(200, 70%, 50%)',
    bg: 'bg-blue-500/10',
  },
  {
    icon: BarChart3,
    title: 'Dashboard Administrativo',
    description: 'Panel con estadísticas en tiempo real: facturación por programa, asistencias, clientes activos, gráficos interactivos y filtros por rango de fechas.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Shield,
    title: 'Roles y Seguridad',
    description: 'Sistema de autenticación con tres roles (Administrador, Instructor, Cliente). Cada rol tiene acceso solo a las funciones que le corresponden con RLS.',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    icon: Dumbbell,
    title: 'Multi-Programa',
    description: 'Un cliente puede estar inscrito en Funcional, Yoga, Pilates, Rumba y más simultáneamente, con seguimiento independiente por cada programa.',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    icon: FileSpreadsheet,
    title: 'Importar y Exportar',
    description: 'Importa clientes masivamente desde archivos Excel/CSV. Exporta reportes profesionales en PDF con facturación, asistencia y estado de clientes.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: Smartphone,
    title: 'PWA — App Instalable',
    description: 'Instala la aplicación en tu celular como una app nativa. Acceso directo desde la pantalla de inicio, sin necesidad de tiendas de aplicaciones.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
];

const programs = [
  { name: 'FUNCIONAL', desc: 'Entrenamiento de alta intensidad con movimientos funcionales' },
  { name: 'PILATEX', desc: 'Fortalecimiento del core y flexibilidad con técnicas de Pilates' },
  { name: 'RUMBA', desc: 'Cardio y diversión con ritmos latinos y coreografías' },
  { name: 'CROSSFIT', desc: 'Entrenamiento cruzado de fuerza y resistencia' },
  { name: 'YOGA', desc: 'Equilibrio cuerpo-mente con posturas y respiración' },
  { name: 'SPINNING', desc: 'Ciclismo indoor de alta intensidad' },
  { name: 'GAP', desc: 'Glúteos, abdominales y piernas — tonificación total' },
  { name: 'BOXEO', desc: 'Técnica y cardio con entrenamiento de combate' },
];

const stats = [
  { value: '8', label: 'Programas Disponibles' },
  { value: '∞', label: 'Clientes Sin Límite' },
  { value: '3', label: 'Roles de Acceso' },
  { value: '24/7', label: 'Disponibilidad' },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="grid grid-cols-3 grid-rows-2 w-full h-full">
            {realImages.map((img, i) => (
              <div key={i} className="relative overflow-hidden">
                <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            ))}
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/90 via-secondary/85 to-secondary/95" />
        </div>

        <div className="relative z-10 container mx-auto px-4 py-16 text-center">
          <Link to="/portal" className="inline-flex items-center gap-2 text-primary-foreground/60 hover:text-primary-foreground text-sm mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Volver al Portal
          </Link>

          <div className="flex justify-center mb-6">
            <img src={logo} alt="Conexión Fit 360" className="w-24 h-24 rounded-2xl shadow-2xl ring-2 ring-primary/30" />
          </div>

          <h1 className="font-display text-6xl sm:text-7xl text-primary-foreground tracking-wider mb-2">
            CONEXIÓN FIT <span className="text-primary">360</span>
          </h1>
          <p className="text-primary-foreground/70 font-body text-lg max-w-2xl mx-auto mb-8">
            Sistema integral de gestión para gimnasios y centros de entrenamiento.
            Control total de clientes, asistencia, facturación y programas en una sola plataforma.
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-1.5 text-sm font-body">
              <Zap className="h-4 w-4 mr-1.5" /> Tiempo Real
            </Badge>
            <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-1.5 text-sm font-body">
              <Lock className="h-4 w-4 mr-1.5" /> Seguro
            </Badge>
            <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-1.5 text-sm font-body">
              <Smartphone className="h-4 w-4 mr-1.5" /> Móvil
            </Badge>
            <Badge className="bg-primary/20 text-primary border-primary/30 px-4 py-1.5 text-sm font-body">
              <Globe className="h-4 w-4 mr-1.5" /> Cloud
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {stats.map((s) => (
              <div key={s.label} className="rounded-xl bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/10 p-4">
                <p className="font-display text-4xl text-primary">{s.value}</p>
                <p className="text-primary-foreground/60 font-body text-xs mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <p className="text-primary font-body text-sm uppercase tracking-[0.3em] mb-2">Todo lo que necesitas</p>
          <h2 className="font-display text-4xl text-secondary tracking-wider">FUNCIONALIDADES</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <Card key={f.title} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50">
              <CardContent className="pt-6">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.bg} mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon className={`h-6 w-6 ${f.color}`} />
                </div>
                <h3 className="font-display text-xl text-secondary tracking-wide mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Programs */}
      <section className="bg-secondary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary font-body text-sm uppercase tracking-[0.3em] mb-2">Variedad de opciones</p>
            <h2 className="font-display text-4xl text-secondary tracking-wider">PROGRAMAS DISPONIBLES</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {programs.map((p) => (
              <div key={p.name} className="rounded-xl bg-card border border-border/50 p-5 text-center hover:shadow-md transition-all hover:border-primary/30">
                <Dumbbell className="h-8 w-8 text-primary mx-auto mb-3" />
                <h3 className="font-display text-xl text-secondary tracking-wider mb-1">{p.name}</h3>
                <p className="text-xs text-muted-foreground font-body">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <p className="text-primary font-body text-sm uppercase tracking-[0.3em] mb-2">Simple y eficiente</p>
          <h2 className="font-display text-4xl text-secondary tracking-wider">¿CÓMO FUNCIONA?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {[
            { step: '01', title: 'Matrícula', desc: 'El administrador registra al cliente con sus datos y selecciona uno o más programas con paquetes de clases.', icon: Users },
            { step: '02', title: 'Asistencia', desc: 'El cliente o instructor registra cada clase. El sistema calcula automáticamente valores y avance.', icon: CalendarCheck },
            { step: '03', title: 'Seguimiento', desc: 'Dashboard con métricas en tiempo real. El cliente consulta su progreso desde el portal.', icon: TrendingUp },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <span className="font-display text-3xl text-primary">{s.step}</span>
              </div>
              <h3 className="font-display text-2xl text-secondary tracking-wide mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section className="bg-secondary/5 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-primary font-body text-sm uppercase tracking-[0.3em] mb-2">Acceso controlado</p>
            <h2 className="font-display text-4xl text-secondary tracking-wider">ROLES DEL SISTEMA</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              {
                role: 'Administrador', icon: Shield, color: 'text-primary', bg: 'bg-primary/10',
                perms: ['Crear y gestionar clientes', 'Ver dashboard completo', 'Exportar reportes PDF/Excel', 'Importar datos masivos', 'Registrar asistencia', 'Eliminar clientes']
              },
              {
                role: 'Instructor', icon: Dumbbell, color: 'text-emerald-500', bg: 'bg-emerald-500/10',
                perms: ['Ver listado de clientes', 'Registrar asistencia', 'Acceder al portal de clientes', 'Consultar progreso']
              },
              {
                role: 'Cliente', icon: Heart, color: 'text-rose-500', bg: 'bg-rose-500/10',
                perms: ['Consultar progreso por cédula', 'Ver clases tomadas y pendientes', 'Registrar asistencia', 'Ver historial completo', 'Acceder desde el celular']
              },
            ].map((r) => (
              <Card key={r.role} className="border-border/50">
                <CardContent className="pt-6">
                  <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl ${r.bg} mb-4`}>
                    <r.icon className={`h-7 w-7 ${r.color}`} />
                  </div>
                  <h3 className="font-display text-2xl text-secondary tracking-wide mb-4">{r.role}</h3>
                  <ul className="space-y-2">
                    {r.perms.map((p) => (
                      <li key={p} className="flex items-start gap-2 text-sm text-muted-foreground font-body">
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tech */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <p className="text-primary font-body text-sm uppercase tracking-[0.3em] mb-2">Tecnología moderna</p>
          <h2 className="font-display text-4xl text-secondary tracking-wider">CONSTRUIDO CON</h2>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          {['React 18', 'TypeScript', 'Tailwind CSS', 'Lovable Cloud', 'PWA', 'Recharts', 'Vite'].map((t) => (
            <Badge key={t} variant="outline" className="px-4 py-2 text-sm font-body border-border">
              <Star className="h-3.5 w-3.5 mr-1.5 text-primary" /> {t}
            </Badge>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={realImages[0]} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-secondary/90" />
        </div>
        <div className="relative z-10 container mx-auto px-4 py-16 text-center">
          <h2 className="font-display text-4xl text-primary-foreground tracking-wider mb-4">¿LISTO PARA EMPEZAR?</h2>
          <p className="text-primary-foreground/70 font-body mb-8 max-w-lg mx-auto">
            Accede al portal de clientes o inicia sesión como administrador para gestionar tu gimnasio.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/portal">
              <Button size="lg" className="gap-2 text-base px-8">
                <UserCircle className="h-5 w-5" /> Portal del Cliente
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="gap-2 text-base px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                <Shield className="h-5 w-5" /> Administración
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-secondary text-primary-foreground/60 py-8">
        <div className="container mx-auto px-4 text-center">
          <img src={logo} alt="Conexión Fit" className="w-12 h-12 mx-auto mb-3 rounded-lg" />
          <p className="font-display text-xl text-primary-foreground tracking-wider mb-1">CONEXIÓN FIT 360</p>
          <p className="text-xs font-body">Sistema de Gestión para Gimnasios y Centros de Entrenamiento</p>
          <p className="text-xs font-body mt-4 text-primary-foreground/40">
            © {new Date().getFullYear()} Conexión Fit 360 — Todos los derechos reservados
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <a href="https://www.instagram.com/conexionfit360/" target="_blank" rel="noopener noreferrer" className="text-primary-foreground/40 hover:text-primary transition-colors text-xs font-body">
              @conexionfit360
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default About;
