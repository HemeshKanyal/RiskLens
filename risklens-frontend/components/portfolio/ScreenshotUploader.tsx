"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, Image as ImageIcon, Loader2, CheckCircle, AlertCircle, X, Sparkles } from "lucide-react";
import { parseScreenshot } from "@/lib/api";
import { motion, AnimatePresence } from "framer-motion";
import type { Asset, ScreenshotResult } from "@/lib/types";
import toast from "react-hot-toast";

interface ScreenshotUploaderProps {
    onExtracted: (assets: Asset[]) => void;
}

export default function ScreenshotUploader({ onExtracted }: ScreenshotUploaderProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [isExtracting, setIsExtracting] = useState(false);
    const [result, setResult] = useState<ScreenshotResult | null>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const validFiles = acceptedFiles.filter(f => {
            if (f.size > 10 * 1024 * 1024) {
                toast.error(`${f.name} is too large (max 10MB)`);
                return false;
            }
            return true;
        });

        if (validFiles.length === 0) return;

        setFiles(prev => [...prev, ...validFiles]);
        setResult(null);

        // Create previews
        validFiles.forEach(f => {
            const reader = new FileReader();
            reader.onload = () => {
                setPreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(f);
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            "image/png": [".png"],
            "image/jpeg": [".jpg", ".jpeg"],
            "image/webp": [".webp"],
        },
        multiple: true,
    });

    const handleExtract = async () => {
        if (files.length === 0) return;

        setIsExtracting(true);
        try {
            const data = await parseScreenshot(files);
            setResult(data);

            if (data.assets.length > 0) {
                toast.success(`Extracted ${data.assets.length} assets from ${files.length} screenshots!`);
            } else {
                toast.error("Could not extract assets from these images");
            }
        } catch (err) {
            toast.error(
                err instanceof Error
                    ? err.message
                    : "Failed to parse screenshots"
            );
        } finally {
            setIsExtracting(false);
        }
    };

    const handleUseData = () => {
        if (result?.assets) {
            onExtracted(result.assets);
            toast.success("Assets loaded into form — review and analyze!");
        }
    };

    const clearUpload = () => {
        setFiles([]);
        setPreviews([]);
        setResult(null);
    };

    const removeFile = (index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
        setPreviews(prev => prev.filter((_, i) => i !== index));
        setResult(null);
    };

    return (
        <div className="space-y-5">
            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
                    isDragActive
                        ? "border-blue-500/50 bg-blue-500/5"
                        : "border-white/[0.08] hover:border-blue-500/30 hover:bg-white/[0.02]"
                }`}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                        <Upload className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-white">
                            {isDragActive
                                ? "Drop your screenshots here"
                                : "Drag & drop portfolio screenshots"}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, or WEBP — max 10MB each
                        </p>
                    </div>
                    <button
                        type="button"
                        className="px-4 py-2 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-gray-300 hover:bg-white/[0.1] transition-all"
                    >
                        Add more files
                    </button>
                </div>
            </div>

            {/* Previews Grid */}
            <AnimatePresence>
                {previews.length > 0 && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="grid grid-cols-2 sm:grid-cols-4 gap-4"
                    >
                        {previews.map((preview, index) => (
                            <motion.div 
                                key={index} 
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative group rounded-xl overflow-hidden border border-white/[0.08] aspect-video"
                            >
                                <img
                                    src={preview}
                                    alt={`Screenshot ${index + 1}`}
                                    className="w-full h-full object-cover"
                                />
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeFile(index);
                                    }}
                                    className="absolute top-1 right-1 p-1 rounded-md bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Extraction Button */}
            {files.length > 0 && !result && (
                <div className="flex justify-end">
                    <button
                        onClick={handleExtract}
                        disabled={isExtracting}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-semibold text-white hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                        {isExtracting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                AI Analyzing {files.length} images...
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                Extract {files.length} Portfolios
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Results */}
            <AnimatePresence>
                {result && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                    {/* Status */}
                    <div
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                            result.assets.length > 0
                                ? "bg-emerald-500/5 border-emerald-500/20"
                                : "bg-amber-500/5 border-amber-500/20"
                        }`}
                    >
                        {result.assets.length > 0 ? (
                            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                        ) : (
                            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                        )}
                        <div>
                            <p className="text-sm font-medium text-white">
                                {result.assets.length > 0
                                    ? `Extracted ${result.assets.length} assets`
                                    : "No assets extracted"}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                                {result.notes}
                            </p>
                        </div>
                        {result.confidence !== "none" && (
                            <span
                                className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${
                                    result.confidence === "high"
                                        ? "bg-emerald-500/10 text-emerald-400"
                                        : result.confidence === "medium"
                                          ? "bg-amber-500/10 text-amber-400"
                                          : "bg-red-500/10 text-red-400"
                                }`}
                            >
                                {result.confidence} confidence
                            </span>
                        )}
                    </div>

                    {/* Extracted assets table */}
                    {result.assets.length > 0 && (
                        <>
                            <div className="rounded-xl border border-white/[0.06] overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/[0.06]">
                                            <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium uppercase">
                                                Symbol
                                            </th>
                                            <th className="text-left px-4 py-2.5 text-xs text-gray-500 font-medium uppercase">
                                                Type
                                            </th>
                                            <th className="text-right px-4 py-2.5 text-xs text-gray-500 font-medium uppercase">
                                                Quantity
                                            </th>
                                                <th className="text-right px-4 py-2.5 text-xs text-gray-500 font-medium uppercase">
                                                    Value
                                                    <span className="block text-[10px] lowercase font-normal opacity-60">
                                                        (as of screenshot)
                                                    </span>
                                                </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.assets.map((asset, i) => (
                                            <tr
                                                key={i}
                                                className="border-b border-white/[0.03] last:border-0"
                                            >
                                                <td className="px-4 py-2.5 text-white font-mono font-medium">
                                                    {asset.symbol}
                                                </td>
                                                <td className="px-4 py-2.5 text-gray-400 capitalize">
                                                    {asset.type}
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-gray-300">
                                                    {asset.quantity ?? "—"}
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-gray-300">
                                                    {asset.value
                                                        ? `$${asset.value.toLocaleString()}`
                                                        : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleUseData}
                                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-sm font-semibold text-white hover:from-blue-600 hover:to-purple-700 transition-all"
                                >
                                    Use This Data for Analysis
                                </button>
                                <button
                                    onClick={clearUpload}
                                    className="px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-gray-400 hover:bg-white/[0.1] transition-all"
                                >
                                    Clear
                                </button>
                            </div>
                        </>
                    )}
                </motion.div>
            )}
            </AnimatePresence>
        </div>
    );
}
