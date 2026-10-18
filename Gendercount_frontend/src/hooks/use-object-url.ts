import { useLayoutEffect, useState } from "react";

/**
 * Returns a temporary URL for a file and revokes it when the file changes or the component unmounts.
 * The URL is only ever returned for the file it was created from, so a stale (revoked) URL is never rendered.
 */
export const useObjectUrl = (file: Blob | null) => {
  const [entry, setEntry] = useState<{ file: Blob; url: string } | null>(null);

  // Layout effect: the URL is ready before the browser paints, so switching files never flickers
  useLayoutEffect(() => {
    if (!file) {
      setEntry(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setEntry({ file, url });
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return entry?.file === file ? entry.url : null;
};
