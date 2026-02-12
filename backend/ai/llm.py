from langchain_openai import ChatOpenAI
from django.conf import settings

def get_llm():
    return ChatOpenAI(
        model="gpt-3.5-turbo",
        temperature=0.2,
        api_key=settings.OPENAI_API_KEY,
        max_tokens=1024,
    )