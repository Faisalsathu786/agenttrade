#!/usr/bin/env python3
"""Check Adaption training status and update frontend data"""
import json, sys
from adaption import Adaption

API_KEY = "pt_live_a8659df24f9d84851dd6b0cd31853271f23155ae"
client = Adaption(api_key=API_KEY)

try:
    dataset_id = open("data/dataset_id.txt").read().strip()
except FileNotFoundError:
    print("No training started yet")
    sys.exit(0)

status = client.datasets.get_status(dataset_id)
print(f"Dataset: {status.status}, rows: {status.row_count}")

# Update JSON
info_path = "data/adaption_info.json"
try:
    info = json.load(open(info_path))
except:
    info = {}

info["status"] = status.status
info["rows"] = status.row_count or info.get("rows", 0)

if status.status == "succeeded":
    try:
        url = client.datasets.download(dataset_id)
        info["download_url"] = url
        info["ready"] = True
        print(f"Model ready! Download: {url}")
    except Exception as e:
        print(f"Download fail: {e}")

json.dump(info, open(info_path, "w"), indent=2)
# Also copy to public
import shutil
shutil.copy(info_path, "public/data/adaption_info.json")
print("Info updated!")
