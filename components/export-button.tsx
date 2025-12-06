"use client";

import { RefObject } from "react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportButtonProps {
  previewRef: RefObject<HTMLDivElement>;
  brandName?: string;
  mockupName?: string;
}

export function ExportButton({ previewRef, brandName, mockupName }: ExportButtonProps) {
  const { toast } = useToast();

  const handleExport = async () => {
    if (!previewRef.current) return;

    try {
      const dataUrl = await toPng(previewRef.current, {
        cacheBust: true,
        pixelRatio: 2,
      });

      const link = document.createElement("a");
      const filename = `${brandName || "ad"}-${mockupName || "mockup"}.png`
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-");
      link.download = filename;
      link.href = dataUrl;
      link.click();

      toast({
        title: "Export successful",
        description: "Your ad mockup has been downloaded as PNG",
      });
    } catch (error) {
      console.error("Error exporting image:", error);
      toast({
        title: "Export failed",
        description: "There was an error exporting your mockup",
        variant: "destructive",
      });
    }
  };

  return (
    <Button onClick={handleExport} className="w-full" size="lg">
      <Download className="mr-2 h-4 w-4" />
      Download PNG
    </Button>
  );
}
