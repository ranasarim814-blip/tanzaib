"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, GripVertical, ImagePlus, Loader2, Trash2 } from "lucide-react";
import { uploadProductImage } from "@/app/admin/actions";
import { ProductImage } from "@/components/store/ProductImage";
import { Input, NativeSelect } from "@/components/ui/input";
import { IMAGE_KINDS, type ImageKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface ImageItem {
  id?: string;
  url: string;
  kind: ImageKind;
  alt: string | null;
}

const MAX_DIM = 1600;

/** Resize to max 1600px and re-encode as WebP in the browser before upload. */
async function compress(file: File): Promise<File> {
  if (!file.type.startsWith("image/")) throw new Error("Not an image");
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIM / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, w, h);
  const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.86));
  if (!blob) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", { type: "image/webp" });
}

function guessKind(existing: ImageItem[], name: string): ImageKind {
  const n = name.toLowerCase();
  if (/hanger|transparent/.test(n)) return "hanger";
  if (/back/.test(n)) return "back";
  if (/detail|close/.test(n)) return "detail";
  if (/front/.test(n) || !existing.some((i) => i.kind === "front")) return "front";
  return "detail";
}

export function ImageManager({ value, onChange, slug, productName }: { value: ImageItem[]; onChange: (v: ImageItem[]) => void; slug: string; productName: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const upload = async (files: FileList | File[]) => {
    const list = [...files].filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setUploading((n) => n + list.length);
    let current = value;
    for (const f of list) {
      try {
        const small = await compress(f);
        const fd = new FormData();
        fd.set("file", small);
        fd.set("slug", slug || "product");
        const res = await uploadProductImage(fd);
        if (res.ok) {
          const kind = guessKind(current, f.name);
          current = [...current, { url: res.data.url, kind, alt: `${productName || "Product"} — ${kind} view` }];
          onChange(current);
        } else toast.error(`${f.name}: ${res.error}`);
      } catch (e) {
        toast.error(`${f.name}: ${e instanceof Error ? e.message : "upload failed"}`);
      } finally {
        setUploading((n) => n - 1);
      }
    }
  };

  const update = (i: number, patch: Partial<ImageItem>) => onChange(value.map((img, k) => (k === i ? { ...img, ...patch } : img)));
  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = [...value];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    onChange(next);
  };

  const kinds = new Set(value.map((v) => v.kind));
  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          setDragOver(false);
          upload(e.dataTransfer.files);
        }}
        className={cn("flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-colors", dragOver ? "border-brass bg-[#fbf3e2]" : "border-border bg-muted/40")}
      >
        <ImagePlus className="size-7 text-muted-foreground" strokeWidth={1.4} />
        <p className="mt-3 text-sm font-medium">Drag & drop photos here</p>
        <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG or WebP — resized to 1600px and converted to WebP automatically.</p>
        <button type="button" onClick={() => inputRef.current?.click()} className="mt-4 rounded-md border border-border bg-white px-3 py-1.5 text-sm hover:bg-muted">
          Choose files
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => e.target.files && upload(e.target.files)} />
        {uploading > 0 && (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground" role="status">
            <Loader2 className="size-3.5 animate-spin" /> Uploading {uploading} image(s)…
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {(["front", "back", "detail", "hanger"] as const).map((k) => (
          <span key={k} className={cn("rounded-full px-2 py-0.5", kinds.has(k) ? "bg-[#e7f1e8] text-[#25603a]" : "bg-muted text-muted-foreground")}>
            {kinds.has(k) ? "✓" : "○"} {k}{k === "front" ? " (required)" : k === "hanger" ? " (transparent PNG/WebP for the wardrobe)" : ""}
          </span>
        ))}
      </div>

      {value.length > 0 && (
        <ul className="divide-y divide-border rounded-lg border border-border bg-white">
          {value.map((img, i) => (
            <li
              key={`${img.url}-${i}`}
              draggable
              onDragStart={() => setDragIndex(i)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (dragIndex !== null) move(dragIndex, i);
                setDragIndex(null);
              }}
              className={cn("flex items-center gap-3 p-3", dragIndex === i && "opacity-50")}
            >
              <GripVertical className="size-4 shrink-0 cursor-grab text-muted-foreground" aria-hidden />
              <span className={cn("relative h-16 w-12 shrink-0 overflow-hidden rounded", img.kind === "hanger" ? "bg-[repeating-conic-gradient(#eee_0_25%,#fff_0_50%)] bg-[length:12px_12px]" : "bg-muted")}>
                <ProductImage src={img.url} alt="" fill sizes="48px" className="object-cover" />
              </span>
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-[140px_1fr]">
                <NativeSelect value={img.kind} onChange={(e) => update(i, { kind: e.target.value as ImageKind })} aria-label="Image type">
                  {IMAGE_KINDS.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </NativeSelect>
                <Input value={img.alt ?? ""} onChange={(e) => update(i, { alt: e.target.value })} placeholder="Alt text (describe the image)" aria-label="Alt text" />
              </div>
              <div className="flex shrink-0 items-center">
                <button type="button" className="rounded p-1.5 hover:bg-muted disabled:opacity-30" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Move up"><ArrowUp className="size-4" /></button>
                <button type="button" className="rounded p-1.5 hover:bg-muted disabled:opacity-30" onClick={() => move(i, i + 1)} disabled={i === value.length - 1} aria-label="Move down"><ArrowDown className="size-4" /></button>
                <button type="button" className="rounded p-1.5 text-destructive hover:bg-[#f8e3e1]" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label="Remove image"><Trash2 className="size-4" /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-muted-foreground">Removed images are deleted from storage when you save.</p>
    </div>
  );
}
