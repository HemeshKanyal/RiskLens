import requests
import logging
import time

logger = logging.getLogger("risklens.pricing")

# Simple in-memory cache to stay within API rate limits
_price_cache = {}
CACHE_TTL = 300  # 5 minutes


# ========================================
# CoinGecko — Crypto Prices (Free, no key)
# ========================================

COINGECKO_BASE = "https://api.coingecko.com/api/v3"

# Map common crypto symbols → CoinGecko IDs
CRYPTO_ID_MAP = {
    "BTC": "bitcoin",
    "ETH": "ethereum",
    "SOL": "solana",
    "DOGE": "dogecoin",
    "ADA": "cardano",
    "DOT": "polkadot",
    "AVAX": "avalanche-2",
    "MATIC": "matic-network",
    "LINK": "chainlink",
    "XRP": "ripple",
    "BNB": "binancecoin",
    "SHIB": "shiba-inu",
    "UNI": "uniswap",
    "ATOM": "cosmos",
    "LTC": "litecoin",
}

# Map common commodity/bond symbols → CoinGecko IDs (gold/silver are on CoinGecko)
COMMODITY_ID_MAP = {
    "GOLD": "tether-gold",
    "SILVER": "silver-token",
}


def get_crypto_price(symbol: str) -> float | None:
    """Fetch live price for a crypto asset from CoinGecko."""
    coin_id = CRYPTO_ID_MAP.get(symbol.upper())
    if not coin_id:
        return None

    try:
        resp = requests.get(
            f"{COINGECKO_BASE}/simple/price",
            params={"ids": coin_id, "vs_currencies": "usd"},
            timeout=10
        )
        data = resp.json()
        price = data.get(coin_id, {}).get("usd")
        if price:
            logger.info("CoinGecko price for %s: $%.2f", symbol, price)
        return price
    except Exception as e:
        logger.warning("CoinGecko fetch failed for %s: %s", symbol, e)
        return None


# ========================================
# Yahoo Finance — Stocks, ETFs, Bonds
# ========================================

YAHOO_BASE = "https://query1.finance.yahoo.com/v8/finance/chart"

# Some common commodity ticker mappings for Yahoo
COMMODITY_YAHOO_MAP = {
    "GOLD": "GC=F",
    "SILVER": "SI=F",
    "OIL": "CL=F",
    "CRUDE": "CL=F",
    "NATURAL_GAS": "NG=F",
}

# Bond ETF tickers (proxies for bond prices)
BOND_YAHOO_MAP = {
    "US BONDS": "TLT",
    "US_BONDS": "TLT",
    "TREASURY": "TLT",
    "BOND": "BND",
}


def get_stock_price(symbol: str) -> float | None:
    """Fetch live price for a stock/ETF from Yahoo Finance."""
    try:
        resp = requests.get(
            f"{YAHOO_BASE}/{symbol}",
            params={"interval": "1d", "range": "1d"},
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=10
        )
        data = resp.json()
        result = data["chart"]["result"][0]
        price = result["meta"]["regularMarketPrice"]
        price = round(float(price), 2)
        logger.info("Yahoo Finance price for %s: $%.2f", symbol, price)
        return price
    except Exception as e:
        logger.warning("Yahoo Finance fetch failed for %s: %s", symbol, e)
        return None


# ========================================
# Unified Price Fetcher
# ========================================

def get_asset_price(symbol: str, asset_type: str) -> float | None:
    """
    Fetch live USD price for any supported asset with caching.
    """
    symbol_upper = symbol.upper()
    asset_type_lower = asset_type.lower()
    
    # 1. Check Cache
    cache_key = f"{symbol_upper}:{asset_type_lower}"
    now = time.time()
    if cache_key in _price_cache:
        val, expiry = _price_cache[cache_key]
        if now < expiry:
            logger.info("Cache hit for %s: $%.2f", symbol_upper, val)
            return val

    # 2. Fetch Live
    price = None
    if asset_type_lower == "crypto":
        price = get_crypto_price(symbol_upper)

    elif asset_type_lower in ("stock", "etf"):
        price = get_stock_price(symbol_upper)

    elif asset_type_lower == "commodity":
        yahoo_ticker = COMMODITY_YAHOO_MAP.get(symbol_upper, None)
        if yahoo_ticker:
            price = get_stock_price(yahoo_ticker)
        else:
            price = get_crypto_price(symbol_upper)

    elif asset_type_lower == "bond":
        yahoo_ticker = BOND_YAHOO_MAP.get(symbol_upper, "BND")
        price = get_stock_price(yahoo_ticker)
    
    # 3. Update Cache
    if price is not None:
        _price_cache[cache_key] = (price, now + CACHE_TTL)
        
    return price



def get_bulk_prices(symbols_with_types: list[dict]) -> dict:
    """
    Fetch prices for multiple assets at once.
    
    Input:  [{"symbol": "BTC", "type": "crypto"}, {"symbol": "AAPL", "type": "stock"}]
    Output: {"BTC": 67000.0, "AAPL": 175.32}
    """
    prices = {}
    for item in symbols_with_types:
        symbol = item["symbol"]
        asset_type = item["type"]
        price = get_asset_price(symbol, asset_type)
        prices[symbol] = price
    return prices
