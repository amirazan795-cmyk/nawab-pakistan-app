export function formatWhatsAppNumber(rawPhone?: string): string {
  const digits = (rawPhone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('92')) return digits;
  if (digits.startsWith('0')) return `92${digits.slice(1)}`;
  return `92${digits}`;
}

export function buildWhatsAppBookingUrl(rawPhone: string | undefined, message: string): string {
  const waNumber = formatWhatsAppNumber(rawPhone);
  if (!waNumber) return '';
  return `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;
}
