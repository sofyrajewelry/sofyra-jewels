import React from 'react';
import { WhatsAppSettings } from '../types';

interface FloatingWhatsAppButtonProps {
  settings?: WhatsAppSettings;
  fallbackPhone?: string;
}

export const FloatingWhatsAppButton: React.FC<FloatingWhatsAppButtonProps> = ({
  settings,
  fallbackPhone
}) => {
  // If explicitly disabled, do not render
  if (settings && settings.enabled === false) {
    return null;
  }

  // Determine chat link or phone number
  const customLink = settings?.customLink?.trim();
  const phoneNumber = settings?.phoneNumber?.trim() || fallbackPhone?.trim() || '';
  const prefilledMessage =
    settings?.prefilledMessage?.trim() ||
    "Hi! I'm interested in ordering from your store. Can you help me?";

  // Build the target WhatsApp URL
  let targetUrl = '';

  if (customLink) {
    targetUrl = customLink;
  } else if (phoneNumber) {
    // Sanitize phone number (remove spaces, dashes, brackets, leading +)
    const cleanDigits = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanDigits) {
      targetUrl = `https://wa.me/${cleanDigits}?text=${encodeURIComponent(prefilledMessage)}`;
    }
  }

  // If no link or phone number is available, hide the button (strict requirement: never show fake number)
  if (!targetUrl) {
    return null;
  }

  return (
    <aside
      aria-label="Direct WhatsApp Concierge"
      className="fixed bottom-6 right-6 z-40 print:hidden pointer-events-auto"
    >
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with SOFYRA on WhatsApp"
        className="group relative flex items-center justify-center w-14 h-14 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-[0_4px_20px_rgba(37,211,102,0.45)] hover:shadow-[0_6px_26px_rgba(37,211,102,0.6)] hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
      >
        {/* Subtle breathing ripple glow */}
        <span
          className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping -z-10 pointer-events-none"
          aria-hidden="true"
        />

        {/* Official WhatsApp SVG Vector Icon */}
        <svg
          className="w-7 h-7 sm:w-8 sm:h-8 fill-current translate-x-[0.5px]"
          viewBox="0 0 32 32"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M16.002 2C8.28 2 2.02 8.26 2.02 15.982c0 2.607.714 5.15 2.07 7.37L2 30l6.837-2.043a13.93 13.93 0 0 0 7.165 1.988h.006c7.72 0 13.98-6.26 13.98-13.982 0-3.737-1.455-7.25-4.1-9.894A13.91 13.91 0 0 0 16.002 2zm8.167 19.897c-.34.957-1.705 1.76-2.39 1.838-.642.072-1.472.102-4.275-1.06-3.32-1.378-5.46-4.75-5.626-4.97-.16-.22-1.34-1.784-1.34-3.403 0-1.618.848-2.414 1.15-2.744.3-.33.655-.413.874-.413.22 0 .44.002.633.011.205.01.479-.078.75.57.28.667.954 2.33.1037 2.497.083.167.138.363.028.583-.11.22-.165.357-.33.55-.165.193-.347.43-.495.578-.165.165-.337.345-.145.675.192.33 1.853 3.037 3.326 4.35 1.892 1.688 3.518 2.215 4.02 2.463.502.248.796.22 1.09-.11.293-.33 1.258-1.468 1.593-1.974.335-.506.67-.422 1.127-.253.457.17 2.898 1.367 3.395 1.615.497.248.828.371.948.577.12.206.12 1.196-.22 2.153z" />
        </svg>

        {/* Minimal Tooltip for desktop hover */}
        <span className="hidden md:group-hover:inline-block absolute right-16 bg-[#111111] text-white text-[11px] font-medium tracking-wide px-3 py-1.5 whitespace-nowrap shadow-lg border border-stone-800 transition-opacity">
          Chat on WhatsApp
        </span>
      </a>
    </aside>
  );
};
