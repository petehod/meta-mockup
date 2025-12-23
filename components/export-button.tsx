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

export function ExportButton({
  previewRef,
  brandName,
  mockupName,
}: ExportButtonProps) {
  const { toast } = useToast();

  const convertBlobToDataUrl = (blobUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!blobUrl.startsWith("blob:")) {
        resolve(blobUrl);
        return;
      }

      fetch(blobUrl)
        .then((res) => res.blob())
        .then((blob) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
        .catch(reject);
    });
  };

  const waitForImages = async (element: HTMLElement): Promise<void> => {
    const images = Array.from(element.querySelectorAll("img"));
    const videos = Array.from(element.querySelectorAll("video"));

    if (images.length === 0 && videos.length === 0) {
      return;
    }

      // Convert blob URLs to data URLs for stability
      await Promise.all(
        images.map(async (img) => {
          if (!img.isConnected) {
            return;
          }

          // Convert blob URLs to data URLs before export
          if (img.src && img.src.startsWith("blob:")) {
            try {
              const dataUrl = await convertBlobToDataUrl(img.src);
              // Set up load handler before changing src
              await new Promise<void>((resolve, reject) => {
                const timeout = setTimeout(() => {
                  reject(new Error("Timeout loading converted image"));
                }, 5000);
                const onLoad = () => {
                  clearTimeout(timeout);
                  img.removeEventListener("load", onLoad);
                  img.removeEventListener("error", onError);
                  resolve();
                };
                const onError = () => {
                  clearTimeout(timeout);
                  img.removeEventListener("load", onLoad);
                  img.removeEventListener("error", onError);
                  reject(new Error("Failed to load converted image"));
                };
                img.addEventListener("load", onLoad);
                img.addEventListener("error", onError);
                img.src = dataUrl;
              });
            } catch (err) {
              console.warn("Failed to convert blob URL to data URL:", err);
              throw err;
            }
          }
        })
      );

    // Now wait for all images and videos to be ready
    return new Promise((resolve, reject) => {
      let loadedCount = 0;
      let errorCount = 0;
      const total = images.length + videos.length;
      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for images to load"));
      }, 10000);

      const checkComplete = () => {
        loadedCount++;
        if (loadedCount + errorCount === total) {
          clearTimeout(timeout);
          if (errorCount > 0) {
            reject(new Error("Some images failed to load"));
          } else {
            resolve();
          }
        }
      };

      images.forEach((img) => {
        if (!img.isConnected) {
          checkComplete();
          return;
        }

        // If complete but has no dimensions, it failed to load
        if (img.complete && img.naturalHeight === 0 && img.naturalWidth === 0) {
          errorCount++;
          checkComplete();
          return;
        }

        if (img.complete && img.naturalHeight !== 0) {
          checkComplete();
        } else {
          img.onload = checkComplete;
          img.onerror = () => {
            errorCount++;
            checkComplete();
          };
        }
      });

      videos.forEach((video) => {
        if (video.readyState >= 2) {
          checkComplete();
        } else {
          video.onloadedmetadata = checkComplete;
          video.onerror = () => {
            errorCount++;
            checkComplete();
          };
        }
      });
    });
  };

  const handleExport = async () => {
    if (!previewRef.current) return;

    try {
      // Wait for all images and videos to load before exporting
      await waitForImages(previewRef.current);

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
        description:
          error instanceof Error
            ? error.message
            : "There was an error exporting your mockup",
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
