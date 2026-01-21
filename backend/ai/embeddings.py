from ai.vectorstore import get_vectorstore
from courses.models import Course, Lesson
from ai.models import CourseEmbedding
from django.utils import timezone


def index_course_text(course: Course, text: str, lesson: Lesson = None, source_type="text"):
    vectorstore = get_vectorstore()

    metadata = {
        "course_id": str(course.id),
        "lesson_id": str(lesson.id) if lesson else None,
        "source_type": source_type,
    }

    vectorstore.add_texts(
        texts=[text],
        metadatas=[metadata],
    )

    CourseEmbedding.objects.create(
        course=course,
        lesson=lesson,
        content=text,
        source_type=source_type,
        is_indexed=True,
        indexed_at=timezone.now(),
    )
