import json
import os

TRENDING_FILE = "trending/trending_data.json"

def load_trending_data():
    if os.path.exists(TRENDING_FILE):
        with open(TRENDING_FILE, "r") as f:
            return json.load(f)
    return {}

def save_trending_data(data):
    with open(TRENDING_FILE, "w") as f:
        json.dump(data, f, indent=4)
