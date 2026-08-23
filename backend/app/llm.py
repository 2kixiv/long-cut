import os

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from pydantic import BaseModel

OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]

class SuggestedNode(BaseModel):
    title: str
    description: str

class SuggestedRoadmap(BaseModel):
    suggested_nodes: list[SuggestedNode]

_llm = ChatOpenAI(
    model="gpt-5-nano",
    api_key=OPENAI_API_KEY,
    temperature=0.3
)
_structured_llm = _llm.with_structured_output(SuggestedRoadmap)

def summarize_note(title: str, content: str) -> str:
    messages = [
        SystemMessage(
            content="다음 노트 내용을 한국어로 2~5문장으로 간결하게 요약해줘. 문장마다 - 표시를 해줘. 핵심만 담고, 불필요한 서두는 빼."
        ),
        HumanMessage(content=f"제목: {title}\n\n내용:\n{content}"),
    ]

    resposne = _llm.invoke(messages)
    return resposne.content

def suggest_roadmap(
    title: str,
    description: str | None,
    existing_titles: list[str]
):
    existing = "\n".join(f"- {t}" for t in existing_titles) or "(아직 없음)"

    messages = [
        SystemMessage(
            content=(
                "로드맵의 다음 단계들을 한국어로 제안해줘."
                "이미 있는 단계와 겹치지 않게, 논리적인 순서로 나열해줘."
                "각 단계는 짧은 제목(title)과 1문장 설명(description)으로 줘."
            )
        ),
        HumanMessage(
            content=f"로드맵 제목: {title}\n설명: {description or '(없음)'}\n\n이미 있는 단계들: \n{existing}"
        ),
    ]

    response = _structured_llm.invoke(messages)
    return response.suggested_nodes
