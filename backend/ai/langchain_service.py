from langchain_core.runnables import RunnablePassthrough, RunnableLambda
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
            "k": 3,  
            "filter": {"course_id": str(course_id)}
        }
    )

    def retrieve_context(inputs):
        question = inputs["question"]
        docs = retriever.invoke(question)
        logger.info(f"🔎 Retrieved {len(docs)} chunks for course {course_id}")
        if docs:
            logger.info(f"📄 Sample chunk: {docs[0].page_content[:200]}")
        return "\n\n".join(doc.page_content for doc in docs)

    chain = (
        {
            "context": RunnableLambda(retrieve_context),
            "question": lambda x: x["question"],
            "history": lambda x: x.get("history", ""),
        }
        | COURSE_PROMPT
        | get_llm()
        | StrOutputParser()
    )

    return chain
