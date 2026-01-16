# from langchain_community.vectorstores.pgvector import PGVector
# from langchain_huggingface import HuggingFaceEmbeddings
# from django.conf import settings

# _embeddings = HuggingFaceEmbeddings(
#     model_name="sentence-transformers/all-MiniLM-L6-v2"
# )

# def get_vectorstore():
#     db = settings.DATABASES["default"]

#     connection_string = (
#         f"postgresql+psycopg2://{db['USER']}:{db['PASSWORD']}"
#         f"@{db['HOST']}:{db['PORT']}/{db['NAME']}"
#     )

#     return PGVector(
#         connection_string=connection_string,
#         collection_name="course_embeddings",
#         embedding_function=_embeddings,
#     )
