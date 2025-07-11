import pandas as pd
import json
from datetime import datetime

# Let's analyze the actual CSV structure first
url = "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/data-export--khagatiOrderSplit-2025-07-11T05_42_36.243Z-15f3dcab-8be1-4360-b39a-d83bd4d64768-Eo5RsiWJVPfS94avSx5FGTKm9QZhW3.csv"

try:
    # Read the CSV file
    df = pd.read_csv(url)
    
    print("=== CSV STRUCTURE ANALYSIS ===")
    print(f"Total rows: {len(df)}")
    print(f"Total columns: {len(df.columns)}")
    
    # Find the timeStamp column
    timestamp_col = None
    for col in df.columns:
        if 'timestamp' in col.lower():
            timestamp_col = col
            break
    
    if timestamp_col:
        print(f"\nFound timestamp column: '{timestamp_col}'")
        
        # Get first non-null value
        sample_value = None
        for i in range(len(df)):
            val = df[timestamp_col].iloc[i]
            if pd.notna(val) and str(val).strip():
                sample_value = str(val)
                break
        
        if sample_value:
            print(f"Sample value: {sample_value}")
            print(f"Value type: {type(sample_value)}")
            print(f"Value length: {len(sample_value)}")
            
            # Try to parse as JSON
            try:
                parsed_json = json.loads(sample_value)
                print(f"Successfully parsed JSON: {parsed_json}")
                print(f"JSON keys: {list(parsed_json.keys())}")
                
                # Convert each timestamp
                for key, timestamp in parsed_json.items():
                    if isinstance(timestamp, (int, float)):
                        try:
                            # Try as milliseconds first
                            dt = datetime.fromtimestamp(timestamp / 1000)
                            print(f"  {key}: {timestamp} -> {dt.isoformat()} ({dt.strftime('%Y-%m-%d %H:%M:%S')})")
                        except:
                            try:
                                # Try as seconds
                                dt = datetime.fromtimestamp(timestamp)
                                print(f"  {key}: {timestamp} -> {dt.isoformat()} ({dt.strftime('%Y-%m-%d %H:%M:%S')})")
                            except:
                                print(f"  {key}: {timestamp} -> Could not convert")
                
            except json.JSONDecodeError as e:
                print(f"JSON parsing error: {e}")
                print("Raw value (first 200 chars):")
                print(repr(sample_value[:200]))
        else:
            print("No non-null values found in timestamp column")
    else:
        print("No timestamp column found")
        print("Available columns:")
        for col in df.columns:
            print(f"  - {col}")

except Exception as e:
    print(f"Error: {e}")
