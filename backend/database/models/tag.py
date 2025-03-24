from sqlalchemy import Column, Integer, String, DateTime
from .base import Base
from datetime import datetime

class Tag(Base):
    __tablename__ = 'tags'
   
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    date_added = Column(DateTime, nullable=False, default=datetime.utcnow)

    def __repr__(self):
        return f"<Tag(id={self.id}, name={self.name})>"