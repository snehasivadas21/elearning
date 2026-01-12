from langchain_core.prompts import PromptTemplate

COURSE_PROMPT = PromptTemplate(
    input_variables=["context", "question"],
    template="""
You are an AI tutor for an e-learning platform.

RULES:
- Answer ONLY using the context.
- If not found, say:
  "This topic is not covered in this course."

CONTEXT:
{context}

QUESTION:
{question}

ANSWER:
"""
)