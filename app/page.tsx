"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Brand, AdMockup } from "@/lib/types";
import {
  loadBrands,
  saveBrands,
  loadMockups,
  saveMockups,
  generateId,
} from "@/lib/storage";
import { BrandSelector } from "@/components/brand-selector";
import { AdForm } from "@/components/ad-form";
import { AdPreview } from "@/components/ad-preview";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/components/ui/logo";

export default function Home() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [mockups, setMockups] = useState<AdMockup[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string | null>(null);
  const [currentMockup, setCurrentMockup] = useState<Partial<AdMockup>>({
    platform: "facebook",
    primaryText: "",
    headline: "",
    description: "",
    imageUrl: "",
    ctaLabel: "Learn more",
    name: "",
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Update URL query parameters
  const updateQueryParams = (
    brandId: string | null,
    mockupId: string | null
  ) => {
    const params = new URLSearchParams();
    if (brandId) {
      params.set("brandId", brandId);
    }
    if (mockupId) {
      params.set("mockupId", mockupId);
    }
    const queryString = params.toString();
    const newUrl = queryString ? `?${queryString}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  };

  // Load data and initialize from query params (only on mount)
  useEffect(() => {
    if (isInitialized) return; // Prevent re-initialization

    const loadedBrands = loadBrands();
    const loadedMockups = loadMockups();
    setBrands(loadedBrands);
    setMockups(loadedMockups);

    // Check for query params
    const brandIdParam = searchParams.get("brandId");
    const mockupIdParam = searchParams.get("mockupId");

    if (brandIdParam) {
      const brand = loadedBrands.find((b) => b.id === brandIdParam);
      if (brand) {
        setSelectedBrandId(brandIdParam);

        // If there's also a mockupId, load that mockup
        if (mockupIdParam) {
          const mockup = loadedMockups.find(
            (m) => m.id === mockupIdParam && m.brandId === brandIdParam
          );
          if (mockup) {
            setCurrentMockup(mockup);
          }
        } else {
          // Reset to empty mockup for the selected brand
          setCurrentMockup({
            platform: "facebook",
            primaryText: "",
            headline: "",
            description: "",
            imageUrl: "",
            ctaLabel: "Learn more",
            name: "",
            brandId: brandIdParam,
          });
        }
      }
    }

    setIsInitialized(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  const selectedBrand = brands.find((b) => b.id === selectedBrandId) || null;
  const filteredMockups = mockups.filter((m) => m.brandId === selectedBrandId);

  const handleBrandCreate = (brand: Brand) => {
    const updatedBrands = [...brands, brand];
    setBrands(updatedBrands);
    saveBrands(updatedBrands);
    // Note: URL will be updated by handleBrandSelect which is called after brand creation
    toast({
      title: "Brand created",
      description: `${brand.name} has been created successfully`,
    });
  };

  const handleBrandUpdate = (brand: Brand) => {
    const updatedBrands = brands.map((b) => (b.id === brand.id ? brand : b));
    setBrands(updatedBrands);
    saveBrands(updatedBrands);
    toast({
      title: "Brand updated",
      description: `${brand.name} has been updated successfully`,
    });
  };

  const handleBrandSelect = (brandId: string) => {
    setSelectedBrandId(brandId);
    setCurrentMockup({
      ...currentMockup,
      brandId,
      id: undefined,
      name: "",
    });
    // Update URL - clear mockupId when brand changes
    updateQueryParams(brandId, null);
  };

  const handleSaveMockup = () => {
    if (!selectedBrandId || !currentMockup.name?.trim()) return;

    const mockupToSave: AdMockup = {
      id: currentMockup.id || generateId(),
      brandId: selectedBrandId,
      name: currentMockup.name,
      platform: currentMockup.platform || "facebook",
      primaryText: currentMockup.primaryText || "",
      headline: currentMockup.headline || "",
      description: currentMockup.description || "",
      imageUrl: currentMockup.imageUrl || "",
      ctaLabel: currentMockup.ctaLabel || "Learn more",
      createdAt: currentMockup.createdAt || new Date().toISOString(),
    };

    let updatedMockups: AdMockup[];
    if (currentMockup.id) {
      updatedMockups = mockups.map((m) =>
        m.id === currentMockup.id ? mockupToSave : m
      );
      toast({
        title: "Mockup updated",
        description: `${mockupToSave.name} has been updated`,
      });
    } else {
      updatedMockups = [...mockups, mockupToSave];
      toast({
        title: "Mockup saved",
        description: `${mockupToSave.name} has been saved`,
      });
    }

    setMockups(updatedMockups);
    saveMockups(updatedMockups);
    setCurrentMockup(mockupToSave);
    // Update URL with the saved mockup ID
    updateQueryParams(selectedBrandId, mockupToSave.id);
  };

  const handleLoadMockup = (mockupId: string) => {
    const mockup = mockups.find((m) => m.id === mockupId);
    if (mockup) {
      setCurrentMockup(mockup);
      setSelectedBrandId(mockup.brandId);
      // Update URL with both brand and mockup
      updateQueryParams(mockup.brandId, mockupId);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              <Logo />
            </h1>
            <p className="mt-2 text-gray-600">
              Create, save, and export beautiful Facebook and Instagram ad
              mockups for your clients
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <BrandSelector
                brands={brands}
                selectedBrandId={selectedBrandId}
                onBrandSelect={handleBrandSelect}
                onBrandCreate={handleBrandCreate}
                onBrandUpdate={handleBrandUpdate}
              />
              <AdForm
                mockup={currentMockup}
                mockups={filteredMockups}
                onMockupChange={setCurrentMockup}
                onSaveMockup={handleSaveMockup}
                onLoadMockup={handleLoadMockup}
                disabled={!selectedBrandId}
              />
            </div>

            <div className="space-y-6">
              <div className="sticky top-8">
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Preview
                  </h2>
                  <div className="bg-gray-100 rounded-lg p-8">
                    <AdPreview
                      ref={previewRef}
                      mockup={currentMockup}
                      brand={selectedBrand}
                      previewRef={previewRef}
                      brandName={selectedBrand?.name}
                      mockupName={currentMockup.name}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
}
