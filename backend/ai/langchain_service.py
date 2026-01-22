from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from ai.llm import get_llm
from ai.vectorstore import get_vectorstore
from ai.prompts import COURSE_PROMPT
import logging

logger = logging.getLogger(__name__)

def get_course_chain(course_id):
    vectorstore = get_vectorstore()

    retriever = vectorstore.as_retriever(
        search_kwargs={
            "k": 4,  
            "filter": {
                "course_id": str(course_id)
            }
        }
    )

    def log_context(inputs):
        docs = retriever.invoke(inputs)
        logger.info(f"🔎 Retrieved {len(docs)} chunks for course {course_id}")
        if docs:
            logger.info(f"📄 Sample chunk: {docs[0].page_content[:200]}")
        return docs

    chain = (
        {
            "context": log_context,
            "question": RunnablePassthrough(),
        }
        | COURSE_PROMPT
        | get_llm()
        | StrOutputParser()
    )

    return chain
