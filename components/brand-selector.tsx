"use client";

import { useState, useEffect, useRef } from "react";
import { Brand } from "@/lib/types";
import { generateId } from "@/lib/storage";
import { storeMediaFile, getMediaURL, isMediaId } from "@/lib/media-storage";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, X, Pencil, Upload } from "lucide-react";

interface BrandSelectorProps {
  brands: Brand[];
  selectedBrandId: string | null;
  onBrandSelect: (brandId: string) => void;
  onBrandCreate: (brand: Brand) => void;
  onBrandUpdate: (brand: Brand) => void;
}

export function BrandSelector({
  brands,
  selectedBrandId,
  onBrandSelect,
  onBrandCreate,
  onBrandUpdate,
}: BrandSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");
  const [displayLogoUrl, setDisplayLogoUrl] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && selectedBrandId) {
      const selectedBrand = brands.find((b) => b.id === selectedBrandId);
      if (selectedBrand) {
        setBrandName(selectedBrand.name);
        setBrandLogoUrl(selectedBrand.logoUrl);
        // Load media from IndexedDB if it's a media ID
        if (isMediaId(selectedBrand.logoUrl)) {
          getMediaURL(selectedBrand.logoUrl).then((url) => {
            if (url) setDisplayLogoUrl(url);
          });
        } else {
          setDisplayLogoUrl(selectedBrand.logoUrl);
        }
      }
    } else if (!isEditing) {
      setBrandName("");
      setBrandLogoUrl("");
      setDisplayLogoUrl("");
    }
  }, [isEditing, selectedBrandId, brands]);

  const handleCreateBrand = () => {
    if (!brandName.trim()) return;

    const newBrand: Brand = {
      id: generateId(),
      name: brandName.trim(),
      logoUrl: brandLogoUrl.trim(),
    };

    onBrandCreate(newBrand);
    onBrandSelect(newBrand.id);
    setBrandName("");
    setBrandLogoUrl("");
    setIsCreating(false);
  };

  const handleUpdateBrand = () => {
    if (!brandName.trim() || !selectedBrandId) return;

    const updatedBrand: Brand = {
      id: selectedBrandId,
      name: brandName.trim(),
      logoUrl: brandLogoUrl.trim(),
    };

    onBrandUpdate(updatedBrand);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setBrandName("");
    setBrandLogoUrl("");
    setIsCreating(false);
    setIsEditing(false);
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return;
    }

    try {
      // Store file in IndexedDB and get media ID
      const mediaId = await storeMediaFile(file);
      setBrandLogoUrl(mediaId);

      // Create object URL for preview
      const url = await getMediaURL(mediaId);
      if (url) setDisplayLogoUrl(url);
    } catch (error) {
      console.error("Error storing media file:", error);
      // Fallback to data URL for small files
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setBrandLogoUrl(dataUrl);
        setDisplayLogoUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand</CardTitle>
        <CardDescription>
          Select or create a brand for your ad mockup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isCreating && !isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="brand-select">Select Brand</Label>
              <Select
                value={selectedBrandId || ""}
                onValueChange={onBrandSelect}
              >
                <SelectTrigger id="brand-select">
                  <SelectValue placeholder="Select a brand..." />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setIsCreating(true)}
                variant="outline"
                className="flex-1"
              >
                <Plus className="mr-2 h-4 w-4" />
                New Brand
              </Button>
              {selectedBrandId && (
                <Button
                  onClick={() => setIsEditing(true)}
                  variant="outline"
                  size="icon"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand-name">Brand Name</Label>
              <Input
                id="brand-name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Enter brand name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-logo">Logo</Label>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-md p-4 transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <div className="flex flex-col items-center justify-center gap-2">
                  <Upload className="h-8 w-8 text-gray-400" />
                  <div className="text-sm text-gray-600 text-center">
                    <span className="font-medium">Drag and drop</span> an image
                    or video here, or{" "}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-primary hover:underline"
                    >
                      browse
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />
                </div>
                {displayLogoUrl && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="text-xs text-gray-500 mb-2">
                      Current logo:
                    </div>
                    {displayLogoUrl.startsWith("data:video/") ||
                    (displayLogoUrl.startsWith("http") &&
                      displayLogoUrl.match(/\.(mp4|webm|ogg|mov)/i)) ? (
                      <video
                        src={displayLogoUrl}
                        className="max-h-20 w-auto rounded"
                        controls={false}
                      />
                    ) : displayLogoUrl.startsWith("blob:") ||
                      displayLogoUrl.startsWith("data:image/") ||
                      (displayLogoUrl.startsWith("http") &&
                        displayLogoUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)) ? (
                      <img
                        src={displayLogoUrl}
                        alt="Brand logo"
                        className="max-h-20 w-auto rounded"
                      />
                    ) : (
                      <div className="text-xs text-gray-400 truncate">
                        {brandLogoUrl}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <Input
                id="brand-logo"
                value={brandLogoUrl}
                onChange={(e) => {
                  const value = e.target.value;
                  setBrandLogoUrl(value);
                  // If it's a URL (not a media ID), update display immediately
                  if (!isMediaId(value)) {
                    setDisplayLogoUrl(value);
                  }
                }}
                placeholder="Or enter a URL..."
                className="mt-2"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={isEditing ? handleUpdateBrand : handleCreateBrand}
                className="flex-1"
                disabled={!brandName.trim()}
              >
                {isEditing ? "Update Brand" : "Create Brand"}
              </Button>
              <Button onClick={handleCancel} variant="outline" size="icon">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
