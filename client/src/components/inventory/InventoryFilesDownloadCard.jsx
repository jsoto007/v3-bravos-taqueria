import React, { useContext, useState } from "react";
import { UserContext } from "../../context/UserContextProvider";

export default function InventoryFilesDownloadCard() {
  const { currentUser } = useContext(UserContext);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  const isOwnerAdmin = Boolean(
    currentUser?.is_owner_admin ||
      currentUser?.ownerAdmin ||
      currentUser?.role === "is_owner_admin"
  );

  function getFilenameFromDisposition(disposition) {
    if (!disposition) return null;
    // Try RFC5987 filename* first
    const filenameStar = /filename\*=(?:UTF-8''|)"?([^";]+)"?/i.exec(disposition);
    if (filenameStar && filenameStar[1]) {
      try {
        return decodeURIComponent(filenameStar[1]);
      } catch (_) {
        return filenameStar[1];
      }
    }
    // Fallback to simple filename=
    const filenameMatch = /filename="?([^";]+)"?/i.exec(disposition);
    return filenameMatch && filenameMatch[1] ? filenameMatch[1] : null;
  }

  const handleDownload = async () => {
    if (!isOwnerAdmin || downloading) return;
    setError("");
    setDownloading(true);
    try {
      const res = await fetch("/api/export/last_scans.xlsx", {
        method: "GET",
        credentials: "include",
      });

      if (!res.ok) {
        // Try to read error text if provided by server
        let message = `Download failed (${res.status})`;
        try {
          const text = await res.text();
          if (text) message = text;
        } catch (_) {}
        throw new Error(message);
      }

      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      let filename = getFilenameFromDisposition(cd);

      // Infer a sensible filename if server didn't set one
      if (!filename) {
        const mime = blob.type || "";
        if (mime.includes("text/csv")) filename = "last_scans.csv";
        else filename = "last_scans.xlsx";
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(err?.message || "Unexpected error while downloading file.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-5 sm:px-6">
      <div className="-ml-4 -mt-4 flex flex-wrap items-center justify-between sm:flex-nowrap">
        <div className="ml-4 mt-4">
          <h3 className="text-left mb-2 font-semibold text-gray-900 dark:text-gray-100">
            Completed Inventories
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Download your inventory as an Excel file.
          </p>
          {!isOwnerAdmin && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
              Owner admin only. Ask your owner admin to download this report.
            </p>
          )}
          {error && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
          )}
        </div>
        <div className="ml-4 mt-4 shrink-0">
          <button
            type="button"
            onClick={handleDownload}
            disabled={!isOwnerAdmin || downloading}
            className={
              "relative inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 " +
              (isOwnerAdmin && !downloading
                ? "bg-indigo-600 hover:bg-indigo-500 focus-visible:outline-indigo-600"
                : "bg-gray-400 dark:bg-gray-600 cursor-not-allowed")
            }
            aria-live="polite"
          >
            {downloading ? "Preparing…" : "Download"}
          </button>
        </div>
      </div>
    </div>
  );
}