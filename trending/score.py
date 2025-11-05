from trending.models import load_trending_data

def get_trending_outfits(top_n=5):
    data = load_trending_data()
    scored = []

    for outfit_id, stats in data.items():
        avg_rating = sum(stats["ratings"]) / len(stats["ratings"]) if stats["ratings"] else 0
        score = (2 * stats["likes"]) + (1 * stats["clicks"]) + (3 * avg_rating)
        scored.append((outfit_id, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored[:top_n]