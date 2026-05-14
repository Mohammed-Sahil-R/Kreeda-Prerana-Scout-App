import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { Student, PerformanceLog, BENCHMARKS } from '../types';

export const exportFullDataPDF = (students: Student[], logs: PerformanceLog[], schoolName: string) => {
  const doc = new jsPDF();
  const date = format(new Date(), 'dd MMM yyyy');

  doc.setFontSize(22);
  doc.setTextColor(59, 130, 246); // blue-600
  doc.text('Kreeda-Prerana Scout Report', 14, 20);

  doc.setFontSize(14);
  doc.setTextColor(100);
  doc.text(`School: ${schoolName}`, 14, 30);
  doc.text(`Date: ${date}`, 14, 38);

  const tableData = students.map(student => {
    const studentLogs = logs.filter(l => l.studentId === student.id);
    const sprint = studentLogs.filter(l => l.testType === 'sprint_100m').sort((a, b) => a.value - b.value)[0];
    const longJump = studentLogs.filter(l => l.testType === 'long_jump').sort((a, b) => b.value - a.value)[0];
    
    return [
      student.name,
      student.id.slice(-6).toUpperCase(),
      student.age,
      student.primarySport,
      sprint ? `${sprint.value}s` : '-',
      longJump ? `${longJump.value}m` : '-'
    ];
  });

  const renderTable = typeof autoTable === 'function' ? autoTable : (autoTable as any).default;

  renderTable(doc, {
    startY: 50,
    head: [['Name', 'ID', 'Age', 'Sport', 'Best 100m', 'Best Long Jump']],
    body: tableData,
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 }
  });

  doc.save(`Kreeda_Prerana_Full_Report_${format(new Date(), 'yyyyMMdd')}.pdf`);
};

export const exportStudentPDF = (student: Student, logs: PerformanceLog[], schoolName?: string, coachName?: string) => {
  const doc = new jsPDF();
  const studentLogs = logs
    .filter(l => l.studentId === student.id)
    .sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));

  // Determine Badges
  const achievements = BENCHMARKS.filter(b => {
    const relevantLogs = studentLogs.filter(l => l.testType === b.testType);
    if (relevantLogs.length === 0) return false;
    if (b.testType === 'sprint_100m') return relevantLogs.some(l => l.value <= b.threshold);
    return relevantLogs.some(l => l.value >= b.threshold);
  });
  
  const levels = achievements.map(a => a.level);
  const badges = [];
  if (levels.includes('National')) badges.push('GOLD');
  if (levels.includes('State')) badges.push('SILVER');
  if (levels.includes('District')) badges.push('BRONZE');

  // Header Background
  doc.setFillColor(15, 23, 42); // midnight
  doc.rect(0, 0, 210, 80, 'F');

  // Photo
  if (student.photoUrl) {
    try {
      doc.addImage(student.photoUrl, 'JPEG', 15, 15, 50, 50);
    } catch (e) {
      // Fallback if image fails
      doc.setDrawColor(255);
      doc.rect(15, 15, 50, 50, 'S');
      doc.setTextColor(255);
      doc.text(student.name.charAt(0), 35, 45);
    }
  } else {
    doc.setDrawColor(255);
    doc.rect(15, 15, 50, 50, 'S');
    doc.setTextColor(255);
    doc.setFontSize(30);
    doc.text(student.name.charAt(0), 35, 45);
  }

  // Name and ID
  doc.setTextColor(255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(student.name.toUpperCase(), 75, 30);
  
  doc.setFontSize(10);
  doc.setFont('courier', 'bold');
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text(`ATHLETE ID: ${student.id.toUpperCase()}`, 75, 38);

  // Specialist Tag
  doc.setFillColor(37, 99, 235); // electric blue
  doc.rect(75, 45, 80, 10, 'F');
  doc.setTextColor(255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${student.primarySport.toUpperCase()} SPECIALIST`, 80, 51.5);

  // Badge Display
  if (badges.length > 0) {
    doc.setTextColor(245, 158, 11); // amber
    doc.setFontSize(12);
    doc.text(`LEVEL REACHED: ${badges.join(' / ')}`, 75, 65);
  } else {
    doc.setTextColor(200);
    doc.setFontSize(12);
    doc.text(`LEVEL REACHED: ACTIVE PARTICIPANT`, 75, 65);
  }

  // Details Section
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('ATHLETE DETAILS', 14, 90);
  doc.line(14, 92, 60, 92);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Age: ${student.age} Years`, 14, 100);
  doc.text(`Gender: ${student.gender}`, 14, 107);
  doc.text(`Sport: ${student.primarySport}`, 14, 114);

  doc.setFont('helvetica', 'bold');
  doc.text('COACHING INFO', 100, 90);
  doc.line(100, 92, 160, 92);

  doc.setFont('helvetica', 'normal');
  doc.text(`School: ${schoolName || 'Grassroots Academy'}`, 100, 100);
  doc.text(`Coach: ${coachName || 'Authorized Mentor'}`, 100, 107);
  doc.text(`Date Issued: ${format(new Date(), 'dd MMM yyyy')}`, 100, 114);

  // Results Section
  doc.setFont('helvetica', 'bold');
  doc.text('TRIAL PERFORMANCE HISTORY', 14, 130);

  const tableData = studentLogs.map(log => [
    format(log.timestamp?.toDate?.() || new Date(), 'dd MMM yyyy, h:mm a'),
    log.testType.replace('_', ' ').toUpperCase(),
    `${log.value}${log.testType === 'sprint_100m' ? 's' : 'm'}`
  ]);

  const renderTable = typeof autoTable === 'function' ? autoTable : (autoTable as any).default;

  renderTable(doc, {
    startY: 135,
    head: [['Date of Trial', 'Test Conducted', 'Verified Result']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42] },
    alternateRowStyles: { fillColor: [248, 250, 252] }
  });

  // Footer
  const pageHeight = doc.internal.pageSize.height;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text('This card is a digital record of athlete performance on Kreeda-Prerana Scout Platform.', 105, pageHeight - 10, { align: 'center' });

  doc.save(`${student.name.replace(/\s+/g, '_')}_TalentCard.pdf`);
};
