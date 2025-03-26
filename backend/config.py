import os

# Base directories
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILE_SHARE_DIR = os.path.join(BASE_DIR, "file_share")

# Specific directories
UNTAGGED_DIR = os.path.join(FILE_SHARE_DIR, "un-tagged")
TAGGED_DIR = os.path.join(FILE_SHARE_DIR, "tagged")
TAG_PREVIEW_DIR = os.path.join(FILE_SHARE_DIR, "tag_preview")
SEARCH_PREVIEW_DIR = os.path.join(FILE_SHARE_DIR, "search_preview")


# Ensure directories exist
for directory in [FILE_SHARE_DIR, UNTAGGED_DIR, TAGGED_DIR, TAG_PREVIEW_DIR, SEARCH_PREVIEW_DIR]:
    os.makedirs(directory, exist_ok=True)