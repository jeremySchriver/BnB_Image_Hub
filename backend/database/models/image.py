from sqlalchemy import Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

class Image(Base):
    __tablename__ = 'images'

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    path = Column(String, unique=True, index=True)
    metadata = Column(String)  # You can adjust the type based on your metadata structure

    def __repr__(self):
        return f"<Image(id={self.id}, filename={self.filename}, path={self.path})>"