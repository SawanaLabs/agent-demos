from __future__ import annotations

import os
from typing import Annotated, Any, TypedDict

from langchain_core.messages import AIMessage, AnyMessage, HumanMessage, SystemMessage
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import END, START, StateGraph
from langgraph.graph.message import add_messages

DEFAULT_GATEWAY_BASE_URL = "https://ai-gateway.vercel.sh/v1"
DEFAULT_MODEL = "openai/gpt-5-mini"
INTEGRATION_REQUEST_MARKERS = (
    "api",
    "backend",
    "checkpoint",
    "frontend",
    "langchain",
    "langgraph",
    "next",
    "next.js",
    "stream",
    "thread",
    "部署",
    "后端",
    "接口",
    "集成",
    "流式",
    "前端",
    "适配",
    "线程",
    "持久化",
)


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


def _is_integration_request(text: str) -> bool:
    normalized_text = text.lower()

    return any(marker in normalized_text for marker in INTEGRATION_REQUEST_MARKERS)


def _resolve_model_name() -> str:
    return os.getenv("LANGGRAPH_AGENT_MODEL") or DEFAULT_MODEL


def _create_chat_model() -> ChatOpenAI:
    return ChatOpenAI(
        api_key=_read_gateway_api_key(),
        base_url=os.getenv("AI_GATEWAY_BASE_URL", DEFAULT_GATEWAY_BASE_URL),
        model=_resolve_model_name(),
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
        "those SSE frames into AI SDK UIMessage chunks. Full Agent Server or "
        "LangSmith deployments own thread checkpoints and persistence. The "
        "lightweight Vercel FastAPI wrapper confirms thread ids, streams graph "
        "events, and does not provide durable checkpoints; ordinary chat "
        "continuity comes from the messages sent with each run request. Use "
        "Python 3.12 for the Vercel-compatible API project. Backend env keys "
        "are AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN, optional "
        "AI_GATEWAY_BASE_URL, and optional LANGGRAPH_AGENT_API_KEY; "
        "LANGGRAPH_AGENT_MODEL defaults to openai/gpt-5-mini. The Next.js "
        "server route reads LANGGRAPH_AGENT_API_URL, "
        "LANGGRAPH_AGENT_ASSISTANT_ID, and the same optional "
        "LANGGRAPH_AGENT_API_KEY, then sends that service key as x-api-key to "
        "the Python backend. Do not expose them as NEXT_PUBLIC variables. Do "
        "not send the AI_GATEWAY_API_KEY from the frontend; it stays "
        "server-side in the Python backend. The local FastAPI wrapper runs on "
        "port 2024 with uv run uvicorn app:app --host 127.0.0.1 --port 2024."
    )


def route_node(state: AgentState) -> dict[str, str]:
    user_text = _latest_human_text(state)

    return {
        "route": "integration" if _is_integration_request(user_text) else "general",
    }


def plan_node(state: AgentState) -> dict[str, str]:
    user_text = _latest_human_text(state)
    route = state.get("route", "general")

    if route == "integration":
        plan = (
            "Answer the latest user request with concise LangGraph integration "
            "guidance, grounded in the official LangGraph Agent Server contract. "
            f"Request: {user_text}"
        )
    else:
        plan = (
            "Answer the latest user request naturally and directly. Do not force "
            "LangGraph integration advice unless the user asks for it. "
            f"Request: {user_text}"
        )

    return {
        "plan": plan,
        "route": route,
    }


def tool_node(state: AgentState) -> dict[str, list[str]]:
    if state.get("route", "general") != "integration":
        return {
            "observations": [],
        }

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
                    "You are a helpful general assistant running inside a LangGraph "
                    "demo. Answer the user's actual request directly. For greetings "
                    "or small talk, keep the response brief and natural. Use "
                    "LangGraph integration details only when the user asks for them. "
                    "When integration observations are provided, ground the answer "
                    "in them."
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
