import React from 'react';
import {
  Sparkles,
  Clock,
  RotateCcw,
  Package,
  ShieldCheck,
  Gem,
  Award,
  Heart,
  Truck,
  Shield,
  CheckCircle2,
  Lock,
  Star,
  Zap
} from 'lucide-react';

export interface AdvantageIconOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const ADVANTAGE_ICONS: AdvantageIconOption[] = [
  { id: 'Sparkles', label: 'Quality & Craft', icon: Sparkles },
  { id: 'Clock', label: 'Timeless Design', icon: Clock },
  { id: 'RotateCcw', label: 'Money Back Guarantee', icon: RotateCcw },
  { id: 'Package', label: 'Secure Packaging', icon: Package },
  { id: 'ShieldCheck', label: 'Buyer Protection', icon: ShieldCheck },
  { id: 'Gem', label: 'Precious Metals & Stones', icon: Gem },
  { id: 'Award', label: 'Certified Excellence', icon: Award },
  { id: 'Heart', label: 'Artisan Crafted', icon: Heart },
  { id: 'Truck', label: 'Insured Delivery', icon: Truck },
  { id: 'Shield', label: 'Authenticity Guarantee', icon: Shield },
  { id: 'CheckCircle2', label: 'Verified Standard', icon: CheckCircle2 },
  { id: 'Lock', label: 'Safe & Secure', icon: Lock }
];

export const renderAdvantageIcon = (iconName?: string, className = 'w-5 h-5'): React.ReactElement => {
  const normalized = (iconName || '').trim().toLowerCase();
  const match = ADVANTAGE_ICONS.find(i => i.id.toLowerCase() === normalized);
  if (match) {
    const IconComp = match.icon;
    return <IconComp className={className} />;
  }
  // Default fallback
  return <Sparkles className={className} />;
};
