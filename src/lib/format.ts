export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR').format(Math.round(amount)) + ' FCFA';
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  new: 'Nouvelle',
  awaiting_payment: 'En attente de paiement',
  payment_to_verify: 'Paiement à vérifier',
  payment_confirmed: 'Paiement confirmé',
  preparing: 'En préparation',
  ready: 'Prête',
  delivering: 'En livraison',
  delivered: 'Livrée',
  completed: 'Terminée',
  cancelled: 'Annulée',
  refused: 'Refusée',
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  awaiting_payment: 'En attente de paiement',
  payment_to_verify: 'À vérifier',
  confirmed: 'Confirmé',
  refused: 'Refusé',
  refunded: 'Remboursé',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  orange_money: 'Orange Money',
  moov_money: 'Moov Money',
  mtn_money: 'MTN Mobile Money',
  cash_on_delivery: 'Paiement à la livraison',
  pay_on_arrival: 'Paiement sur place',
};

export const RESERVATION_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  refused: 'Refusée',
  cancelled: 'Annulée',
  completed: 'Terminée',
  no_show: 'Client absent',
};

export const ORDER_TIMELINE_STEPS = [
  { key: 'new', label: 'Commande reçue' },
  { key: 'payment_confirmed', label: 'Paiement confirmé' },
  { key: 'preparing', label: 'En préparation' },
  { key: 'ready', label: 'Prête' },
  { key: 'delivered', label: 'Livrée' },
];

export function isRestaurantOpen(
  hours: Record<string, { open: string; close: string; closed: boolean }> | undefined
): boolean {
  if (!hours) return false;
  const now = new Date();
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayKey = dayNames[now.getDay()];
  const today = hours[dayKey];
  if (!today || today.closed) return false;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = today.open.split(':').map(Number);
  const [closeH, closeM] = today.close.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

export function getTodayHours(
  hours: Record<string, { open: string; close: string; closed: boolean }> | undefined
): string {
  if (!hours) return '';
  const dayNames = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const dayKey = dayNames[new Date().getDay()];
  const today = hours[dayKey];
  if (!today || today.closed) return "Fermé aujourd'hui";
  return `${today.open} - ${today.close}`;
}
