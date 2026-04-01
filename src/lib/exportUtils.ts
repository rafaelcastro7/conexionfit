import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Client } from '@/hooks/useClients';

const formatCurrency = (v: number) => `$${v.toLocaleString('es-CO')}`;

export function exportClientsPDF(clients: Client[], dateLabel: string) {
  const doc = new jsPDF();

  // Header
  doc.setFontSize(20);
  doc.setTextColor(232, 116, 42);
  doc.text('CONEXIÓN FIT 360', 105, 20, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Reporte de Clientes — ${dateLabel}`, 105, 28, { align: 'center' });
  doc.text(`Generado: ${new Date().toLocaleDateString('es-CO')}`, 105, 34, { align: 'center' });

  // Stats
  const totalClients = clients.length;
  const totalRevenue = clients.reduce((s, c) => s + c.attendance.length * c.unitValue, 0);
  const totalAttendance = clients.reduce((s, c) => s + c.attendance.length, 0);

  doc.setFontSize(11);
  doc.setTextColor(30);
  doc.text(`Clientes: ${totalClients}  |  Asistencias: ${totalAttendance}  |  Facturación: ${formatCurrency(totalRevenue)}`, 14, 44);

  // Table
  autoTable(doc, {
    startY: 50,
    head: [['Nombre', 'Cédula', 'Programa', 'Clases', 'Avance', 'V. Unitario', 'Facturado', 'V. Total', 'Estado']],
    body: clients.map((c) => {
      const attended = c.attendance.length;
      const billed = attended * c.unitValue;
      const done = attended >= c.totalClasses;
      return [
        c.name, c.cedula, c.program,
        `${attended}/${c.totalClasses}`,
        `${Math.round((attended / c.totalClasses) * 100)}%`,
        formatCurrency(c.unitValue),
        formatCurrency(billed),
        formatCurrency(c.totalValue),
        done ? 'Completado' : 'En curso',
      ];
    }),
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [232, 116, 42], textColor: 255 },
    alternateRowStyles: { fillColor: [249, 249, 249] },
  });

  doc.save(`ConexionFit_Clientes_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportClientsExcel(clients: Client[], dateLabel: string) {
  const data = clients.map((c) => ({
    'Nombre': c.name,
    'Cédula': c.cedula,
    'Programa': c.program,
    'Clases Tomadas': c.attendance.length,
    'Total Clases': c.totalClasses,
    'Avance %': Math.round((c.attendance.length / c.totalClasses) * 100),
    'Valor Unitario': c.unitValue,
    'Facturado': c.attendance.length * c.unitValue,
    'Valor Total': c.totalValue,
    'Estado': c.attendance.length >= c.totalClasses ? 'Completado' : 'En curso',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
  XLSX.writeFile(wb, `ConexionFit_Clientes_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportBillingPDF(
  programStats: { program: string; clients: number; totalBilled: number; totalAttendance: number }[],
  totalBilled: number,
  dateLabel: string
) {
  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.setTextColor(232, 116, 42);
  doc.text('CONEXIÓN FIT 360', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(60);
  doc.text('Reporte de Facturación por Programa', 105, 28, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Período: ${dateLabel}`, 105, 35, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(30);
  doc.text(`Total Facturado: ${formatCurrency(totalBilled)}`, 14, 48);

  autoTable(doc, {
    startY: 55,
    head: [['Programa', 'Clientes', 'Asistencias', 'Facturado']],
    body: programStats.map((p) => [p.program, p.clients, p.totalAttendance, formatCurrency(p.totalBilled)]),
    foot: [['TOTAL', '', '', formatCurrency(totalBilled)]],
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [232, 116, 42], textColor: 255 },
    footStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 249, 249] },
  });

  doc.save(`ConexionFit_Facturacion_${new Date().toISOString().split('T')[0]}.pdf`);
}
