"use client";

import { useState, forwardRef, useEffect, useRef, RefObject } from "react";
import { Brand, AdMockup } from "@/lib/types";
import { getMediaURL, isMediaId, getMediaType } from "@/lib/media-storage";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Download } from "lucide-react";
import { toPng } from "html-to-image";
import { useToast } from "@/hooks/use-toast";

interface AdPreviewProps {
  mockup: Partial<AdMockup>;
  brand: Brand | null;
  previewRef?: RefObject<HTMLDivElement>;
  brandName?: string;
  mockupName?: string;
}

export const AdPreview = forwardRef<HTMLDivElement, AdPreviewProps>(
  ({ mockup, brand, previewRef, brandName, mockupName }, ref) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [displayImageUrl, setDisplayImageUrl] = useState<string>("");
    const [displayLogoUrl, setDisplayLogoUrl] = useState<string>("");
    const [aspectRatio, setAspectRatio] = useState<number | null>(null);
    const [isVideo, setIsVideo] = useState<boolean>(false);
    const imageRef = useRef<HTMLImageElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const { toast } = useToast();
    const primaryText = mockup.primaryText || "";
    const shouldCollapse = primaryText.length > 125;
    const displayText =
      shouldCollapse && !isExpanded
        ? primaryText.slice(0, 125) + "..."
        : primaryText;

    // Use previewRef if provided, otherwise use the forwarded ref
    const containerRef = previewRef || ref;

    const handleExport = async () => {
      // Get the actual DOM element from the ref
      let targetElement: HTMLDivElement | null = null;
      if (containerRef) {
        if (typeof containerRef === "function") {
          // Can't get element from callback ref, need to use a different approach
          return;
        } else {
          targetElement = containerRef.current;
        }
      }
      if (!targetElement) return;

      try {
        const dataUrl = await toPng(targetElement, {
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

    // Load media from IndexedDB
    useEffect(() => {
      // Reset aspect ratio when image URL changes
      setAspectRatio(null);
      setIsVideo(false);

      const imageUrl = mockup.imageUrl;
      if (imageUrl) {
        // Determine if it's a video
        const checkVideoType = async () => {
          if (isMediaId(imageUrl)) {
            const mediaType = await getMediaType(imageUrl);
            setIsVideo(mediaType?.startsWith("video/") || false);
            const url = await getMediaURL(imageUrl);
            if (url) {
              setDisplayImageUrl(url);
            }
          } else {
            // Check URL patterns for video
            const isVideoUrl =
              imageUrl.startsWith("data:video/") ||
              (imageUrl.startsWith("http") &&
                imageUrl.match(/\.(mp4|webm|ogg|mov)/i));
            setIsVideo(!!isVideoUrl);
            setDisplayImageUrl(imageUrl);
          }
        };
        checkVideoType();
      } else {
        setDisplayImageUrl("");
      }
    }, [mockup.imageUrl]);

    // Calculate aspect ratio when image loads
    const handleImageLoad = () => {
      if (imageRef.current) {
        const { naturalWidth, naturalHeight } = imageRef.current;
        if (naturalWidth && naturalHeight) {
          setAspectRatio(naturalWidth / naturalHeight);
        }
      }
    };

    // Calculate aspect ratio when video loads
    const handleVideoLoadedMetadata = () => {
      if (videoRef.current) {
        const { videoWidth, videoHeight } = videoRef.current;
        if (videoWidth && videoHeight) {
          setAspectRatio(videoWidth / videoHeight);
        }
      }
    };

    useEffect(() => {
      if (brand?.logoUrl) {
        if (isMediaId(brand.logoUrl)) {
          getMediaURL(brand.logoUrl).then((url) => {
            if (url) setDisplayLogoUrl(url);
          });
        } else {
          setDisplayLogoUrl(brand.logoUrl);
        }
      } else {
        setDisplayLogoUrl("");
      }
    }, [brand?.logoUrl]);

    return (
      <div className="flex justify-center">
        <div
          ref={containerRef}
          className="w-[375px] bg-white rounded-lg shadow-sm border"
        >
          <div className="p-3 flex items-center gap-3 border-b">
            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
              {displayLogoUrl ? (
                <img
                  src={displayLogoUrl}
                  alt={brand?.name || "Brand"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  Logo
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">
                {brand?.name || "Brand Name"}
              </div>
              <div className="text-xs text-gray-500">Sponsored</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 flex-shrink-0"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Download PNG
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {primaryText && (
            <div className="px-3 pt-3 pb-2">
              <p className="text-sm whitespace-pre-wrap break-words">
                {displayText}
              </p>
              {shouldCollapse && (
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="text-sm text-gray-500 hover:text-gray-700 font-medium mt-1"
                >
                  {isExpanded ? "See less" : "See more"}
                </button>
              )}
            </div>
          )}

          {displayImageUrl && (
            <div
              className="w-full bg-gray-100 overflow-hidden"
              style={
                aspectRatio
                  ? {
                      aspectRatio: aspectRatio.toString(),
                    }
                  : {
                      aspectRatio: "1",
                      minHeight: "200px",
                    }
              }
            >
              {isVideo ? (
                <video
                  key={displayImageUrl}
                  ref={videoRef}
                  src={displayImageUrl}
                  className="w-full h-full object-cover"
                  controls
                  playsInline
                  onLoadedMetadata={handleVideoLoadedMetadata}
                />
              ) : (
                <img
                  key={displayImageUrl}
                  ref={imageRef}
                  src={displayImageUrl}
                  alt="Ad creative"
                  className="w-full h-full object-cover"
                  onLoad={handleImageLoad}
                  onError={() => {
                    console.error("Failed to load image:", displayImageUrl);
                  }}
                />
              )}
            </div>
          )}

          <div className="p-3 border-t bg-gray-50 flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500 mb-1">
                {brand?.name?.toLowerCase().replace(/\s+/g, "") || "brand"}.com
              </div>
              {mockup.headline && (
                <div className="font-semibold text-sm mb-1">
                  {mockup.headline}
                </div>
              )}
              {mockup.description && (
                <div className="text-sm text-gray-600">
                  {mockup.description}
                </div>
              )}
            </div>
            <Button
              className="flex-shrink-0 mt-1"
              size="sm"
              variant="secondary"
            >
              {mockup.ctaLabel || "Learn more"}
            </Button>
          </div>

          {mockup.platform === "instagram" && (
            <div className="px-3 py-2 border-t flex items-center gap-4 text-gray-600">
              <button className="hover:text-gray-900">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </button>
              <button className="hover:text-gray-900">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </button>
              <button className="hover:text-gray-900">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

AdPreview.displayName = "AdPreview";
