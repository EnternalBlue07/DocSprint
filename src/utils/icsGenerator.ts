import { AdmissionPlaybook } from '../types';

/**
 * Generates an RFC-5545 compliant VCALENDAR file content.
 * Offsets each sequential step by 5 days from the reference results date.
 * Fully client-side, zero server calls.
 */
export function generatePlaybookICS(playbook: AdmissionPlaybook, referenceDateStr: string): string {
  const refDate = new Date(referenceDateStr);
  
  const formatDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}T090000`;
  };

  const formatEndDate = (date: Date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}${m}${d}T170000`;
  };

  const sanitizeString = (str: string) => {
    return str.replace(/[,;]/g, '\\$&').replace(/\n/g, '\\n');
  };

  let ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DocSprint//Admission Radar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  playbook.steps.forEach((step, idx) => {
    // Dynamic sequence offsets (5 days gap per step)
    const start = new Date(refDate.getTime() + idx * 5 * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days duration per step event

    const uid = `${playbook.id}-step-${step.order}-${Date.now()}@docsprint.os`;
    const summary = sanitizeString(`Step ${step.order}: ${step.title} (${playbook.title})`);
    
    const docs = step.documentsNeeded.map(d => d.name).join(', ');
    const descText = `Description: ${step.description}\nTiming: ${step.timingWindow}\nRequired Docs: ${docs}`;
    const description = sanitizeString(descText);

    ics = ics.concat([
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatDate(new Date())}Z`,
      `DTSTART:${formatDate(start)}`,
      `DTEND:${formatEndDate(end)}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      'END:VEVENT'
    ]);
  });

  ics.push('END:VCALENDAR');
  return ics.join('\r\n');
}

/**
 * Initiates in-browser download of the generated calendar string.
 */
export function downloadICSFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
