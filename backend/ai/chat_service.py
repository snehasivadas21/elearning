from ai.langchain_service import get_course_chain
from ai.models import ChatSession, ChatMessage


def ask_course_ai(user, course, question):
    session, _ = ChatSession.objects.get_or_create(
        user=user,
        course=course,
        defaults={"is_active":True}
    )

    ChatMessage.objects.create(
        session=session,
        role="user",
        content=question,
    )

    history = ChatMessage.objects.filter(
        session=session
    ).order_by("created_at").values_list("role","content")

    history_text = "\n".join(
        f"{'User' if role == 'user' else 'AI'}: {content}"
        for role, content in history
    )

    chain = get_course_chain(course.id)
    answer = chain.invoke({
        "question":question,
        "history":history_text,
    })

    ChatMessage.objects.create(
        session=session,
        role="ai",
        content=answer,
    )

    return answer
