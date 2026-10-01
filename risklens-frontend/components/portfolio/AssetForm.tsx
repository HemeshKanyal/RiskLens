"use client";

import React, { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Asset } from "@/lib/types";
import { fetchPrices } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Input, Select } from "@/components/ui/Field";
import Button from "@/components/ui/Button";

interface AssetFormProps {
    assets: Asset[];
    setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
}

const ASSET_TYPES = [
    { value: "stock", label: "Stock" },
    { value: "crypto", label: "Crypto" },
    { value: "etf", label: "ETF" },
    { value: "bond", label: "Bond" },
    { value: "commodity", label: "Commodity" },
] as const;

// Column template shared by the header and the rows on wide screens
const GRID = "md:grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1.5fr)_2.25rem] md:gap-3";

export default function AssetForm({ assets, setAssets }: AssetFormProps) {
    const [loadingPrice, setLoadingPrice] = useState<number | null>(null);

    const addAsset = () =>
        setAssets((prev) => [...prev, { symbol: "", type: "stock", quantity: null, value: null }]);

    const removeAsset = (index: number) =>
        setAssets((prev) =>
            prev.length === 1 ? [{ symbol: "", type: "stock", quantity: null, value: null }] : prev.filter((_, i) => i !== index)
        );

    const updateAsset = (index: number, patch: Partial<Asset>) =>
        setAssets((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));

    const toNumber = (raw: string) => (raw === "" ? null : Number(raw));

    const lookupPrice = async (index: number) => {
        const asset = assets[index];
        if (!asset.symbol || !asset.quantity) {
            toast.error("Enter a symbol and quantity first");
            return;
        }
        setLoadingPrice(index);
        try {
            const result = await fetchPrices([asset.symbol], [asset.type]);
            const price = result.prices[asset.symbol];
            if (price) {
                const total = Math.round(price * (asset.quantity || 0) * 100) / 100;
                updateAsset(index, { value: total });
                toast.success(`${asset.symbol} at ${formatCurrency(price)} → ${formatCurrency(total)}`);
            } else {
                toast.error(`No price found for ${asset.symbol}`);
            }
        } catch {
            toast.error(`Price lookup failed for ${asset.symbol}`);
        } finally {
            setLoadingPrice(null);
        }
    };

    return (
        <div>
            <div className={`hidden ${GRID} px-0.5 pb-2 text-xs font-medium text-muted`} aria-hidden="true">
                <span>Symbol</span>
                <span>Type</span>
                <span>Quantity</span>
                <span>Value (USD)</span>
                <span />
            </div>

            <ul className="space-y-3 md:space-y-2">
                {assets.map((asset, index) => {
                    const n = index + 1;
                    return (
                        <li
                            key={index}
                            className={`grid grid-cols-2 gap-2 p-3 rounded-lg border border-line md:p-0 md:border-0 ${GRID}`}
                        >
                            <Input
                                aria-label={`Asset ${n} symbol`}
                                placeholder="AAPL, BTC…"
                                value={asset.symbol}
                                onChange={(e) => updateAsset(index, { symbol: e.target.value.toUpperCase() })}
                                className="font-mono"
                                autoCapitalize="characters"
                                spellCheck={false}
                            />
                            <Select
                                aria-label={`Asset ${n} type`}
                                value={asset.type}
                                onChange={(e) => updateAsset(index, { type: e.target.value as Asset["type"] })}
                            >
                                {ASSET_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>
                                        {t.label}
                                    </option>
                                ))}
                            </Select>
                            <Input
                                className="col-span-2 md:col-span-1"
                                aria-label={`Asset ${n} quantity`}
                                type="number"
                                inputMode="decimal"
                                placeholder="Quantity"
                                value={asset.quantity ?? ""}
                                onChange={(e) => updateAsset(index, { quantity: toNumber(e.target.value) })}
                                step="any"
                                min="0"
                            />
                            <div className="col-span-2 md:col-span-1 flex gap-1.5">
                                <Input
                                    aria-label={`Asset ${n} value in USD`}
                                    type="number"
                                    inputMode="decimal"
                                    placeholder="Auto from price"
                                    value={asset.value ?? ""}
                                    onChange={(e) => updateAsset(index, { value: toNumber(e.target.value) })}
                                    step="any"
                                    min="0"
                                />
                                <Button
                                    variant="secondary"
                                    className="h-10 px-3 shrink-0"
                                    onClick={() => lookupPrice(index)}
                                    disabled={loadingPrice === index}
                                    aria-label={`Look up live price for asset ${n}`}
                                >
                                    {loadingPrice === index ? <Loader2 className="w-4 h-4 animate-spin" /> : "Price"}
                                </Button>
                            </div>
                            <Button
                                variant="ghost"
                                className="col-span-2 md:col-span-1 h-9 md:h-10 md:w-9 md:px-0 justify-center"
                                onClick={() => removeAsset(index)}
                                aria-label={`Remove asset ${n}`}
                            >
                                <X className="w-4 h-4" aria-hidden="true" />
                                <span className="md:hidden">Remove</span>
                            </Button>
                        </li>
                    );
                })}
            </ul>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <Button variant="secondary" size="sm" onClick={addAsset}>
                    <Plus className="w-4 h-4" aria-hidden="true" />
                    Add holding
                </Button>
                <p className="text-xs text-muted">Leave value empty to use the live price × quantity.</p>
            </div>
        </div>
    );
}
