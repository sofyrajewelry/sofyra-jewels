import React from 'react';
import { WhySofyra } from './WhySofyra';
import { AdvantagesSectionConfig, WhySofyraSectionConfig } from '../types';

interface AdvantagesSectionProps {
  advantagesSection?: AdvantagesSectionConfig | WhySofyraSectionConfig;
  advantagesData?: any;
}

export const AdvantagesSection: React.FC<AdvantagesSectionProps> = ({ advantagesSection }) => {
  return <WhySofyra config={advantagesSection as WhySofyraSectionConfig} />;
};
