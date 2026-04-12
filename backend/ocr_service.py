"""
RiskLens — Portfolio Screenshot OCR Service
Uses Ollama vision model (llava) to extract portfolio data from screenshots.
"""

import base64
import json
import logging
import requests
import io
from PIL import Image

logger = logging.getLogger("risklens.ocr")

OLLAMA_BASE = "http://localhost:11434"
VISION_MODEL = "moondream"  # Lightweight vision model (1.7GB) for better VRAM stability


EXTRACTION_PROMPT = """Extract all investment holdings from this screenshot into a JSON list.
Include:
- symbol: ticker symbol (e.g. BTC, AAPL)
- type: one of "stock", "crypto", "etf", "commodity"
- quantity: number of shares/units (most important)
- value: total value in USD

Output format:
{
  "assets": [{"symbol": "BTC", "type": "crypto", "quantity": 0.5, "value": 30000.0}],
  "confidence": "high",
  "notes": "Extracted assets"
}
Return ONLY the JSON object.
"""


def parse_screenshots(images_bytes: list[bytes]) -> dict:
    """
    Process multiple portfolio screenshots by sending them to Ollama iteratively.
    Switched to moondream model for higher stability on 4GB VRAM systems.
    """
    all_assets_lists = []
    all_notes = []
    confidences = []

    logger.info("Starting iterative processing of %d screenshots...", len(images_bytes))

    for i, img_bytes in enumerate(images_bytes):
        try:
            logger.info("Processing screenshot %d/%d...", i + 1, len(images_bytes))
            
            # 1. Preprocess/Resize image to avoid OOM
            processed_bytes = _preprocess_image(img_bytes)
            
            # 2. Encode to base64
            image_b64 = base64.b64encode(processed_bytes).decode("utf-8")

            # 3. Call Ollama
            response = requests.post(
                f"{OLLAMA_BASE}/api/generate",
                json={
                    "model": VISION_MODEL,
                    "prompt": EXTRACTION_PROMPT,
                    "images": [image_b64],
                    "stream": False,
                    "options": {
                        "temperature": 0.1,
                    }
                },
                timeout=120
            )

            if response.status_code != 200:
                logger.error("Ollama failed for image %d: %s", i + 1, response.text)
                continue

            # 3. Parse and Validate this single result
            data = response.json()
            raw_text = data.get("response", "").strip()
            
            logger.info("Raw OCR response (first 200 chars): %s", raw_text[:200])
            
            parsed_json = _extract_json(raw_text)
            validated = _validate_assets(parsed_json)
            
            all_assets_lists.append(validated.get("assets", []))
            all_notes.append(validated.get("notes", ""))
            confidences.append(validated.get("confidence", "low"))
            
        except Exception as e:
            logger.error("Error processing screenshot %d: %s", i + 1, str(e))
            continue

    if not all_assets_lists:
        return {
            "assets": [],
            "confidence": "none",
            "notes": "No data could be extracted from the uploaded images."
        }

    # 4. Consolidate results across all screenshots
    merged_assets = _consolidate_results(all_assets_lists)
    
    # Determine final confidence (use the highest common or lowest safe?)
    if "high" in confidences:
        final_confidence = "high"
    elif "medium" in confidences:
        final_confidence = "medium"
    else:
        final_confidence = "low"

    return {
        "assets": merged_assets,
        "confidence": final_confidence,
        "notes": " | ".join(filter(None, all_notes)) or f"Extracted from {len(images_bytes)} screenshots."
    }


def _preprocess_image(img_bytes: bytes, max_size: int = 768) -> bytes:
    """
    Resize image if it exceeds max_size to prevent Ollama VRAM/Buffer errors.
    Moondream performs very well with smaller resolutions (e.g. 768px).
    """
    try:
        img = Image.open(io.BytesIO(img_bytes))
        
        # Convert to RGB (removes alpha channel, saves memory)
        if img.mode != 'RGB':
            img = img.convert('RGB')
            
        w, h = img.size
        if w > max_size or h > max_size:
            if w > h:
                new_w = max_size
                new_h = int(h * (max_size / w))
            else:
                new_h = max_size
                new_w = int(w * (max_size / h))
            
            logger.info("Downscaling screenshot from %dx%d to %dx%d (for VRAM safety)", w, h, new_w, new_h)
            img = img.resize((new_w, new_h), Image.LANCZOS)
        
        # Save as optimized JPEG
        buf = io.BytesIO()
        img.save(buf, format="JPEG", quality=85, optimize=True)
        processed = buf.getvalue()
        logger.info("Image preprocessed: %d -> %d bytes", len(img_bytes), len(processed))
        return processed
    except Exception as e:
        logger.warning("Image preprocessing failed: %s. Using original bytes.", str(e))
        return img_bytes


def _consolidate_results(asset_lists: list[list[dict]]) -> list[dict]:
    """Merge multiple asset lists, summing quantities and values for identical symbols."""
    totals = {}
    
    for alist in asset_lists:
        for asset in alist:
            symbol = asset.get("symbol", "UNKNOWN").upper()
            if symbol not in totals:
                totals[symbol] = asset.copy()
            else:
                existing = totals[symbol]
                # Combine quantities
                if asset.get("quantity") is not None:
                    existing["quantity"] = (existing.get("quantity") or 0) + asset["quantity"]
                # Combine values
                if asset.get("value") is not None:
                    existing["value"] = (existing.get("value") or 0) + asset["value"]
                
                # Keep the type from whichever record has it (usually matches)
                if not existing.get("type"):
                    existing["type"] = asset.get("type", "stock")

    return list(totals.values())


def _extract_json(text: str) -> dict:
    """Extract JSON object from LLM response text."""

    # Try direct parse first
    try:
        return json.loads(text.strip())
    except json.JSONDecodeError:
        pass

    # Try to find JSON block in the text
    # Look for ```json ... ``` blocks
    import re
    json_block = re.search(r'```(?:json)?\s*\n?(.*?)\n?```', text, re.DOTALL)
    if json_block:
        try:
            return json.loads(json_block.group(1).strip())
        except json.JSONDecodeError:
            pass

    # Try to find { ... } in the text
    brace_start = text.find('{')
    brace_end = text.rfind('}')
    if brace_start != -1 and brace_end != -1 and brace_end > brace_start:
        try:
            return json.loads(text[brace_start:brace_end + 1])
        except json.JSONDecodeError:
            pass

    logger.warning("Could not parse JSON from OCR response")
    return {
        "assets": [],
        "confidence": "none",
        "notes": "AI could not extract structured data from this image. Please enter your portfolio manually."
    }


VALID_TYPES = {"stock", "crypto", "etf", "bond", "commodity"}


def _validate_assets(data: dict) -> dict:
    """Validate and clean extracted asset data."""
    if not isinstance(data, dict):
        return {"assets": [], "confidence": "none", "notes": "Invalid response format"}

    assets = data.get("assets", [])
    cleaned_assets = []

    for asset in assets:
        if not isinstance(asset, dict):
            continue

        symbol = str(asset.get("symbol", "")).strip().upper()
        asset_type = str(asset.get("type", "stock")).strip().lower()
        quantity = asset.get("quantity")
        value = asset.get("value")

        # Skip empty entries
        if not symbol:
            continue

        # Validate type
        if asset_type not in VALID_TYPES:
            asset_type = "stock"  # Default to stock

        # Clean numeric values
        if quantity is not None:
            try:
                quantity = float(quantity)
                if quantity < 0:
                    quantity = None
            except (ValueError, TypeError):
                quantity = None

        if value is not None:
            try:
                value = float(value)
                if value < 0:
                    value = None
            except (ValueError, TypeError):
                value = None

        # Must have at least quantity or value
        if quantity is None and value is None:
            value = 0  # Set default so user can edit

        cleaned_assets.append({
            "symbol": symbol,
            "type": asset_type,
            "quantity": quantity,
            "value": value,
        })

    return {
        "assets": cleaned_assets,
        "confidence": data.get("confidence", "medium"),
        "notes": data.get("notes", f"Extracted {len(cleaned_assets)} assets from screenshot"),
    }
