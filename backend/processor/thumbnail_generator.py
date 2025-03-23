'''Methods to generate thumbnails for images.'''
from PIL import Image
import os

def generate_thumbnail(source_path: str, destination_path: str, size: tuple = (200, 200)):
    """Generate a thumbnail from source image and save it to destination path."""
    try:
        # Ensure destination directory exists
        os.makedirs(os.path.dirname(destination_path), exist_ok=True)
        
        # Open and generate thumbnail
        with Image.open(source_path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            
            # Generate thumbnail
            img.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Save thumbnail
            img.save(destination_path, "JPEG", quality=85)
            
        return True
    except Exception as e:
        print(f"Error generating thumbnail: {str(e)}")
        return False