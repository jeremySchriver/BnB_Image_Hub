from sqlalchemy import Column, Integer, String, DateTime
from .base import Base
from datetime import datetime

class Author(Base):
    __tablename__ = 'authors'
   
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    date_added = Column(DateTime, nullable=False, default=datetime.utcnow)

    def __repr__(self):
        return f"<Author(id={self.id}, name={self.name})>"