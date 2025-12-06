export interface Brand {
  id: string;
  name: string;
  logoUrl: string;
}

export interface AdMockup {
  id: string;
  brandId: string;
  name: string;
  platform: "facebook" | "instagram";
  primaryText: string;
  headline: string;
  description: string;
  imageUrl: string;
  ctaLabel: string;
  createdAt: string;
}
