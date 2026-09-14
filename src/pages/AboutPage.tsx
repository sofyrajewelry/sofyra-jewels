import React from 'react';
import { AboutSection } from '../components/AboutSection';
import { AboutSofyraConfig } from '../types';

interface AboutPageProps {
  onNavigate: (page: string, data?: any) => void;
  aboutData?: AboutSofyraConfig;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate, aboutData }) => {
  return (
    <AboutSection
      aboutData={aboutData}
      onNavigate={onNavigate}
      isFullPage={true}
    />
  );
};
