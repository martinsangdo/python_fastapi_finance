"""Database models.

A model is a Python class that maps to a table in PostgreSQL.
Reading a row from the table gives you a Product object.
"""

from sqlalchemy import Column, Integer, Numeric, String, Text

from database import Base


class Product(Base):
    """Maps to the existing "products" table."""

    __tablename__ = "products"

    # SQLAlchemy requires one column to be marked as the primary key.
    # This assumes your table has an "id" column. If it uses a different
    # primary key (for example "product_id"), change the name below.
    id = Column(Integer, primary_key=True)

    category_id = Column(Integer)
    sku = Column(String)
    name = Column(String)
    description = Column(Text)
    price = Column(Numeric(10, 2))
    stock_quantity = Column(Integer)
