from abc import ABC, abstractmethod
from typing import BinaryIO, Optional
import os
from .b2_storage import B2Storage
from backend.config import settings

class StorageInterface(ABC):
    @abstractmethod
    def upload_file(self, file_data: BinaryIO, file_name: str, content_type: str) -> str:
        pass

    @abstractmethod
    def download_file(self, file_name: str) -> Optional[bytes]:
        pass

    @abstractmethod
    def delete_file(self, file_name: str) -> bool:
        pass

class LocalStorage(StorageInterface):
    def upload_file(self, file_data: BinaryIO, file_name: str, content_type: str) -> str:
        # Existing local storage logic
        pass

    def download_file(self, file_name: str) -> Optional[bytes]:
        # Existing local storage logic
        pass

    def delete_file(self, file_name: str) -> bool:
        # Existing local storage logic
        pass

def get_storage_provider() -> StorageInterface:
    if settings.STORAGE_TYPE == "b2":
        return B2Storage()
    return LocalStorage()