from PIL import Image
import os
import sys

# Configuration
# Assuming script is in <root>/scripts, getting <root>
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

SOURCE_IMAGE_PATH = os.path.join(PROJECT_ROOT, 'frontend', 'public', 'logo.png')
PUBLIC_DIR = os.path.join(PROJECT_ROOT, 'frontend', 'public')
ICONS_DIR = os.path.join(PROJECT_ROOT, 'frontend', 'public', 'icons')

# Public logos (Webp)
PUBLIC_LOGOS = [
    {'name': 'icon-192.webp', 'size': (192, 192)},
    {'name': 'icon-512.webp', 'size': (512, 512)},
]

# Icons (WebP)
ICON_SIZES = [48, 72, 96, 128, 192, 256, 512]

def generate_logos():
    try:
        if not os.path.exists(SOURCE_IMAGE_PATH):
             print(f"Error: Source image not found at {SOURCE_IMAGE_PATH}")
             return

        # Load source image
        img = Image.open(SOURCE_IMAGE_PATH)
        print(f"Loaded source image from {SOURCE_IMAGE_PATH}")

        # Ensure directories exist
        if not os.path.exists(PUBLIC_DIR):
            os.makedirs(PUBLIC_DIR)
            print(f"Created directory: {PUBLIC_DIR}")
        
        if not os.path.exists(ICONS_DIR):
            os.makedirs(ICONS_DIR)
            print(f"Created directory: {ICONS_DIR}")

        # Generate Public Logos
        print("Generating public logos...")
        for logo in PUBLIC_LOGOS:
            resized_img = img.resize(logo['size'], Image.Resampling.LANCZOS)
            output_path = os.path.join(PUBLIC_DIR, logo['name'])
            
            # Determine format based on extension
            if logo['name'].lower().endswith('.webp'):
                resized_img.save(output_path, format='WEBP')
            else:
                resized_img.save(output_path, format='PNG')
                
            print(f"Saved {logo['name']} to {output_path}")

        # Generate Icons
        print("Generating icons...")
        for size in ICON_SIZES:
            resized_img = img.resize((size, size), Image.Resampling.LANCZOS)
            output_filename = f"icon-{size}.webp"
            output_path = os.path.join(ICONS_DIR, output_filename)
            resized_img.save(output_path, format='WEBP')
            print(f"Saved {output_filename} to {output_path}")

        print("All images generated successfully.")

    except Exception as e:
        print(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    generate_logos()
