#!/usr/bin/env python3
"""
AgentTrade × Adaption AI Integration v2
- Fetch 60 days hourly data from Binance (free, no rate limits)
- Calculate technical indicators
- Generate decision labels
- Upload to Adaption & train AutoScientist model
"""
import os, json, time, csv
from datetime import datetime, timezone
from adaption import Adaption, DatasetTimeout
import requests

API_KEY = "pt_live_a8659df24f9d84851dd6b0cd31853271f23155ae"
ADAPTION = Adaption(api_key=API_KEY)

SYMBOLS = ["BTCUSDT", "ETHUSDT", "SOLUSDT"]
OUT_DIR = "/home/node/.openclaw/workspace/agenttrade/data"
os.makedirs(OUT_DIR, exist_ok=True)

def fetch_binance_klines(symbol, interval="1h", limit=1440):
    """Fetch klines from Binance (no API key needed, generous rate limits)"""
    url = "https://api.binance.com/api/v3/klines"
    params = {"symbol": symbol, "interval": interval, "limit": limit}
    r = requests.get(url, params=params, timeout=30)
    r.raise_for_status()
    data = r.json()
    print(f"  {symbol}: {len(data)} candles")
    return data

def compute_rsi(prices, period=14):
    if len(prices) < period + 1:
        return 50.0
    deltas = [prices[i] - prices[i-1] for i in range(1, len(prices))]
    gains = [d if d > 0 else 0 for d in deltas]
    losses = [-d if d < 0 else 0 for d in deltas]
    avg_gain = sum(gains[-period:]) / period
    avg_loss = sum(losses[-period:]) / period
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return 100 - (100 / (1 + rs))

def compute_sma(prices, period):
    if len(prices) < period:
        return sum(prices) / len(prices)
    return sum(prices[-period:]) / period

def generate_decision(price, prev_price, rsi, sma20, sma50):
    pct_change = ((price - prev_price) / prev_price) * 100 if prev_price else 0
    if rsi < 30 and pct_change > 0.5:
        return "BULLISH", 85
    elif rsi < 35 and pct_change > 0.3:
        return "BULLISH", 70
    elif rsi > 70 and pct_change < -0.5:
        return "BEARISH", 85
    elif rsi > 65 and pct_change < -0.3:
        return "BEARISH", 70
    elif pct_change > 2.0 and sma20 > sma50:
        return "BULLISH", 75
    elif pct_change < -2.0 and sma20 < sma50:
        return "BEARISH", 75
    elif pct_change > 1.0:
        return "BULLISH", 55
    elif pct_change < -1.0:
        return "BEARISH", 55
    else:
        return "HOLD", 50

# ─── Collect + Process ───
all_rows = []
for symbol in SYMBOLS:
    ticker = symbol.replace("USDT", "")
    print(f"\n[{ticker}] Fetching {symbol} from Binance...")
    
    klines = fetch_binance_klines(symbol)
    # klines: [open_time, open, high, low, close, volume, ...]
    close_prices = [float(k[4]) for k in klines]
    timestamps = [int(k[0]) for k in klines]
    
    print(f"  Processing {len(close_prices)} candles...")
    
    for i in range(1, len(close_prices)):
        price = close_prices[i]
        prev_price = close_prices[i-1]
        ts = timestamps[i] / 1000
        
        lookback = close_prices[:i+1]
        rsi = compute_rsi(lookback)
        sma20 = compute_sma(lookback, min(20, len(lookback)))
        sma50 = compute_sma(lookback, min(50, len(lookback)))
        
        decision, confidence = generate_decision(price, prev_price, rsi, sma20, sma50)
        pct = ((price - prev_price) / prev_price) * 100
        
        all_rows.append({
            "timestamp": datetime.fromtimestamp(ts, tz=timezone.utc).isoformat(),
            "symbol": ticker,
            "price_usd": round(price, 2),
            "rsi_14": round(rsi, 1),
            "sma_20": round(sma20, 2),
            "sma_50": round(sma50, 2),
            "pct_change_1h": round(pct, 2),
            "decision": decision,
            "confidence": confidence,
        })

print(f"\nTotal rows: {len(all_rows)}")

# Save CSV
csv_path = f"{OUT_DIR}/training_data.csv"
with open(csv_path, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=[
        "timestamp", "symbol", "price_usd", "rsi_14", "sma_20", "sma_50",
        "pct_change_1h", "decision", "confidence"
    ])
    writer.writeheader()
    writer.writerows(all_rows)
print(f"CSV saved ({len(all_rows)} rows)")

# ─── Upload to Adaption ───
print("\n=== Uploading to Adaption ===")
result = ADAPTION.datasets.upload_file(csv_path, name="agenttrade-crypto-60d")
dataset_id = result.dataset_id
print(f"Dataset ID: {dataset_id}")

# Wait for processing
print("Waiting for ingestion...")
while True:
    status = ADAPTION.datasets.get_status(dataset_id)
    print(f"  Status: {status.status}, rows: {status.row_count}")
    if status.row_count is not None:
        break
    time.sleep(3)

# ─── AutoScientist ───
print("\n=== Starting AutoScientist Run ===")
try:
    run = ADAPTION.datasets.run(
        dataset_id,
        column_mapping={
            "prompt": "symbol",
            "completion": "decision"
        },
    )
    run_id = run.run_id
    print(f"Run ID: {run_id}")
    print(f"Estimated: {run.estimated_minutes} min")
    
    print("\nWaiting for completion...")
    try:
        final = ADAPTION.datasets.wait_for_completion(dataset_id, timeout=3600)
        print(f"Finished: {final.status}")
        if final.error:
            print(f"Error: {final.error.message}")
    except DatasetTimeout as e:
        print(f"Timed out: {e}")
        final = None
except Exception as e:
    print(f"Run failed: {e}")
    final = None

# ─── Download results ───
if final and final.status == "succeeded":
    print("\n=== Downloading ===")
    url = ADAPTION.datasets.download(dataset_id)
    print(f"Download URL: {url}")
    
    info = {
        "dataset_id": dataset_id,
        "rows": len(all_rows),
        "symbols": ["BTC", "ETH", "SOL"],
        "status": "succeeded",
        "download_url": url,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }
    with open(f"{OUT_DIR}/adaption_result.json", "w") as f:
        json.dump(info, f, indent=2)
    print("Result saved!")

print("\n=== DONE ===")
print(f"Adaption Dashboard: https://adaptionlabs.ai/app/datasets/{dataset_id}")
