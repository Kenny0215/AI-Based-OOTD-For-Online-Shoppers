# 🧠 AI-Based OOTD (Outfit of the Day) for Online Shoppers

An intelligent fashion recommendation system designed to enhance the **online shopping experience** by integrating **AI-driven outfit recommendations**, **virtual try-on (VTON)** visualization, and an **interactive chatbot assistant**.  
This project aims to help users discover, visualize, and interact with fashion choices through a seamless and engaging AI interface.

---

## 🎯 Project Objectives

1. **To develop an AI recommendation module** that suggests clothing combinations based on user preferences and outfit attributes.  
2. **To implement a virtual try-on system (VTON)** that enables users to visualize recommended outfits on their own images.  
3. **To design a fashion chatbot assistant** that allows natural interaction with the system for outfit recommendations, virtual try-ons, and fashion tips.  
4. **To improve the online shopping experience** by providing intelligent, interactive, and personalized fashion suggestions.  

---

## 📘 Project Scope

The **AI-Based OOTD for Online Shoppers** system focuses on:

- **Recommendation Intelligence** — generating suitable outfit combinations using AI/ML models.  
- **Visualization Experience** — providing realistic outfit try-on simulation through VTON techniques.  
- **Conversational Assistance** — enabling users to communicate with the system using a chatbot interface.  
- **Integration for Online Retail** — connecting the modules into a unified platform that supports potential e-commerce applications.

> The project does not include real-time e-commerce transactions but focuses on the intelligent fashion recommendation pipeline.

---

## 📚 Literature Review Summary

Fashion recommendation systems have evolved from simple attribute-based filtering to advanced **AI-driven personalization**.  
Research indicates that **computer vision and deep learning** can effectively analyze fashion features like color, texture, and compatibility.  
Key developments in the field include:

| Study | Focus | Key Findings |
|:--|:--|:--|
| Han et al. (2017) – *FashionNet* | Outfit compatibility learning | Deep neural networks can model clothing relationships and aesthetics effectively. |
| Jetchev & Bergmann (2018) – *Conditional VTON* | Virtual try-on using GANs | Image-based try-on models improve user visualization accuracy. |
| Wang et al. (2020) – *FashionBERT* | Multimodal embeddings | Combining text and image features enhances outfit understanding. |
| Recent Trends (2023–2024) | Chat-based retail assistants | NLP-based chatbots improve personalization and user engagement. |

The integration of **recommendation, visualization, and conversational AI** forms the backbone of modern intelligent shopping systems — which this project aims to replicate in a simplified, modular structure.

---

## 🧩 System Modules Overview

### 🧠 **Module 1: AI-Based Recommendation System**
- Suggests outfit combinations (top, bottom, accessories) based on color harmony, texture, and style.  
- Uses image feature extraction and similarity-based matching to generate recommendations.  
- Output: Recommended outfit list or images.  

---

### 🧥 **Module 2: Virtual Try-On (VTON)**
- Allows users to visualize how recommended outfits appear on their uploaded image.  
- Uses image segmentation, warping, and blending techniques.  
- Integrates with preprocessed clothing datasets and body keypoints.  

**Output:** Realistic visualization of user wearing the selected outfit.

---

### 💬 **Module 3: Fashion Chatbot (AI Shopping Assistant)**
- Provides a conversational interface for user interaction.  
- Detects user intents (e.g., “recommend outfit”, “try it on”, “show trends”) and triggers corresponding modules.  
- Offers styling tips and answers basic fashion-related questions.  

**Output:** Chat-based recommendations, interactive responses, and try-on commands.

---

## 🏗️ System Architecture

```plaintext
+--------------------------------------------------------------+
|                      AI-Based OOTD System                    |
+--------------------------------------------------------------+
|                     USER INTERFACE LAYER                     |
|  - Streamlit Web App                                         |
|  - Chatbot UI / Upload Image Interface                       |
+--------------------------------------------------------------+
|                   APPLICATION / LOGIC LAYER                  |
|  [Module 1] Recommendation Engine  --> Suggests outfits      |
|  [Module 2] Virtual Try-On System    --> Visualizes results   |
|  [Module 3] Fashion Chatbot          --> Interacts with user  |
+--------------------------------------------------------------+
|                       DATA LAYER                             |
|  - Clothing Dataset (images, attributes)                     |
|  - User preferences / profile data                           |
|  - Pre-trained models (feature extraction, segmentation)     |
+--------------------------------------------------------------+
```
## Project Flow
```plaintext
  ┌──────────────────────────────────────────────────────┐
  │                   User Interaction                   │
  │ (Chatbot or Image Upload)                            │
  └──────────────────────────────────────────────────────┘
                        │
                        ▼
        ┌──────────────────────────────────────┐
        │  Module 1: Recommendation Engine     │
        │  → Generates top outfit matches       │
        └──────────────────────────────────────┘
                        │
                        ▼
        ┌──────────────────────────────────────┐
        │  Module 2: Virtual Try-On (VTON)     │
        │  → Visualizes outfit on user image    │
        └──────────────────────────────────────┘
                        │
                        ▼
        ┌──────────────────────────────────────┐
        │  Module 3: Fashion Chatbot           │
        │  → Handles user chat & feedback       │
        └──────────────────────────────────────┘
                        │
                        ▼
           ┌────────────────────────────────┐
           │      Display Final Output       │
           │ (Recommended & Try-On Results)  │
           └────────────────────────────────┘

```


<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1DNsXQlAjpoZV8PJ8XuBZIxvB143vgff6

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
