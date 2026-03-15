import chromadb
import json


def test_chromadb():
    print("🔌 Connecting to ChromaDB...")

    # Connect to the Dockerized ChromaDB instance
    client = chromadb.HttpClient(host="chromadb", port=8000)

    # If you are using a local folder instead of Docker, comment the line above and uncomment this:
    # client = chromadb.PersistentClient(path="./chroma_db")

    # 1. List all collections
    collections = client.list_collections()
    print(f"\n📂 Available Collections: {[c.name for c in collections]}")

    # Assuming your collection is named 'financial_articles' (change if different)
    collection_name = "financial_articles"

    try:
        collection = client.get_collection(name=collection_name)
    except Exception as e:
        print(f"❌ Could not find collection '{collection_name}'. Error: {e}")
        return

    # 2. Count the documents
    doc_count = collection.count()
    print(f"\n📊 Total Documents in '{collection_name}': {doc_count}")

    if doc_count == 0:
        print("⚠️ The database is empty! Your scraper/embedder hasn't saved anything yet.")
        return

    # 3. Peek at the first 2 raw records (The Matrix)
    print("\n👀 Peeking at the first 2 records in the database:")
    peek_data = collection.peek(2)

    for i in range(len(peek_data['ids'])):
        print(f"\n--- Record {i + 1} ---")
        print(f"ID: {peek_data['ids'][i]}")
        print(f"Metadata: {json.dumps(peek_data['metadatas'][i], indent=2)}")
        print(f"Document Text Snippet: {peek_data['documents'][i][:150]}...")
        print(f"Vector Dimensions: {len(peek_data['embeddings'][i])}")

    # 4. Run a live Semantic Search Test
    print("\n🔍 Running a manual Semantic Search test...")
    test_query = "supply chain or semiconductor shortages"
    print(f"Querying for: '{test_query}'")

    results = collection.query(
        query_texts=[test_query],
        n_results=2  # Bring back the top 2 closest matches
    )

    print("\n✅ Search Results:")
    for i in range(len(results['ids'][0])):
        print(f"\nMatch {i + 1} (Distance: {results['distances'][0][i]}):")
        print(f"URL: {results['metadatas'][0][i].get('url', 'No URL found')}")
        print(f"Text: {results['documents'][0][i][:200]}...")


if __name__ == "__main__":
    test_chromadb()