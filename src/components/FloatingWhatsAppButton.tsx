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
        className="group relative flex items-center justify-center w-14 h-14 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#25D366]/50"
      >
        {/* Official WhatsApp SVG Vector Icon */}
        <svg
          className="w-8 h-8 fill-current"
          viewBox="0 0 448 512"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
        </svg>

        {/* Minimal Tooltip for desktop hover */}
        <span className="hidden md:group-hover:inline-block absolute right-16 bg-[#111111] text-white text-[11px] font-medium tracking-wide px-3 py-1.5 whitespace-nowrap shadow-lg border border-stone-800 transition-opacity">
          Chat on WhatsApp
        </span>
      </a>
    </aside>
  );
};
