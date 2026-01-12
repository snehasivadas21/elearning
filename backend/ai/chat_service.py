from ai.langchain_service import get_course_chain

def ask_course_ai(course_id, question):
    chain = get_course_chain(course_id)
    result = chain.run(question)
    return result
