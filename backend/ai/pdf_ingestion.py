from ai.vectorstore import get_vectorstore
from ai.models import CourseEmbedding
from courses.models import LessonResource
from django.utils import timezone

from pypdf import PdfReader
from docx import Document
from pptx import Presentation


def extract_text(resource: LessonResource):
    file_path = resource.file.path
    name = resource.file.name.lower()
    text = ""

    if name.endswith(".pdf"):
        reader = PdfReader(file_path)
        for page in reader.pages:
            text += page.extract_text() or ""

    elif name.endswith(".docx"):
        doc = Document(file_path)
        for p in doc.paragraphs:
            text += p.text + "\n"

    elif name.endswith(".pptx"):
        prs = Presentation(file_path)
        for slide in prs.slides:
            for shape in slide.shapes:
                if hasattr(shape, "text"):
                    text += shape.text + "\n"

    return text.strip()


def index_lesson_resource(resource: LessonResource):
    text = extract_text(resource)
    if not text:
        return

    vectorstore = get_vectorstore()

    metadata = {
        "course_id": str(resource.lesson.module.course.id),
        "lesson_id": str(resource.lesson.id),
        "source_type": "pdf",
    }

    vectorstore.add_texts(
        texts=[text],
        metadatas=[metadata],
    )

    CourseEmbedding.objects.create(
        course=resource.lesson.module.course,
        lesson=resource.lesson,
        resource=resource,
        content=text,
        source_type="pdf",
        is_indexed=True,
        indexed_at=timezone.now(),
    )
