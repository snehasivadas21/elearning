# from ai.langchain_service import get_course_chain
# from ai.models import ChatSession, ChatMessage


# def ask_course_ai(user, course, question):
#     session, _ = ChatSession.objects.get_or_create(
#         user=user,
#         course=course,
#         is_active=True,
#     )

#     ChatMessage.objects.create(
#         session=session,
#         role="user",
#         content=question,
#     )

#     chain = get_course_chain(course.id)
#     answer = chain.invoke(question)

#     ChatMessage.objects.create(
#         session=session,
#         role="ai",
#         content=answer,
#     )

#     return answer
