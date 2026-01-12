from langchain_community.llms import Ollama

def get_llm():
    return Ollama(
        model="llama3.1:8b",
        base_url="http://host.docker.internal:11434",
        temperature=0
    )
