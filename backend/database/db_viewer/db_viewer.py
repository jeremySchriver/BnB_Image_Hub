from sqlalchemy.orm import Session
import sys
from pathlib import Path
from typing import Any
from tabulate import tabulate

# Get the project root directory
project_root = Path(__file__).parent.parent.parent.parent
sys.path.append(str(project_root))

from backend.database.database import get_db
from backend.database.models.image import Image
from backend.database.models.user import User
from backend.database.services.image_service import _convert_string_to_tags

def print_table_data(db: Session, model: Any, convert_functions=None):
    """
    Print all records from a table in a formatted way
    """
    records = db.query(model).all()
    if not records:
        print(f"No records found in {model.__tablename__}")
        return

    # Get all columns from the model
    columns = [column.key for column in model.__table__.columns]
    
    # Convert records to list of dicts
    rows = []
    for record in records:
        row = {}
        for col in columns:
            value = getattr(record, col)
            # Apply conversion function if provided
            if convert_functions and col in convert_functions:
                value = convert_functions[col](value)
            row[col] = value
        rows.append(row)

    # Print using tabulate for nice formatting
    print(f"\n{model.__tablename__.upper()} TABLE:")
    print(tabulate(rows, headers="keys", tablefmt="grid"))

def main():
    db = next(get_db())
    
    # Print Images table with tags conversion
    print_table_data(db, Image, {'tags': _convert_string_to_tags})
    
    # Print Users table
    print_table_data(db, User)

if __name__ == "__main__":
    main()