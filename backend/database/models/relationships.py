from sqlalchemy import Table, Column, Integer, ForeignKey
from .base import Base

image_tags = Table(
    'image_tags',
    Base.metadata,
    Column('image_id', Integer, ForeignKey('images.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True),
    extend_existing=True
)