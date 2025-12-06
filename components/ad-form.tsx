"use client";

import { AdMockup } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

interface AdFormProps {
  mockup: Partial<AdMockup>;
  mockups: AdMockup[];
  onMockupChange: (mockup: Partial<AdMockup>) => void;
  onSaveMockup: () => void;
  onLoadMockup: (mockupId: string) => void;
  disabled?: boolean;
}

export function AdForm({ mockup, mockups, onMockupChange, onSaveMockup, onLoadMockup, disabled }: AdFormProps) {
  const updateField = <K extends keyof AdMockup>(field: K, value: AdMockup[K]) => {
    onMockupChange({ ...mockup, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ad Mockup</CardTitle>
        <CardDescription>Create and customize your Facebook or Instagram ad</CardDescription>
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
            <Select value={mockup.id || ""} onValueChange={onLoadMockup} disabled={disabled}>
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
            onValueChange={(value) => updateField("platform", value as "facebook" | "instagram")}
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
          <Label htmlFor="image-url">Image URL</Label>
          <Input
            id="image-url"
            value={mockup.imageUrl || ""}
            onChange={(e) => updateField("imageUrl", e.target.value)}
            placeholder="https://example.com/image.jpg"
            disabled={disabled}
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

        <Button onClick={onSaveMockup} className="w-full" disabled={disabled || !mockup.name?.trim()}>
          <Save className="mr-2 h-4 w-4" />
          Save Mockup
        </Button>
      </CardContent>
    </Card>
  );
}
