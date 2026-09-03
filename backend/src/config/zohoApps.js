/**
 * Centralized Zoho Applications Configuration
 * Maps internal application identifiers to required RBAC permissions,
 * direct application launch URLs, and description metadata.
 */
export const ZOHO_APPS = {
  PEOPLE: {
    id: 'PEOPLE',
    name: 'Zoho People',
    permission: 'VIEW_ZOHO_PEOPLE',
    url: 'https://people.zoho.com',
    description: 'Human Resources, Employee Directory, Attendance & Leave Management',
    category: 'Human Resources',
    icon: 'users',
    accentColor: '#3b82f6',
    apiEndpoint: '/api/zoho/people'
  },
  CRM: {
    id: 'CRM',
    name: 'Zoho CRM',
    permission: 'VIEW_ZOHO_CRM',
    url: 'https://www.zoho.com/crm/',
    description: 'Sales Pipeline, Leads, Deals & Customer Relationship Management',
    category: 'Sales',
    icon: 'target',
    accentColor: '#10b981',
    apiEndpoint: '/api/zoho/crm'
  },
  DESK: {
    id: 'DESK',
    name: 'Zoho Desk',
    permission: 'VIEW_ZOHO_DESK',
    url: 'https://desk.zoho.com',
    description: 'Customer Support Helpdesk, Ticket Tracking & Customer Service',
    category: 'Support',
    icon: 'headphones',
    accentColor: '#f59e0b',
    apiEndpoint: '/api/zoho/desk'
  },
  BOOKS: {
    id: 'BOOKS',
    name: 'Zoho Books',
    permission: 'VIEW_ZOHO_BOOKS',
    url: 'https://books.zoho.com',
    description: 'Financial Accounting, Invoices, Expenses & Tax Compliance',
    category: 'Finance',
    icon: 'credit-card',
    accentColor: '#8b5cf6',
    apiEndpoint: '/api/zoho/books'
  }
};
