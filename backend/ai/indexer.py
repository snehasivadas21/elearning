from langchain_community.document_loaders import PyPDFLoader
from ai.vectorstore import get_vectorstore
from courses.models import LessonResource


def index_course_pdfs(course_id):
    vectorstore = get_vectorstore()

    resources = LessonResource.objects.filter(
        lesson__module__course_id=course_id,
        file__isnull=False
    )

    all_docs = []

    for res in resources:
        print("📄 Indexing:", res.file.path)

        loader = PyPDFLoader(res.file.path)
        docs = loader.load()

        for d in docs:
            d.metadata["course_id"] = str(course_id)
            d.metadata["lesson_id"] = str(res.lesson_id)

        all_docs.extend(docs)

    if all_docs:
        vectorstore.add_documents(all_docs)
        print(f"✅ Indexed {len(all_docs)} PDF pages for course {course_id}")
    else:
        print("❌ No PDFs found to index")
