export type WelcomeFeatureIcon =
  | 'ShopOutlined'
  | 'DollarOutlined'
  | 'BarChartOutlined'
  | 'TeamOutlined'
  | 'SafetyOutlined'
  | 'CustomerServiceOutlined';

export interface WelcomeFeature {
  id: string;
  title: string;
  description: string;
  icon: WelcomeFeatureIcon;
  color: string;
}

export interface WelcomeTestimonial {
  id: number;
  name: string;
  business: string;
  comment: string;
  rating: number;
}

export interface WelcomeData {
  webName: string;
  logo: string;
  tagline: string;
  version: string;
  section: {
    title: string;
    description: string;
    subtitle: string;
  };
  features: WelcomeFeature[];
  benefits: string[];
  testimonials: WelcomeTestimonial[];
  cta: {
    primary: string;
    secondary: string;
    trial: string;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  social: {
    facebook: string;
    instagram: string;
    twitter: string;
    linkedin: string;
  };
}
