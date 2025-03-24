from sqlalchemy.orm import relationship
from .image import Image 
from .author import Author
from .tag import Tag
from .relationships import image_tags

# Set up relationships after all models are defined
Image.author = relationship("Author", back_populates="images")
Image.tags = relationship("Tag", secondary=image_tags, back_populates="images")
Author.images = relationship("Image", back_populates="author")
Tag.images = relationship("Image", secondary=image_tags, back_populates="tags")