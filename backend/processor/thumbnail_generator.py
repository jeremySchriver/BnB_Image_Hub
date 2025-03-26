'''Methods to generate preview images for different use cases.'''
from PIL import Image
import os
import logging

from backend.config import TAG_PREVIEW_DIR, SEARCH_PREVIEW_DIR

logger = logging.getLogger(__name__)

def generate_previews(source_path: str, new_filename: str = None) -> bool:
    """Generate preview images at different sizes for different use cases."""
    try:
        # Ensure destination directories exist
        os.makedirs(TAG_PREVIEW_DIR, exist_ok=True)
        os.makedirs(SEARCH_PREVIEW_DIR, exist_ok=True)
        
        # Map preview types to their directories and dimensions
        preview_configs = {
            'preview': {
                'dir': TAG_PREVIEW_DIR,
                'size': (800, 800)      # Full preview for tagging page
            },
            'search': {
                'dir': SEARCH_PREVIEW_DIR,
                'size': (400, 400)      # Smaller preview for search grid
            }
        }
        
        # Determine filename to use
        if new_filename:
            # Use new filename without extension
            base_filename = os.path.splitext(new_filename)[0]
        else:
            # Use original filename without extension
            filename = os.path.basename(source_path)
            base_filename = os.path.splitext(filename)[0]
        
        with Image.open(source_path) as img:
            # Convert RGBA/P images to RGB with white background
            if img.mode in ('RGBA', 'P'):
                background = Image.new('RGB', img.size, 'white')
                if img.mode == 'RGBA':
                    background.paste(img, mask=img.split()[3])
                else:
                    background.paste(img)
                img = background
            
            # Generate both preview sizes
            for preview_type, config in preview_configs.items():
                preview_path = os.path.join(
                    config['dir'],
                    f"{base_filename}.jpg"  # Simplified filename without type suffix
                )
                
                # Create a copy to avoid modifying original
                img_copy = img.copy()
                
                # Calculate new size maintaining aspect ratio
                width, height = img_copy.size
                dimensions = config['size']
                ratio = min(dimensions[0]/width, dimensions[1]/height)
                
                # Only resize if image is larger than target size
                if ratio < 1:
                    new_size = (int(width * ratio), int(height * ratio))
                    img_copy = img_copy.resize(new_size, Image.Resampling.LANCZOS)
                
                # Save preview with optimization
                img_copy.save(
                    preview_path,
                    "JPEG",
                    quality=85,
                    optimize=True
                )
                logger.info(f"Generated {preview_type} preview at {preview_path}")
                
        return True
        
    except Exception as e:
        logger.error(f"Error generating previews for {source_path}: {str(e)}")
        return False