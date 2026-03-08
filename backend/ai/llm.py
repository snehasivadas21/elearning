from langchain_openai import ChatOpenAI
import os


def get_llm():
    return ChatOpenAI(
        model="meta-llama/llama-3-8b-instruct",
        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
        temperature=0.2,
        max_tokens=512, 
    )