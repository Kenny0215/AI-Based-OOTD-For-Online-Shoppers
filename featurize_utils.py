import pickle
import numpy as np
from PIL import Image
import matplotlib.pyplot as plt
from sklearn.neighbors import NearestNeighbors
import tensorflow as tf
from keras.applications.resnet50 import ResNet50, preprocess_input
from keras.layers import GlobalMaxPooling2D
from numpy.linalg import norm
import os

# Function to load the pickle file (features and image paths)
def load_features_and_paths(pickle_path):
    with open(pickle_path, 'rb') as file:
        features_list, image_paths = pickle.load(file)
    return features_list, image_paths

# Function to recommend the most similar images based on features
def recommend_cloth(features, feature_list, n=5):
    neighbors = NearestNeighbors(n_neighbors=n, algorithm='brute', metric='euclidean')
    neighbors.fit(feature_list)
    distances, indices = neighbors.kneighbors([features])
    return indices

# Function to extract features from a query image
def extract_feature(img, model):
    img = img.resize((224, 224))
    img = np.array(img)
    expand_img = np.expand_dims(img, axis=0)
    pre_image = preprocess_input(expand_img)
    result = model.predict(pre_image).flatten()
    normalized = result / norm(result)
    return normalized


# Initialize the model for feature extraction
model = ResNet50(weights='imagenet', include_top=False, input_shape=(224, 224, 3))
model.trainable = False
model = tf.keras.Sequential([
    model,
    GlobalMaxPooling2D()
])

# pickle_path = 'extracted_features_with_paths.pkl'
# pickle_path = 'recomextracted_features_with_paths.pkl'
pickle_path = 'recommender_system/extracted_features_with_paths.pkl'



features_list, image_paths = load_features_and_paths(pickle_path)