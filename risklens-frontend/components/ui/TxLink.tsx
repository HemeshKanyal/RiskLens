import { ExternalLink } from "lucide-react";
import { explorerTxUrl } from "@/lib/chain";
import { truncateHash } from "@/lib/utils";

/** Transaction hash, linked to the block explorer when one is configured. */
export default function TxLink({ hash, chars = 6 }: { hash: string; chars?: number }) {
    const url = explorerTxUrl(hash);
    if (!url) {
        return (
            <span className="text-xs font-mono text-fg-2" title={hash}>
                {truncateHash(hash, chars)}
            </span>
        );
    }
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-mono text-accent-text hover:underline"
        >
            {truncateHash(hash, chars)}
            <ExternalLink className="w-3 h-3" aria-hidden="true" />
            <span className="sr-only">(view in block explorer)</span>
        </a>
    );
}
