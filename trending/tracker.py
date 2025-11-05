from trending.models import load_trending_data, save_trending_data

def update_interaction(outfit_id, action, rating=None):
    data = load_trending_data()
    if outfit_id not in data:
        data[outfit_id] = {
            "likes": 0,
            "clicks": 0,
            "ratings": []
        }

    if action == "like":
        data[outfit_id]["likes"] += 1
    elif action == "click":
        data[outfit_id]["clicks"] += 1
    elif action == "rate" and rating:
        data[outfit_id]["ratings"].append(rating)

    save_trending_data(data)