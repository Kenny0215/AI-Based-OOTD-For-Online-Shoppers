from featurize_utils import recommend_cloth, extract_feature, image_paths, features_list, model, Image

def recommend():
    query_image_path = "uploaded_image.jpg"
    query_img = Image.open(query_image_path).convert("RGB")

    query_feature = extract_feature(query_img, model)

    top_n = 5  # Change this value to get more or fewer similar images
    indices = recommend_cloth(query_feature, features_list, n=top_n)
    similar_image_paths = [image_paths[idx] for idx in indices[0]]

    output_file_path = 'recommend_clothes.txt'
    with open(output_file_path, 'w') as file:
        for path in similar_image_paths:
            file.write(f"{path}\n")
