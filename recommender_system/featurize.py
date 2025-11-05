import os
import numpy as np
import pickle
import tensorflow as tf
from keras.applications.resnet50 import ResNet50, preprocess_input
from keras.layers import GlobalMaxPooling2D
from sklearn.neighbors import NearestNeighbors
from numpy.linalg import norm
from PIL import Image
import cv2

# Function to recommend nearest images based on features
def recommend(features, feature_list, n=10):
    neighbors = NearestNeighbors(n_neighbors=n, algorithm='brute', metric='euclidean')
    neighbors.fit(feature_list)
    distance, indices = neighbors.kneighbors([features])
    return indices

# Function to extract features using the ResNet50 model
def extract_feature(img, model):
    img = cv2.resize(np.array(img), (224, 224))
    expand_img = np.expand_dims(img, axis=0)
    pre_image = preprocess_input(expand_img)
    result = model.predict(pre_image).flatten()
    normalized = result / norm(result)  # Normalize the features
    return normalized

# Initialize the ResNet50 model for feature extraction
model = ResNet50(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
model.trainable = False
model = tf.keras.Sequential([
    model,
    GlobalMaxPooling2D()
])

# Dataset creation function to load images and extract features
def create_image_feature_list(image_dir, model):
    features_list = []
    image_paths = [os.path.join(image_dir, img) for img in os.listdir(image_dir) if img.endswith(('.jpg', '.png'))]
    
    for i, img_path in enumerate(image_paths):
        img = Image.open(img_path).convert("RGB")  # Load image and convert to RGB
        feature = extract_feature(img, model)  # Extract features
        features_list.append(feature)
        print(f"Processed {i+1}/{len(image_paths)}: {img_path}")
    
    return features_list, image_paths

# Directory containing your images
image_dir = r"C:\UTEM\Course\Sem 5\BAXU 3923 (Workshop 2)\dataset\test\cloth"

# Create and extract features from images
features_list, image_paths = create_image_feature_list(image_dir, model)

# Save both the feature list and image paths to a file using pickle
save_path = 'extracted_features_with_paths.pkl'
with open(save_path, 'wb') as file:
    pickle.dump((features_list, image_paths), file)  # Saving as a tuple

print(f"Features and image paths saved to {save_path}")

# Example usage of recommendation based on extracted features
def recommend_similar_images(query_image_path, model, features_list, image_paths, n=5):
    query_img = Image.open(query_image_path).convert("RGB")
    query_feature = extract_feature(query_img, model)
    
    indices = recommend(query_feature, features_list, n)
    recommended_images = [image_paths[idx] for idx in indices[0]]
    
    return recommended_images

# Example: Find top 5 similar images to a query image
# query_image_path = r"datasets\test\cloth\01260_00.jpg"
query_image_path = r"C:\UTEM\Course\Sem 5\BAXU 3923 (Workshop 2)\dataset\test\cloth\00006_00.jpg"

recommended_images = recommend_similar_images(query_image_path, model, features_list, image_paths)

print("Recommended images:", recommended_images)