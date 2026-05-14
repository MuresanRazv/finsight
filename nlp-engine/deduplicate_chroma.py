import chromadb
import json
from collections import defaultdict

def deduplicate_chromadb():
    print("🔌 Connecting to ChromaDB...")
    # Connect to the Dockerized ChromaDB instance
    client = chromadb.HttpClient(host="chromadb", port=8000)
    
    collection_name = "financial_articles"
    try:
        collection = client.get_collection(name=collection_name)
    except Exception as e:
        print(f"❌ Could not find collection '{collection_name}'. Error: {e}")
        return

    doc_count = collection.count()
    print(f"📊 Total Documents before deduplication: {doc_count}")

    if doc_count == 0:
        print("⚠️ The database is empty!")
        return

    # 1. Fetch all IDs and their URLs
    # Note: For very large collections, you might want to process this in batches using offset/limit
    print("📥 Fetching all records...")
    all_data = collection.get(include=['metadatas'])
    
    ids = all_data['ids']
    metadatas = all_data['metadatas']

    # 2. Map URLs to their IDs
    url_to_ids = defaultdict(list)
    for i in range(len(ids)):
        url = metadatas[i].get('url')
        if url:
            url_to_ids[url].append(ids[i])
        else:
            print(f"⚠️ Warning: Record {ids[i]} has no URL in metadata.")

    # 3. Identify duplicates
    ids_to_delete = []
    unique_urls = 0
    
    for url, doc_ids in url_to_ids.items():
        unique_urls += 1
        if len(doc_ids) > 1:
            # Keep the first ID, mark others for deletion
            # You could also sort by 'published_at' if available in metadata to keep the latest
            ids_to_delete.extend(doc_ids[1:])

    print(f"✨ Found {unique_urls} unique URLs.")
    print(f"🗑️ Identified {len(ids_to_delete)} duplicate records to remove.")

    # 4. Delete duplicates in batches
    if ids_to_delete:
        batch_size = 100
        for i in range(0, len(ids_to_delete), batch_size):
            batch = ids_to_delete[i:i + batch_size]
            collection.delete(ids=batch)
            print(f"✅ Deleted batch {i // batch_size + 1}/{(len(ids_to_delete) - 1) // batch_size + 1}")

    final_count = collection.count()
    print(f"\n📊 Total Documents after deduplication: {final_count}")
    print(f"🎉 Cleanup complete!")

if __name__ == "__main__":
    deduplicate_chromadb()
