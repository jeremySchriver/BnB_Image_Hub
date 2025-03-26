from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from .base import Base
from datetime import datetime

class Image(Base):
    __tablename__ = 'images'

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    
    # Split path components - all optional
    tagged_full_path = Column(String, nullable=True)
    search_preview_path = Column(String, nullable=True)
    tag_preview_path = Column(String, nullable=True)
    untagged_full_path = Column(String, nullable=True)
    date_added = Column(DateTime, nullable=False, default=datetime.utcnow)
    author_id = Column(Integer, ForeignKey('authors.id'), nullable=True)

    def __repr__(self):
        return f"<Image(id={self.id}, filename={self.filename})>"