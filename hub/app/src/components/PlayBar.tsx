import { Maximize2, RotateCw } from "lucide-react";
import { IconButton } from "./IconButton";
import { CopyButton } from "./CopyButton";
import { border, text } from "../styles/tokens";

interface PlayBarProps {
  gameName: string;
  shareUrl: string;
  onFullscreen?: () => void;
  onReload?: () => void;
  onCopyShare?: () => void;
}

export function PlayBar({
  gameName,
  shareUrl,
  onFullscreen,
  onReload,
  onCopyShare,
}: PlayBarProps) {
  return (
    <div className={`flex shrink-0 flex-col gap-2 ${border.bar} ${border.barBg} px-4 py-3 sm:flex-row sm:items-center sm:justify-between`}>
      <div className="flex items-center justify-between gap-3 sm:justify-start">
        <h2 className={`text-sm font-semibold truncate ${text.primary}`}>
          {gameName}
        </h2>
        <div className="flex items-center gap-1">
          <IconButton
            icon={Maximize2}
            label="Fullscreen"
            onClick={onFullscreen}
            variant="ghost"
          />
          <IconButton
            icon={RotateCw}
            label="Reload game"
            onClick={onReload}
            variant="ghost"
          />
          <CopyButton
            text={shareUrl}
            label="Copy share link"
            onCopy={onCopyShare}
            className="!h-9 !w-auto !px-2.5"
          />
        </div>
      </div>
      <p className={`text-xs ${text.muted}`}>
        Share this link with friends
      </p>
    </div>
  );
}
