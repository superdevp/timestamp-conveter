import pandas as pd
import json
from datetime import datetime

# Fetch and analyze the CSV file
url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/data-export--khagatiOrderSplit-2025-07-11T05_42_36.243Z-15f3dcab-8be1-4360-b39a-d83bd4d64768-Eo5RsiWJVPfS94avSx5FGTKm9QZhW3.csv"

try:
    # Read the CSV file
    df = pd.read_csv(url)
    
    print("CSV Analysis:")
    print(f"Total rows: {len(df)}")
    print(f"Total columns: {len(df.columns)}")
    print("\nColumns:")
    for col in df.columns:
        print(f"- {col}")
    
    # Identify timestamp columns
    timestamp_columns = []
    
    # Check for numeric columns that could be timestamps
    for col in df.columns:
        if col in ['createdAt', 'updatedAt']:
            timestamp_columns.append(col)
            sample_value = df[col].iloc[0] if not df[col].empty else None
            print(f"\nTimestamp column '{col}': {sample_value}")
            if sample_value:
                # Convert timestamp to readable format
                try:
                    dt = datetime.fromtimestamp(sample_value / 1000)  # Assuming milliseconds
                    print(f"Converted: {dt}")
                except:
                    try:
                        dt = datetime.fromtimestamp(sample_value)  # Try seconds
                        print(f"Converted: {dt}")
                    except:
                        print("Could not convert timestamp")
    
    # Check for JSON columns that might contain timestamps
    json_columns = ['timeStamp', 'trackingHistory']
    for col in json_columns:
        if col in df.columns:
            sample_value = df[col].iloc[0] if not df[col].empty else None
            print(f"\nJSON column '{col}': {sample_value}")
            
    print(f"\nIdentified timestamp columns: {timestamp_columns}")
    
except Exception as e:
    print(f"Error analyzing CSV: {e}")
