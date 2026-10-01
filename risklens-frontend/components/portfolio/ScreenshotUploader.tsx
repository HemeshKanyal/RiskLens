"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { parseScreenshot, extractError } from "@/lib/api";
import type { Asset, ScreenshotResult } from "@/lib/types";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import { assetClassLabel, formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/cn";

interface ScreenshotUploaderProps {
    onExtracted: (assets: Asset[]) => void;
}

const MAX_BYTES = 10 * 1024 * 1024;

export default function ScreenshotUploader({ onExtracted }: ScreenshotUploaderProps) {
    const [files, setFiles] = useState<{ file: File; url: string }[]>([]);
    const [isExtracting, setIsExtracting] = useState(false);
    const [result, setResult] = useState<ScreenshotResult | null>(null);

    // Release preview URLs on unmount (removals release their own)
    const filesRef = useRef(files);
    useEffect(() => {
        filesRef.current = files;
    }, [files]);
    useEffect(() => () => filesRef.current.forEach((f) => URL.revokeObjectURL(f.url)), []);

    const onDrop = useCallback((accepted: File[]) => {
        const valid = accepted.filter((f) => {
            if (f.size > MAX_BYTES) {
                toast.error(`${f.name} is larger than 10 MB`);
                return false;
            }
            return true;
        });
        if (valid.length === 0) return;
        setFiles((prev) => [...prev, ...valid.map((file) => ({ file, url: URL.createObjectURL(file) }))]);
        setResult(null);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "image/webp": [".webp"] },
        multiple: true,
    });

    const handleExtract = async () => {
        if (files.length === 0) return;
        setIsExtracting(true);
        try {
            const data = await parseScreenshot(files.map((f) => f.file));
            setResult(data);
            if (data.assets.length === 0) toast.error("No holdings found in these images");
        } catch (err) {
            toast.error(extractError(err));
        } finally {
            setIsExtracting(false);
        }
    };

    const removeFile = (index: number) => {
        URL.revokeObjectURL(files[index].url);
        setFiles((prev) => prev.filter((_, i) => i !== index));
        setResult(null);
    };

    const confidenceTone =
        result?.confidence === "high" ? "positive" : result?.confidence === "medium" ? "warning" : "negative";

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={cn(
                    "rounded-lg border border-dashed p-8 text-center cursor-pointer transition-colors",
                    isDragActive ? "border-accent bg-accent-soft" : "border-line-strong hover:bg-surface-2"
                )}
            >
                <input {...getInputProps()} aria-label="Upload portfolio screenshots" />
                <Upload className="w-5 h-5 text-muted mx-auto" aria-hidden="true" />
                <p className="mt-2 text-sm font-medium text-fg">
                    {isDragActive ? "Drop to add" : "Drop screenshots of your holdings, or click to choose"}
                </p>
                <p className="mt-1 text-xs text-muted">PNG, JPG or WEBP, up to 10 MB each</p>
            </div>

            {files.length > 0 && (
                <ul className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {files.map((f, i) => (
                        <li key={f.url} className="relative rounded-md overflow-hidden border border-line aspect-video bg-surface-2">
                            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                            <img src={f.url} alt={`Screenshot ${i + 1}`} className="w-full h-full object-cover" />
                            <button
                                type="button"
                                onClick={() => removeFile(i)}
                                className="absolute top-1 right-1 p-1 rounded bg-black/60 text-white"
                                aria-label={`Remove screenshot ${i + 1}`}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {files.length > 0 && !result && (
                <div className="flex justify-end">
                    <Button onClick={handleExtract} disabled={isExtracting}>
                        {isExtracting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                        {isExtracting ? "Reading screenshots…" : `Read ${files.length} screenshot${files.length > 1 ? "s" : ""}`}
                    </Button>
                </div>
            )}

            {result && (
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-fg">
                            {result.assets.length > 0 ? `Found ${result.assets.length} holdings` : "No holdings found"}
                        </p>
                        {result.confidence !== "none" && <Badge tone={confidenceTone}>{result.confidence} confidence</Badge>}
                    </div>
                    {result.notes && <p className="text-xs text-muted">{result.notes}</p>}

                    {result.assets.length > 0 && (
                        <>
                            <div className="rounded-lg border border-line overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-left text-xs text-muted border-b border-line">
                                            <th scope="col" className="px-3 py-2 font-medium">Symbol</th>
                                            <th scope="col" className="px-3 py-2 font-medium">Type</th>
                                            <th scope="col" className="px-3 py-2 font-medium text-right">Quantity</th>
                                            <th scope="col" className="px-3 py-2 font-medium text-right">Value</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.assets.map((a, i) => (
                                            <tr key={i} className="border-b border-line last:border-0">
                                                <td className="px-3 py-2 font-mono text-fg">{a.symbol}</td>
                                                <td className="px-3 py-2 text-fg-2">{assetClassLabel(a.type)}</td>
                                                <td className="px-3 py-2 text-right tabular-nums text-fg-2">{a.quantity ?? "—"}</td>
                                                <td className="px-3 py-2 text-right tabular-nums text-fg-2">
                                                    {a.value ? formatCurrency(a.value) : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-muted">
                                Values are as shown in the screenshot. You can review and edit them before analyzing.
                            </p>
                            <div className="flex gap-2">
                                <Button onClick={() => onExtracted(result.assets)}>Review and edit</Button>
                                <Button variant="ghost" onClick={() => {
                                        files.forEach((f) => URL.revokeObjectURL(f.url));
                                        setFiles([]);
                                        setResult(null);
                                    }}>
                                    Start over
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
