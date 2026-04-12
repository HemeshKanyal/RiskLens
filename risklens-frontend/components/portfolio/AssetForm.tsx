"use client";

import React, { useState, useCallback } from "react";
import { X, Plus, Search, DollarSign, Hash, Loader2 } from "lucide-react";
import type { Asset } from "@/lib/types";
import { fetchPrices } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";

interface AssetFormProps {
    assets: Asset[];
    setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
}

const ASSET_TYPES = [
    { value: "stock", label: "Stock", color: "#3B82F6" },
    { value: "crypto", label: "Crypto", color: "#A855F7" },
    { value: "etf", label: "ETF", color: "#06B6D4" },
    { value: "bond", label: "Bond", color: "#10B981" },
    { value: "commodity", label: "Commodity", color: "#F59E0B" },
] as const;

export default function AssetForm({ assets, setAssets }: AssetFormProps) {
    const [loadingPrices, setLoadingPrices] = useState<Record<number, boolean>>({});

    const addAsset = () => {
        setAssets((prev) => [
            ...prev,
            { symbol: "", type: "stock", quantity: null, value: null },
        ]);
    };

    const removeAsset = (index: number) => {
        setAssets((prev) => prev.filter((_, i) => i !== index));
    };

    const updateAsset = (index: number, field: keyof Asset, rawValue: string | number) => {
        setAssets((prev) =>
            prev.map((asset, i) => {
                if (i !== index) return asset;
                if (field === "symbol") {
                    return { ...asset, symbol: (rawValue as string).toUpperCase() };
                }
                if (field === "type") {
                    return { ...asset, type: rawValue as Asset["type"] };
                }
                if (field === "quantity" || field === "value") {
                    const num = rawValue === "" ? null : Number(rawValue);
                    return { ...asset, [field]: num };
                }
                return asset;
            })
        );
    };

    const lookupPrice = useCallback(async (index: number) => {
        const asset = assets[index];
        if (!asset.symbol || !asset.quantity) {
            toast.error("Enter symbol and quantity first");
            return;
        }

        setLoadingPrices((prev) => ({ ...prev, [index]: true }));
        try {
            const result = await fetchPrices([asset.symbol], [asset.type]);
            const price = result.prices[asset.symbol];
            if (price) {
                const totalValue = Math.round(price * (asset.quantity || 0) * 100) / 100;
                setAssets((prev) =>
                    prev.map((a, i) =>
                        i === index ? { ...a, value: totalValue } : a
                    )
                );
                toast.success(`${asset.symbol}: ${formatCurrency(price)}/unit → ${formatCurrency(totalValue)}`);
            } else {
                toast.error(`Could not fetch price for ${asset.symbol}`);
            }
        } catch {
            toast.error(`Price lookup failed for ${asset.symbol}`);
        } finally {
            setLoadingPrices((prev) => ({ ...prev, [index]: false }));
        }
    }, [assets, setAssets]);

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 px-1 text-xs text-gray-500 font-medium uppercase tracking-wider">
                <span className="col-span-3">Symbol</span>
                <span className="col-span-2">Type</span>
                <span className="col-span-2">Quantity</span>
                <span className="col-span-3">Value (USD)</span>
                <span className="col-span-2"></span>
            </div>

            {/* Asset Rows */}
            {assets.map((asset, index) => (
                <div
                    key={index}
                    className="grid grid-cols-12 gap-3 items-center bg-white/[0.02] rounded-xl p-3 border border-white/[0.06] hover:border-white/[0.1] transition-all group"
                >
                    {/* Symbol */}
                    <div className="col-span-3">
                        <input
                            type="text"
                            placeholder="AAPL, BTC..."
                            value={asset.symbol}
                            onChange={(e) =>
                                updateAsset(index, "symbol", e.target.value)
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-gray-600 outline-none focus:border-blue-500/50 transition-all font-mono"
                        />
                    </div>

                    {/* Type */}
                    <div className="col-span-2">
                        <select
                            value={asset.type}
                            onChange={(e) =>
                                updateAsset(index, "type", e.target.value)
                            }
                            className="w-full px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer"
                        >
                            {ASSET_TYPES.map((t) => (
                                <option
                                    key={t.value}
                                    value={t.value}
                                    className="bg-[#1A2236] text-white"
                                >
                                    {t.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Quantity */}
                    <div className="col-span-2">
                        <div className="relative">
                            <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                            <input
                                type="number"
                                placeholder="0"
                                value={asset.quantity ?? ""}
                                onChange={(e) =>
                                    updateAsset(index, "quantity", e.target.value)
                                }
                                step="any"
                                min="0"
                                className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-gray-600 outline-none focus:border-blue-500/50 transition-all"
                            />
                        </div>
                    </div>

                    {/* Value */}
                    <div className="col-span-3">
                        <div className="relative flex gap-1">
                            <div className="relative flex-1">
                                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
                                <input
                                    type="number"
                                    placeholder="Auto or manual"
                                    value={asset.value ?? ""}
                                    onChange={(e) =>
                                        updateAsset(index, "value", e.target.value)
                                    }
                                    step="any"
                                    min="0"
                                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white text-sm placeholder-gray-600 outline-none focus:border-blue-500/50 transition-all"
                                />
                            </div>
                            {/* Price lookup button */}
                            <button
                                type="button"
                                onClick={() => lookupPrice(index)}
                                disabled={loadingPrices[index]}
                                className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-all disabled:opacity-50 shrink-0"
                                title="Fetch live price"
                            >
                                {loadingPrices[index] ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Search className="w-4 h-4" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Remove */}
                    <div className="col-span-2 flex justify-end">
                        <button
                            type="button"
                            onClick={() => removeAsset(index)}
                            className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            ))}

            {/* Add Asset Button */}
            <button
                type="button"
                onClick={addAsset}
                className="w-full py-3 rounded-xl border-2 border-dashed border-white/[0.08] hover:border-blue-500/30 text-gray-500 hover:text-blue-400 text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" />
                Add Asset
            </button>
        </div>
    );
}
