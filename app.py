import streamlit as st
from PIL import Image
import os
from featurize_cloth import recommend  
from load_network_setup import gmm, alias, seg, opt
from utils import test

# === Trending Logic Imports ===
from trending.tracker import update_interaction
from trending.score import get_trending_outfits

# === Custom Styling ===
st.markdown("""
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap');
        html, body, [class*="css"] {
            font-family: 'Poppins', sans-serif;
            background: linear-gradient(to right, #e0eafc, #cfdef3);
        }
        .stButton>button {
            background: linear-gradient(45deg, #0072ff, #00c6ff);
            color: white;
            border: none;
            border-radius: 12px;
            padding: 12px 28px;
            font-size: 16px;
            margin: 6px 3px;
            transition: all 0.4s ease;
            box-shadow: 0 4px 14px rgba(0,118,255,0.4);
        }
        .stButton>button:hover {
            transform: translateY(-2px);
            background: linear-gradient(45deg, #0052cc, #00aaff);
            box-shadow: 0 6px 20px rgba(0,118,255,0.6);
        }
        .stImage img {
            border-radius: 20px;
            box-shadow: 0 4px 14px rgba(0,0,0,0.15);
            transition: transform 0.4s ease, box-shadow 0.4s ease;
            opacity: 0;
            animation: fadeIn 1s ease forwards;
        }
        @keyframes fadeIn {
            to { opacity: 1; }
        }
        .main-header {
            font-size: 3em;
            color: #0a2540;
            text-align: center;
            margin-bottom: 30px;
            font-weight: 700;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
        }
        .stAlert { border-radius: 12px; }
    </style>
""", unsafe_allow_html=True)

# === Global Variables ===
predefined_image_path = r"datasets/test/image/00563_00.jpg"
recommended_clothes_file = "recommend_clothes.txt"
generated_images_dir = r"results/test"
predefined_image_name = "00563_00.jpg"
test_pairs_file = r"datasets/test_pairs.txt"

# === Helper Functions ===
def save_image_pairs(selected_images, predefined_image, file_path):
    with open(file_path, 'w') as file:
        for img_path in selected_images:
            image_name = os.path.basename(img_path)
            file.write(f"{predefined_image} {image_name}\n")

def load_image_paths(file_path):
    if os.path.exists(file_path):
        with open(file_path, 'r') as file:
            return [line.strip() for line in file]
    return []

def display_images_with_checkboxes(image_paths):
    selected_images = []
    num_columns = min(4, len(image_paths)) if image_paths else 1
    cols = st.columns(num_columns)
    for i, img_path in enumerate(image_paths):
        img = Image.open(img_path)
        with cols[i % num_columns]:
            st.image(img, caption=f"Image {i+1}", use_container_width=True)
            if st.checkbox(f"Select Image {i+1}", key=f"select_{img_path}"):
                selected_images.append(img_path)
    return selected_images

# === Session Initialization ===
if 'selected_images_paths' not in st.session_state:
    st.session_state.selected_images_paths = []
if 'current_page' not in st.session_state:
    st.session_state.current_page = 'Recommendations'

# === Header ===
st.markdown('<div class="main-header">Virtual Try-On</div>', unsafe_allow_html=True)

# === Navigation Tabs ===
col1, col2, col3, col4 = st.columns([1, 1, 1, 1])

with col1:
    if st.button("Recommendations"):
        st.session_state.current_page = 'Recommendations'

with col2:
    if st.button("Results"):
        if st.session_state.selected_images_paths:
            st.session_state.current_page = 'Results'
        else:
            st.warning("Please select clothes and click 'Try On' first.")

with col3:
    if st.button("All Generated Images"):
        st.session_state.current_page = 'All Generated Images'

with col4:
    if st.button("Trending Shirts"):
        st.session_state.current_page = 'Trending Shirts'

# === Sidebar Controls ===
with st.sidebar:
    logo_path = "logo/logo.png"
    cols = st.columns([0.3, 0.7])
    if os.path.exists(logo_path):
        with cols[0]:
            st.image(logo_path, width=50)
    with cols[1]:
        st.markdown("<h3 style='margin: 15px 0 0 5px;'>Virtual Try-On</h3>", unsafe_allow_html=True)

    predefined_image = Image.open(predefined_image_path)
    st.image(predefined_image, caption="Person Image", use_container_width=True)

    uploaded_image = st.file_uploader("Select Dress Image", type=["jpg", "png", "jpeg"])

    if st.button("Recommend Dress"):
        if uploaded_image:
            uploaded_image_path = 'uploaded_image.jpg'
            with open(uploaded_image_path, 'wb') as file:
                file.write(uploaded_image.read())
            with st.spinner("Generating dress recommendations..."):
                recommend()
            st.success("Dress recommendation generated! Check Recommendations tab.")
            st.session_state.current_page = 'Recommendations'
        else:
            st.error("Please upload a dress image first.")

    if st.button("Try On"):
        if st.session_state.selected_images_paths:
            save_image_pairs(st.session_state.selected_images_paths, predefined_image_name, test_pairs_file)
            with st.spinner("Generating virtual try-on results..."):
                test(opt, seg, gmm, alias)
            st.success("Generated images are ready! Check Results tab.")
            st.session_state.current_page = 'Results'
        else:
            st.error("Please select at least one dress from recommendations.")

# === Page Routing ===
if st.session_state.current_page == 'Recommendations':
    st.header("Recommended Clothes")
    recommended_clothes = load_image_paths(recommended_clothes_file)
    if recommended_clothes:
        selected_clothes = display_images_with_checkboxes(recommended_clothes)
        st.session_state.selected_images_paths = selected_clothes

        if selected_clothes:
            st.success(f"{len(selected_clothes)} item(s) selected.")
            for img_path in selected_clothes:
                outfit_id = os.path.basename(img_path)
                update_interaction(outfit_id, "click")
                update_interaction(outfit_id, "like")

            st.markdown("### 🔥 Trending Outfits (Based on User Selections)")
            trending = get_trending_outfits()
            if trending:
                cols = st.columns(len(trending))
                for i, (outfit_id, score) in enumerate(trending):
                    img_path = f"datasets/test/cloth/{outfit_id}"
                    if os.path.exists(img_path):
                        with cols[i]:
                            st.image(Image.open(img_path), caption=f"{outfit_id}\n🔥 Score: {round(score, 2)}", use_container_width=True)
            else:
                st.info("No trending data yet. Select some outfits to see trends!")
        else:
            st.info("Select images to see trending data.")
    else:
        st.info("No dress recommendations yet. Upload an image and click 'Recommend Dress'.")

elif st.session_state.current_page == 'Results':
    st.header("Virtual Try-On Results")
    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Selected Dress")
        if st.session_state.selected_images_paths:
            for img_path in st.session_state.selected_images_paths:
                st.image(Image.open(img_path), caption=os.path.basename(img_path), use_container_width=True)
        else:
            st.info("No dress selected.")
    with col2:
        st.subheader("Generated Image")
        if os.path.exists(generated_images_dir) and st.session_state.selected_images_paths:
            for selected_dress in st.session_state.selected_images_paths:
                selected_dress_name = os.path.splitext(os.path.basename(selected_dress))[0]
                matched_generated = [
                    os.path.join(generated_images_dir, img)
                    for img in os.listdir(generated_images_dir)
                    if selected_dress_name in img
                ]
                if matched_generated:
                    for img_path in matched_generated:
                        st.image(Image.open(img_path), caption=os.path.basename(img_path), use_container_width=True)
                else:
                    st.warning(f"No generated image found for {selected_dress_name}")
        else:
            st.info("Generate an image using the 'Try On' button.")

elif st.session_state.current_page == 'All Generated Images':
    st.header("All Generated Images")
    if os.path.exists(generated_images_dir):
        all_generated_images = [
            os.path.join(generated_images_dir, img) for img in os.listdir(generated_images_dir)
        ]
        if all_generated_images:
            cols = st.columns(3)
            for i, img_path in enumerate(all_generated_images):
                with cols[i % 3]:
                    st.image(Image.open(img_path), caption=os.path.basename(img_path), use_container_width=True)
        else:
            st.info("No generated images available yet.")
    else:
        st.warning("Generated images directory not found. Run 'Try On' first.")

if st.session_state.current_page == 'Trending Shirts':
    st.header("Trending Shirts")
    trending = get_trending_outfits(top_n=10)
    if 'selected_trending_images' not in st.session_state:
        st.session_state.selected_trending_images = []
    if trending:
        cols = st.columns(min(5, len(trending)))
        for i, (outfit_id, score) in enumerate(trending):
            img_path = f"datasets/test/cloth/{outfit_id}"
            if os.path.exists(img_path):
                with cols[i % len(cols)]:
                    st.image(Image.open(img_path), caption="", use_container_width=True)
                    checked = st.checkbox("Select", key=f"trending_select_{outfit_id}")
                    if checked:
                        if img_path not in st.session_state.selected_trending_images:
                            st.session_state.selected_trending_images.append(img_path)
                    else:
                        if img_path in st.session_state.selected_trending_images:
                            st.session_state.selected_trending_images.remove(img_path)
        if st.button("Try On Selected Trending Shirts"):
            if st.session_state.selected_trending_images:
                save_image_pairs(st.session_state.selected_trending_images, predefined_image_name, test_pairs_file)
                with st.spinner("Generating virtual try-on results for trending shirts..."):
                    test(opt, seg, gmm, alias)
                st.success("Generated images are ready! Check Results tab.")
                st.session_state.current_page = 'Results'
            else:
                st.error("Please select at least one trending shirt to try on.")
    else:
        st.info("Trending data not available. Interact with recommended outfits to populate this section.")