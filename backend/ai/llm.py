from langchain_community.llms import Ollama
from django.conf import settings


def get_llm():
    return Ollama(
        model=settings.OLLAMA_MODEL,
        base_url=settings.OLLAMA_BASE_URL,
        temperature=0.2,
        timeout=120,
    )
