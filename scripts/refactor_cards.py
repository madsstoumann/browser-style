import json
import os
import glob
import copy

# Paths
BASE_DIR = "ui/cms/models"
CARDS_DIR = os.path.join(BASE_DIR, "cards")
CONTENT_CARD_PATH = os.path.join(BASE_DIR, "content_card.schema.json")

def load_json(path):
    with open(path, 'r') as f:
        return json.load(f)

def save_json(path, data):
    with open(path, 'w') as f:
        json.dump(data, f, indent=2)

def main():
    # Load the template
    if not os.path.exists(CONTENT_CARD_PATH):
        print(f"Error: {CONTENT_CARD_PATH} not found.")
        return

    content_card_schema = load_json(CONTENT_CARD_PATH)
    
    # Common keys that stay at the root
    common_keys = set(content_card_schema.get("properties", {}).keys())
    # Note: 'data' is in common_keys
    
    # Find all card schemas
    card_files = glob.glob(os.path.join(CARDS_DIR, "card-*.schema.json"))
    
    for card_file_path in card_files:
        print(f"Processing {card_file_path}...")
        
        current_schema = load_json(card_file_path)
        
        # specific properties to move to 'data'
        specific_props = {}
        moved_required = []
        
        current_props = current_schema.get("properties", {})
        current_required = current_schema.get("required", [])
        
        for key, value in current_props.items():
            if key in common_keys:
                # This field is already in the common structure (e.g. headline, summary)
                # We skip adding it to 'data', assuming the top-level definition in content_card is sufficient
                pass
            else:
                # This is a specific field
                specific_props[key] = value
                if key in current_required:
                    moved_required.append(key)
        
        # Create new schema from template
        new_schema = copy.deepcopy(content_card_schema)
        
        # Update Metadata
        # ID: remove 'card-' prefix
        old_id = current_schema.get("id", "")
        new_id = old_id.replace("card-", "")
        new_schema["id"] = new_id
        
        # Title and Description
        if "title" in current_schema:
            new_schema["title"] = current_schema["title"]
        if "description" in current_schema:
            new_schema["description"] = current_schema["description"]
            
        # Keep other metadata if present
        if "metadata" in current_schema:
             # Merge or replace? Let's replace, but ensure displayField is valid
             new_schema["metadata"] = current_schema["metadata"]
             
        if "structure" in current_schema:
            new_schema["structure"] = current_schema["structure"]

        # Populate 'data' properties
        if "data" in new_schema["properties"]:
            if "properties" not in new_schema["properties"]["data"]:
                new_schema["properties"]["data"]["properties"] = {}
            
            new_schema["properties"]["data"]["properties"].update(specific_props)
            
            # Handle required fields inside 'data'
            if moved_required:
                if "required" not in new_schema["properties"]["data"]:
                    new_schema["properties"]["data"]["required"] = []
                # Add unique
                for req in moved_required:
                    if req not in new_schema["properties"]["data"]["required"]:
                        new_schema["properties"]["data"]["required"].append(req)

        # Determine new filename
        filename = os.path.basename(card_file_path)
        new_filename = filename.replace("card-", "")
        new_file_path = os.path.join(CARDS_DIR, new_filename)
        
        # Write new file
        save_json(new_file_path, new_schema)
        print(f"Created {new_file_path}")
        
        # Delete old file
        os.remove(card_file_path)
        print(f"Removed {card_file_path}")

if __name__ == "__main__":
    main()
