"use client";

import { useState, useEffect } from "react";
import { Brand } from "@/lib/types";
import { generateId } from "@/lib/storage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Pencil } from "lucide-react";

interface BrandSelectorProps {
  brands: Brand[];
  selectedBrandId: string | null;
  onBrandSelect: (brandId: string) => void;
  onBrandCreate: (brand: Brand) => void;
  onBrandUpdate: (brand: Brand) => void;
}

export function BrandSelector({ brands, selectedBrandId, onBrandSelect, onBrandCreate, onBrandUpdate }: BrandSelectorProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [brandName, setBrandName] = useState("");
  const [brandLogoUrl, setBrandLogoUrl] = useState("");

  useEffect(() => {
    if (isEditing && selectedBrandId) {
      const selectedBrand = brands.find(b => b.id === selectedBrandId);
      if (selectedBrand) {
        setBrandName(selectedBrand.name);
        setBrandLogoUrl(selectedBrand.logoUrl);
      }
    } else if (!isEditing) {
      setBrandName("");
      setBrandLogoUrl("");
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand</CardTitle>
        <CardDescription>Select or create a brand for your ad mockup</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isCreating && !isEditing ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="brand-select">Select Brand</Label>
              <Select value={selectedBrandId || ""} onValueChange={onBrandSelect}>
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
              <Button onClick={() => setIsCreating(true)} variant="outline" className="flex-1">
                <Plus className="mr-2 h-4 w-4" />
                New Brand
              </Button>
              {selectedBrandId && (
                <Button onClick={() => setIsEditing(true)} variant="outline" size="icon">
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
              <Label htmlFor="brand-logo">Logo URL</Label>
              <Input
                id="brand-logo"
                value={brandLogoUrl}
                onChange={(e) => setBrandLogoUrl(e.target.value)}
                placeholder="https://example.com/logo.png"
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
