from sentence_transformers import SentenceTransformer
from ai.models import CourseEmbedding

model = SentenceTransformer("all-MiniLM-L6-v2")

def store_embedding(course_id, text, lesson_id=None):
    vector = model.encode(text).tolist()

    CourseEmbedding.objects.create(
        course_id=course_id,
        lesson_id=lesson_id,
        content_type="lesson",
        text=text,
        embedding=vector
    )
