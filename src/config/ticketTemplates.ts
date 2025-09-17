// src/config/ticketTemplates.ts
import { TicketTemplate } from '@/types/ticket';

export const TICKET_TEMPLATES: TicketTemplate[] = [
  {
    id: 'classic',
    name: 'Classic Blue',
    backgroundColor: '#ffffff',
    accentColor: '#2563eb',
    textColor: '#1f2937',
    borderStyle: 'solid',
    showLogo: true,
    logoPosition: 'top-left',
    qrPosition: 'right',
  },
  {
    id: 'premium',
    name: 'Premium Gold',
    backgroundColor: '#fffbeb',
    accentColor: '#d97706',
    textColor: '#92400e',
    borderStyle: 'solid',
    showLogo: true,
    logoPosition: 'top-right',
    qrPosition: 'right',
  },
  {
    id: 'modern',
    name: 'Modern Dark',
    backgroundColor: '#1f2937',
    accentColor: '#10b981',
    textColor: '#f9fafb',
    borderStyle: 'dashed',
    showLogo: true,
    logoPosition: 'center',
    qrPosition: 'bottom',
  },
];

// ✅ Get template by ID
export const getTemplateById = (id: string): TicketTemplate => {
  return TICKET_TEMPLATES.find(template => template.id === id) || TICKET_TEMPLATES[0];
};

// ✅ Extract styles
export const getTemplateStyles = (template: TicketTemplate) => ({
  backgroundColor: template.backgroundColor,
  color: template.textColor,
  borderColor: template.accentColor,
  borderStyle: template.borderStyle,
});

export const getAccentStyles = (template: TicketTemplate) => ({
  color: template.accentColor,
  borderColor: template.accentColor,
});

// ✅ New helper: pick a random template
export const getRandomTemplateId = (): string => {
  const randomIndex = Math.floor(Math.random() * TICKET_TEMPLATES.length);
  return TICKET_TEMPLATES[randomIndex].id;
};
