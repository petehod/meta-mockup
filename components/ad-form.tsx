"use client";

import { useState, useRef, useEffect } from "react";
import { AdMockup } from "@/lib/types";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Upload } from "lucide-react";

interface AdFormProps {
  mockup: Partial<AdMockup>;
  mockups: AdMockup[];
  onMockupChange: (mockup: Partial<AdMockup>) => void;
  onSaveMockup: () => void;
  onLoadMockup: (mockupId: string) => void;
  disabled?: boolean;
}

export function AdForm({
  mockup,
  mockups,
  onMockupChange,
  onSaveMockup,
  onLoadMockup,
  disabled,
}: AdFormProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [displayImageUrl, setDisplayImageUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateField = <K extends keyof AdMockup>(
    field: K,
    value: AdMockup[K]
  ) => {
    onMockupChange({ ...mockup, [field]: value });
  };

  // Load media from IndexedDB when mockup changes
  useEffect(() => {
    if (mockup.imageUrl) {
      if (isMediaId(mockup.imageUrl)) {
        getMediaURL(mockup.imageUrl).then((url) => {
          if (url) setDisplayImageUrl(url);
        });
      } else {
        setDisplayImageUrl(mockup.imageUrl);
      }
    } else {
      setDisplayImageUrl("");
    }
  }, [mockup.imageUrl]);

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      return;
    }

    try {
      // Store file in IndexedDB and get media ID
      const mediaId = await storeMediaFile(file);
      updateField("imageUrl", mediaId);

      // Create object URL for preview
      const url = await getMediaURL(mediaId);
      if (url) setDisplayImageUrl(url);
    } catch (error) {
      console.error("Error storing media file:", error);
      // Fallback to data URL for small files
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        updateField("imageUrl", dataUrl);
        setDisplayImageUrl(dataUrl);
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
        <CardTitle>Ad Mockup</CardTitle>
        <CardDescription>
          Create and customize your Facebook or Instagram ad
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {disabled && (
          <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            Select or create a brand to start creating ad mockups
          </div>
        )}

        {mockups.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="load-mockup">Load Saved Mockup</Label>
            <Select
              value={mockup.id || ""}
              onValueChange={onLoadMockup}
              disabled={disabled}
            >
              <SelectTrigger id="load-mockup">
                <SelectValue placeholder="Select a mockup to load..." />
              </SelectTrigger>
              <SelectContent>
                {mockups.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} ({m.platform})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="mockup-name">Internal Name</Label>
          <Input
            id="mockup-name"
            value={mockup.name || ""}
            onChange={(e) => updateField("name", e.target.value)}
            placeholder="e.g., Hook v1 or Winter Siding Concept A"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="platform">Platform</Label>
          <Select
            value={mockup.platform || "facebook"}
            onValueChange={(value) =>
              updateField("platform", value as "facebook" | "instagram")
            }
            disabled={disabled}
          >
            <SelectTrigger id="platform">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="primary-text">Primary Text</Label>
          <Textarea
            id="primary-text"
            value={mockup.primaryText || ""}
            onChange={(e) => updateField("primaryText", e.target.value)}
            placeholder="Enter the main ad copy..."
            rows={4}
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="image-url">Image/Video</Label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed rounded-md p-4 transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-gray-300 hover:border-gray-400"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <div className="text-sm text-gray-600 text-center">
                <span className="font-medium">Drag and drop</span> an image or
                video here, or{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary underline disabled:opacity-50"
                  disabled={disabled}
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
                disabled={disabled}
              />
            </div>
            {displayImageUrl && (
              <div className="mt-3 pt-3 border-t">
                <div className="text-xs text-gray-500 mb-2">Current media:</div>
                {displayImageUrl.startsWith("blob:") ||
                displayImageUrl.startsWith("data:image/") ||
                (displayImageUrl.startsWith("http") &&
                  displayImageUrl.match(/\.(jpg|jpeg|png|gif|webp)/i)) ? (
                  <img
                    src={displayImageUrl}
                    alt="Ad creative"
                    className="max-h-32 w-auto rounded"
                  />
                ) : displayImageUrl.startsWith("data:video/") ||
                  (displayImageUrl.startsWith("http") &&
                    displayImageUrl.match(/\.(mp4|webm|ogg|mov)/i)) ||
                  displayImageUrl.startsWith("blob:") ? (
                  <video
                    src={displayImageUrl}
                    className="max-h-32 w-auto rounded"
                    controls={false}
                  />
                ) : (
                  <div className="text-xs text-gray-400 truncate">
                    {mockup.imageUrl}
                  </div>
                )}
              </div>
            )}
          </div>
          <Input
            id="image-url"
            value={mockup.imageUrl || ""}
            onChange={(e) => {
              const value = e.target.value;
              updateField("imageUrl", value);
              // If it's a URL (not a media ID), update display immediately
              if (!isMediaId(value)) {
                setDisplayImageUrl(value);
              }
            }}
            placeholder="Or enter a URL..."
            disabled={disabled}
            className="mt-2"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="headline">Headline</Label>
          <Input
            id="headline"
            value={mockup.headline || ""}
            onChange={(e) => updateField("headline", e.target.value)}
            placeholder="Enter headline..."
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={mockup.description || ""}
            onChange={(e) => updateField("description", e.target.value)}
            placeholder="Enter description (optional)"
            disabled={disabled}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="cta-label">CTA Button</Label>
          <Input
            id="cta-label"
            value={mockup.ctaLabel || "Learn more"}
            onChange={(e) => updateField("ctaLabel", e.target.value)}
            placeholder="e.g., Learn more, Get quote"
            disabled={disabled}
          />
        </div>

        <Button
          onClick={onSaveMockup}
          className="w-full"
          disabled={disabled || !mockup.name?.trim()}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Mockup
        </Button>
      </CardContent>
    </Card>
  );
}
