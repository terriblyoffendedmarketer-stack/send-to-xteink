"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface FileEntry {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function titleFromPathname(pathname: string): string {
  return pathname.replace(/^books\//, "").replace(/\.epub$/i, "");
}

function InstallSection() {
  const [platform, setPlatform] = useState<"android" | "ios" | "desktop" | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua)) setPlatform("android");
    else if (/iphone|ipad|ipod/.test(ua)) setPlatform("ios");
    else setPlatform("desktop");

    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as unknown as { standalone?: boolean }).standalone === true
    );
  }, []);

  if (isStandalone || !platform) return null;

  return (
    <section className="mt-8 border border-border rounded-lg p-4">
      <h2 className="text-sm font-medium mb-3">Install app</h2>
      {platform === "android" && (
        <div className="space-y-3">
          <a
            href="/send-to-xteink.apk"
            download
            className="flex items-center gap-2 bg-foreground text-background rounded-md px-4 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity w-full justify-center"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Android APK
          </a>
          <p className="text-xs text-muted">
            Works without Chrome. Updates automatically from the server.
          </p>
        </div>
      )}
      {platform === "ios" && (
        <p className="text-xs text-muted">
          Tap the share button, then &ldquo;Add to Home Screen&rdquo; to install.
        </p>
      )}
      {platform === "desktop" && (
        <p className="text-xs text-muted">
          Click the install icon in your browser&apos;s address bar to install as a web app.
        </p>
      )}
    </section>
  );
}

export default function Home() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      if (res.ok) {
        setFiles(await res.json());
      }
    } catch {
      // silently fail on load
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);
    setUploadProgress(`Uploading ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let message = "Upload failed";
        try {
          const data = await res.json();
          message = data.error || message;
        } catch {
          message = `Upload failed (${res.status})`;
        }
        throw new Error(message);
      }

      await loadFiles();
      setUploadProgress(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setUploadProgress(null);
    } finally {
      setUploading(false);
    }
  }

  async function uploadFiles(fileList: FileList) {
    for (const file of Array.from(fileList)) {
      await uploadFile(file);
    }
  }

  async function deleteFile(url: string) {
    try {
      await fetch("/api/files", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      setFiles((prev) => prev.filter((f) => f.url !== url));
    } catch {
      setError("Failed to delete file");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }

  const [opdsUrl, setOpdsUrl] = useState("/opds");

  useEffect(() => {
    setOpdsUrl(`${window.location.origin}/opds`);
  }, []);

  return (
    <main className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Send to XTEink
        </h1>
        <p className="text-muted mt-1 text-sm">
          Upload files from anywhere. Download on your device via OPDS.
        </p>
      </header>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`
          border-2 border-dashed rounded-lg p-8 sm:p-12
          flex flex-col items-center justify-center gap-3
          cursor-pointer transition-colors
          ${
            dragOver
              ? "border-foreground bg-accent"
              : "border-border hover:border-muted"
          }
          ${uploading ? "pointer-events-none opacity-50" : ""}
        `}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-muted"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        {uploadProgress ? (
          <p className="text-sm text-muted">{uploadProgress}</p>
        ) : (
          <>
            <p className="text-sm font-medium">Drop files here</p>
            <p className="text-xs text-muted">or click to browse</p>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="*/*"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              uploadFiles(e.target.files);
              e.target.value = "";
            }
          }}
        />
      </div>

      {error && (
        <div className="mt-4 text-sm text-danger bg-danger/10 border border-danger/20 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      {/* File list */}
      {files.length > 0 && (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-muted mb-3">
            Library ({files.length})
          </h2>
          <div className="border border-border rounded-lg divide-y divide-border">
            {files.map((file) => (
              <div
                key={file.url}
                className="flex items-center gap-3 px-4 py-3"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-muted shrink-0"
                >
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {titleFromPathname(file.pathname)}
                  </p>
                  <p className="text-xs text-muted">
                    {formatSize(file.size)} &middot;{" "}
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteFile(file.url)}
                  className="text-muted hover:text-danger transition-colors p-1 shrink-0"
                  title="Delete"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {files.length === 0 && !uploading && (
        <p className="mt-8 text-center text-sm text-muted">
          No files yet. Upload something above.
        </p>
      )}

      {/* Install section */}
      <InstallSection />

      {/* Setup info */}
      <footer className="mt-auto pt-8 border-t border-border">
        <h2 className="text-sm font-medium mb-2">Device setup</h2>
        <p className="text-xs text-muted mb-3">
          On your XTEink, go to Settings &rarr; System &rarr; OPDS Servers and
          add:
        </p>
        <div className="bg-accent rounded-md px-3 py-2 flex items-center gap-2">
          <code className="text-xs flex-1 break-all select-all">{opdsUrl}</code>
          <button
            onClick={() => navigator.clipboard.writeText(opdsUrl)}
            className="text-muted hover:text-foreground transition-colors shrink-0 p-1"
            title="Copy URL"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-muted mt-2">
          Use the same username and password you use to log in here.
        </p>
      </footer>
    </main>
  );
}
