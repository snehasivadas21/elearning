# from langchain_core.runnables import RunnablePassthrough
# from langchain_core.output_parsers import StrOutputParser
# from ai.llm import get_llm
# from ai.vectorstore import get_vectorstore
# from ai.prompts import COURSE_PROMPT


# def get_course_chain(course_id):
#     vectorstore = get_vectorstore()

#     retriever = vectorstore.as_retriever(
#         search_kwargs={
#             "k": 4,
#             "filter": {"course_id": str(course_id)},
#         }
#     )

#     chain = (
#         {"context": retriever, "question": RunnablePassthrough()}
#         | COURSE_PROMPT
#         | get_llm()
#         | StrOutputParser()
#     )

#     return chain
