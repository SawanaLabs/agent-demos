from __future__ import annotations

import os
from typing import Annotated, Any, TypedDict

from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, SystemMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages

DEFAULT_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1"
DEFAULT_MODEL = "openai/gpt-4.1-mini"


class AgentState(TypedDict, total=False):
    messages: Annotated[list[AnyMessage], add_messages]
    observations: list[str]
    plan: str
    route: str


def _stringify_content(content: Any) -> str:
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        text_blocks: list[str] = []

        for item in content:
            if isinstance(item, str):
                text_blocks.append(item)
            elif isinstance(item, dict) and isinstance(item.get("text"), str):
                text_blocks.append(item["text"])

        return "\n".join(text_blocks)

    return str(content)


def _latest_human_text(state: AgentState) -> str:
    for message in reversed(state.get("messages", [])):
        if isinstance(message, HumanMessage):
            text = _stringify_content(message.content).strip()

            if text:
                return text

    raise ValueError("LangGraph agent requires at least one human message.")


def _read_gateway_api_key() -> str:
    api_key = os.getenv("AI_GATEWAY_API_KEY") or os.getenv("VERCEL_OIDC_TOKEN")

    if not api_key:
        raise RuntimeError(
            "Missing AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN for the LangGraph agent model call."
        )

    return api_key


def _create_chat_model() -> ChatOpenAI:
    return ChatOpenAI(
        api_key=_read_gateway_api_key(),
        base_url=os.getenv("AI_GATEWAY_BASE_URL", DEFAULT_GATEWAY_BASE_URL),
        model=os.getenv("LANGGRAPH_AGENT_MODEL")
        or os.getenv("AI_GATEWAY_CHAT_MODEL", DEFAULT_MODEL),
        streaming=True,
        temperature=0.2,
    )


@tool
def inspect_frontend_contract(topic: str) -> str:
    """Return the official frontend integration contract for this demo."""

    return (
        "Use the LangGraph Agent Server thread endpoint "
        "POST /threads/{thread_id}/runs/stream with assistant_id, input.messages, "
        'and stream_mode ["updates", "messages-tuple"]. The Next.js route adapts '
        "those SSE frames into AI SDK UIMessage chunks, while Agent Server owns "
        "thread checkpoints and persistence."
    )


def route_node(state: AgentState) -> dict[str, str]:
    _latest_human_text(state)

    return {
        "route": "general",
    }


def plan_node(state: AgentState) -> dict[str, str]:
    user_text = _latest_human_text(state)

    return {
        "plan": (
            "Answer the latest user request with a concise integration plan, "
            f"grounded in the official LangGraph Agent Server contract. Request: {user_text}"
        ),
        "route": state.get("route", "general"),
    }


def tool_node(state: AgentState) -> dict[str, list[str]]:
    observation = inspect_frontend_contract.invoke(
        {
            "topic": _latest_human_text(state),
        }
    )

    return {
        "observations": [observation],
    }


def synthesize_node(state: AgentState) -> dict[str, str]:
    observations = state.get("observations", [])

    return {
        "plan": "\n".join([state.get("plan", ""), *observations]).strip(),
    }


def answer_node(state: AgentState) -> dict[str, list[AIMessage]]:
    user_text = _latest_human_text(state)
    plan = state.get("plan", "Answer the user request directly.")
    model = _create_chat_model()
    response = model.invoke(
        [
            SystemMessage(
                content=(
                    "You are a concise LangGraph integration agent. Use the plan and "
                    "observations, surface assumptions, and keep the answer useful to "
                    "engineers adapting a Python LangGraph agent to a Next.js product UI."
                )
            ),
            HumanMessage(
                content=(
                    f"User request:\n{user_text}\n\n"
                    f"Plan and observations:\n{plan}\n\n"
                    "Return the final answer."
                )
            ),
        ]
    )

    return {
        "messages": [response],
    }


builder = StateGraph(AgentState)
builder.add_node("route", route_node)
builder.add_node("plan", plan_node)
builder.add_node("tool", tool_node)
builder.add_node("synthesize", synthesize_node)
builder.add_node("answer", answer_node)
builder.add_edge(START, "route")
builder.add_edge("route", "plan")
builder.add_edge("plan", "tool")
builder.add_edge("tool", "synthesize")
builder.add_edge("synthesize", "answer")
builder.add_edge("answer", END)

graph = builder.compile()
