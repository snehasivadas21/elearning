from langchain_community.vectorstores.pgvector import PGVector
from langchain_community.embeddings import HuggingFaceEmbeddings
from django.conf import settings

def get_vectorstore():
    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    return PGVector(
        connection_string=settings.DATABASE_URL,
        collection_name="course_embeddings",
        embedding_function=embeddings,
    )
