"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "../../lib/supabase";

const PHOTO_KEY = "profile_photo_url";
const SHAPE_KEY = "profile_photo_shape";
const MAX_DIM = 512; // longest side after compression
const MAX_FILE_BYTES = 8 * 1024 * 1024;

async function upsertSetting(key: string, value: string) {
  const { error } = await getSupabase()
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw new Error(error.message);
}

/** Downscale + JPEG-compress an image file, return a data URL. */
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image file"));
    };
    img.src = url;
  });
}

/** Profile photo manager: upload, preview, frame shape, remove. */
export default function PhotoSection() {
  const [photoUrl, setPhotoUrl] = useState<string>("");
  const [shape, setShape] = useState<"circle" | "rounded">("circle");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await getSupabase()
        .from("settings")
        .select("key,value")
        .in("key", [PHOTO_KEY, SHAPE_KEY]);
      if (error) throw new Error(error.message);
      for (const row of (data as { key: string; value: string | null }[]) ?? []) {
        if (row.key === PHOTO_KEY) setPhotoUrl(row.value ?? "");
        if (row.key === SHAPE_KEY && row.value === "rounded") setShape("rounded");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onFilePicked(file: File | undefined) {
    if (!file) return;
    setError(null);
    setStatus(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (JPG or PNG).");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setError("That file is bigger than 8 MB — please pick a smaller one.");
      return;
    }
    setBusy(true);
    try {
      const dataUrl = await compressImage(file);
      await upsertSetting(PHOTO_KEY, dataUrl);
      setPhotoUrl(dataUrl);
      setStatus("Photo uploaded — it is live on your site now.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function onShapeChange(next: "circle" | "rounded") {
    setError(null);
    setBusy(true);
    try {
      await upsertSetting(SHAPE_KEY, next);
      setShape(next);
      setStatus("Frame shape updated — live on your site now.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    if (!photoUrl) return;
    if (!window.confirm("Remove your profile photo from the site?")) return;
    setError(null);
    setStatus(null);
    setBusy(true);
    try {
      await upsertSetting(PHOTO_KEY, "");
      setPhotoUrl("");
      setStatus("Photo removed from the site.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  }

  const shapeClass = shape === "rounded" ? "rounded-3xl" : "rounded-full";

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-slate-100">Profile photo</h2>
      <p className="mb-4 text-sm text-slate-400">
        The photo shown at the top of your homepage. Upload a new one, change its
        frame, or remove it — changes go live immediately.
      </p>

      {loading && <p className="text-slate-400">Loading…</p>}
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      {status && <p className="mb-4 text-sm text-emerald-400">{status}</p>}

      {!loading && (
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-3">
            {photoUrl ? (
              <img
                src={photoUrl}
                alt="Profile preview"
                className={`h-40 w-40 border-4 border-amber-400/70 object-cover ${shapeClass}`}
              />
            ) : (
              <div
                className={`flex h-40 w-40 items-center justify-center border-2 border-dashed border-slate-700 text-sm text-slate-500 ${shapeClass}`}
              >
                No photo
              </div>
            )}
          </div>

          <div className="flex-1 space-y-5">
            <div>
              <p className="mb-2 text-sm font-medium text-slate-300">Frame shape</p>
              <div className="flex gap-2">
                {(["circle", "rounded"] as const).map((s) => (
                  <button
                    key={s}
                    disabled={busy}
                    onClick={() => onShapeChange(s)}
                    className={`rounded-lg px-4 py-2 text-sm font-medium capitalize ${
                      shape === s
                        ? "bg-amber-400 text-slate-950"
                        : "border border-slate-700 text-slate-300 hover:border-amber-400/60 hover:text-amber-300"
                    } disabled:opacity-50`}
                  >
                    {s === "circle" ? "Circle" : "Rounded square"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onFilePicked(e.target.files?.[0])}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  disabled={busy}
                  onClick={() => fileRef.current?.click()}
                  className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300 disabled:opacity-50"
                >
                  {busy ? "Working…" : photoUrl ? "Upload new photo" : "Upload photo"}
                </button>
                {photoUrl && (
                  <button
                    disabled={busy}
                    onClick={onRemove}
                    className="rounded-lg border border-red-400/60 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-400/10 disabled:opacity-50"
                  >
                    Remove photo
                  </button>
                )}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                JPG or PNG, up to 8 MB. It is resized automatically for the web.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
