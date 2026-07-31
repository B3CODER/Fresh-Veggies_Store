import { MessageCircle } from 'lucide-react';

interface WhatsAppButtonProps {
  number: string;
  storeName?: string;
}

export function WhatsAppButton({ number, storeName }: WhatsAppButtonProps) {
  if (!number) return null;

  const clean = number.replace(/\D/g, '');
  const message = encodeURIComponent(
    `Hi${storeName ? ` ${storeName}` : ''}! I'd like to know more about your vegetables.`,
  );
  const url = `https://wa.me/${clean}?text=${message}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-4 z-50 flex items-center gap-2 bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-full shadow-lg px-4 py-3 transition-all duration-200"
      aria-label="Contact on WhatsApp"
    >
      <MessageCircle className="w-5 h-5" />
      <span className="text-sm font-semibold hidden sm:inline">Chat with us</span>
    </a>
  );
}
