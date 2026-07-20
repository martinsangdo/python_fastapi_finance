"""Database models.

A model is a Python class that maps to a table in PostgreSQL.
Reading a row from the table gives you a Product object.
"""

from sqlalchemy import Column, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship

from database import Base


class Category(Base):
    """Maps to the existing "categories" table."""

    __tablename__ = "categories"

    id = Column(Integer, primary_key=True)

    name = Column(Text)
    slug = Column(Text)


class Product(Base):
    """Maps to the existing "products" table."""

    __tablename__ = "products"

    # SQLAlchemy requires one column to be marked as the primary key.
    # This assumes your table has an "id" column. If it uses a different
    # primary key (for example "product_id"), change the name below.
    id = Column(Integer, primary_key=True)

    category_id = Column(Integer, ForeignKey("categories.id"))
    sku = Column(String)
    name = Column(String)
    description = Column(Text)
    price = Column(Numeric(10, 2))
    stock_quantity = Column(Integer)

    # Follows category_id to the matching row in "categories", so a template
    # can write product.category.name instead of running a second query.
    category = relationship("Category")
