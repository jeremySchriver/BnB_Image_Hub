from b2sdk.v2 import B2Api, InMemoryAccountInfo
from typing import Optional, BinaryIO
import os
import io
from dotenv import load_dotenv
import logging

logger = logging.getLogger(__name__)

class B2Storage:
    def __init__(self):
        load_dotenv()
        self.info = InMemoryAccountInfo()
        self.api = B2Api(self.info)
        self.api.authorize_account("production", 
                                 os.getenv('B2_APPLICATION_KEY_ID'),
                                 os.getenv('B2_APPLICATION_KEY'))
        self.bucket = self.api.get_bucket_by_name(os.getenv('B2_BUCKET_NAME'))
        self.base_url = os.getenv('B2_DOWNLOAD_URL')

    def _get_file_path(self, file_name: str) -> str:
        """Normalize file path for B2 storage"""
        return file_name.replace('\\', '/').lstrip('/')
    
    def get_file_url(self, file_name: str) -> str:
        """Get the public URL for a file"""
        normalized_path = self._get_file_path(file_name)
        return f"{self.base_url}/{normalized_path}"
    
    def upload_file(self, file_data: BinaryIO, file_name: str, content_type: str) -> str:
        """Upload a file to B2 and return its URL"""
        try:
            print(f"Starting B2 upload for: {file_name}")  # Debug print
            
            # Reset file pointer
            file_data.seek(0)
            
            # Read the data
            data = file_data.read()
            
            # Upload to B2
            file_info = self.bucket.upload_bytes(
                data,
                file_name,  # Use the full path including folders
                content_type=content_type
            )
            
            # Construct and return the full URL
            url = f"{self.base_url}/file/{self.bucket.name}/{file_name}"
            print(f"Successfully uploaded to B2: {url}")  # Debug print
            return url
            
        except Exception as e:
            print(f"B2 upload failed for {file_name}: {str(e)}")  # Debug print
            raise

    def download_file(self, file_url: str) -> Optional[bytes]:
        """Download a file from B2"""
        download_buffer = io.BytesIO()
        try:
            # Extract the file path from the URL if it's a full URL
            if file_url.startswith('http'):
                file_path = file_url.split('/file/' + self.bucket.name + '/')[1]
            else:
                file_path = self._get_file_path(file_url)
                
            logger.info(f"Downloading file from B2: {file_path}")
            self.bucket.download_file_by_name(file_path, download_buffer)
            download_buffer.seek(0)
            return download_buffer.getvalue()
        except Exception as e:
            logger.error(f"Error downloading file {file_url}: {str(e)}")
            return None

    def delete_file(self, file_name: str) -> bool:
        """Delete a file from B2"""
        try:
            file_version = self.bucket.get_file_info_by_name(file_name)
            self.bucket.delete_file_version(file_version.id_, file_name)
            return True
        except Exception as e:
            print(f"Error deleting file {file_name}: {str(e)}")
            return False