import requests

def fetch_trending_outfits():
    url = "https://asos2.p.rapidapi.com/products/v2/list"
    params = {
        "store": "US",
        "offset": "0",
        "categoryId": "4209",  # Example category: Women Dresses
        "limit": "10",
        "sort": "freshness"
    }
    headers = {
        "X-RapidAPI-Key": "YOUR_RAPIDAPI_KEY",
        "X-RapidAPI-Host": "asos2.p.rapidapi.com"
    }

    response = requests.get(url, headers=headers, params=params)
    
    if response.status_code == 200:
        data = response.json()
        return data.get("products", [])
    else:
        return []