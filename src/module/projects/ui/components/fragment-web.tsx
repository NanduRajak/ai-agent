import { useState } from "react";
import {
  ExternalLinkIcon,
  RefreshCcwIcon,
  AlertTriangleIcon,
} from "lucide-react";

import { Fragment } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/hint";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  data: Fragment;
}

export function FragmentWeb({ data }: Props) {
  const [copied, setCopied] = useState(false);
  const [fragmentKey, setFragmentKey] = useState(0);

  const onRefresh = () => {
    setFragmentKey((prev) => prev + 1);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(data.sandboxUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple check if sandbox URL exists and looks valid
  const hasValidUrl = data.sandboxUrl && data.sandboxUrl.startsWith("https://");

  return (
    <div className="flex flex-col w-full h-full">
      <div className="p-2 border-b bg-sidebar flex items-center gap-x-2">
        <Hint text="Refresh" side="bottom" align="start">
          <Button size="sm" variant="outline" onClick={onRefresh}>
            <RefreshCcwIcon />
          </Button>
        </Hint>
        <Hint text="Click to copy" side="bottom">
          <Button
            size="sm"
            variant="outline"
            onClick={handleCopy}
            disabled={!data.sandboxUrl || copied}
            className="flex-1 justify-start font-normal"
          >
            <span className="truncate">{data.sandboxUrl}</span>
          </Button>
        </Hint>
        <Hint text="Open in a new tab" side="bottom" align="start">
          <Button
            size="sm"
            disabled={!data.sandboxUrl}
            variant="outline"
            onClick={() => {
              if (!data.sandboxUrl) return;
              window.open(data.sandboxUrl, "_blank");
            }}
          >
            <ExternalLinkIcon />
          </Button>
        </Hint>
      </div>

      {!hasValidUrl ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <Alert className="max-w-md">
            <AlertTriangleIcon className="h-4 w-4" />
            <AlertDescription>
              No preview available. The sandbox URL is missing or invalid.
            </AlertDescription>
          </Alert>
        </div>
      ) : (
        <iframe
          key={fragmentKey}
          className="h-full w-full border-0"
          src={data.sandboxUrl}
          title="Sandbox Preview"
          allow="camera; microphone; fullscreen; display-capture"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
          loading="lazy"
        />
      )}
    </div>
  );
}
