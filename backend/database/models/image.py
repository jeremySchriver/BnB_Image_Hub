from sqlalchemy import Column, Integer, String, DateTime, ARRAY
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

Base = declarative_base()

class Image(Base):
    __tablename__ = 'images'

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    
    # Split path components - all optional
    tagged_full_path = Column(String, nullable=True)
    tagged_thumb_path = Column(String, nullable=True)
    untagged_full_path = Column(String, nullable=True)
    untagged_thumb_path = Column(String, nullable=True)
    
    # Metadata fields
    tags = Column(ARRAY(String), nullable=True, default=[])
    date_added = Column(DateTime, nullable=False, default=datetime.utcnow)
    author = Column(String, nullable=True)

    def __repr__(self):
        return f"<Image(id={self.id}, filename={self.filename}, path={self.path})>"