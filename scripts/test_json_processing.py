import json
from datetime import datetime

# Test the JSON timestamp processing logic
test_json = '{"confirm":1752210112744,"out_for_delivery":1752211377540,"ready_for_pickup":1752210720556}'

print("Original JSON:")
print(test_json)

try:
    parsed = json.loads(test_json)
    print("\nParsed JSON:")
    print(parsed)
    
    # Process each timestamp
    processed = {}
    for key, value in parsed.items():
        if isinstance(value, (int, float)) and value > 1000000000:
            # Convert timestamp
            dt = datetime.fromtimestamp(value / 1000)  # Assuming milliseconds
            processed[key] = {
                "original": value,
                "converted": dt.isoformat(),
                "readable": dt.strftime("%Y-%m-%d %H:%M:%S")
            }
        else:
            processed[key] = value
    
    print("\nProcessed JSON:")
    print(json.dumps(processed, indent=2))
    
except Exception as e:
    print(f"Error: {e}")

# Test tracking history format
tracking_json = '[{"Primary":[{"timestamp":1752210720806,"description":"Primary Logistic started","trackStatus":"PENDING"}]}]'

print("\n" + "="*50)
print("Testing tracking history JSON:")
print(tracking_json)

try:
    parsed_tracking = json.loads(tracking_json)
    print("\nParsed tracking JSON:")
    print(parsed_tracking)
    
    def process_nested(obj):
        if isinstance(obj, dict):
            result = {}
            for k, v in obj.items():
                if k == "timestamp" and isinstance(v, (int, float)) and v > 1000000000:
                    dt = datetime.fromtimestamp(v / 1000)
                    result[k] = {
                        "original": v,
                        "converted": dt.isoformat(),
                        "readable": dt.strftime("%Y-%m-%d %H:%M:%S")
                    }
                else:
                    result[k] = process_nested(v)
            return result
        elif isinstance(obj, list):
            return [process_nested(item) for item in obj]
        else:
            return obj
    
    processed_tracking = process_nested(parsed_tracking)
    print("\nProcessed tracking JSON:")
    print(json.dumps(processed_tracking, indent=2))
    
except Exception as e:
    print(f"Error processing tracking: {e}")
