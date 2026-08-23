import os

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]

_llm = ChatOpenAI(
    model="gpt-5-nano",
    api_key=OPENAI_API_KEY,
    temperature=0.3
)

def summarize_note(title: str, content: str) -> str:
    messages = [
        SystemMessage(
            content="다음 노트 내용을 한국어로 2~5문장으로 간결하게 요약해줘. 문장마다 - 표시를 해줘. 핵심만 담고, 불필요한 서두는 빼."
        ),
        HumanMessage(content=f"제목: {title}\n\n내용:\n{content}"),
    ]

    resposne = _llm.invoke(messages)
    return resposne.content

