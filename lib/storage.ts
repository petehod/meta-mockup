import { Brand, AdMockup } from "./types";

const BRANDS_KEY = "adtool_brands_v1";
const MOCKUPS_KEY = "adtool_mockups_v1";

export function loadBrands(): Brand[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(BRANDS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading brands:", error);
    return [];
  }
}

export function saveBrands(brands: Brand[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(BRANDS_KEY, JSON.stringify(brands));
  } catch (error) {
    console.error("Error saving brands:", error);
  }
}

export function loadMockups(): AdMockup[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(MOCKUPS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("Error loading mockups:", error);
    return [];
  }
}

export function saveMockups(mockups: AdMockup[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(MOCKUPS_KEY, JSON.stringify(mockups));
  } catch (error) {
    console.error("Error saving mockups:", error);
  }
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
