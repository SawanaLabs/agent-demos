from langchain_core.messages import HumanMessage

from langgraph_agent.agent import (
    DEFAULT_MODEL,
    _resolve_model_name,
    plan_node,
    route_node,
    tool_node,
)


def test_langgraph_agent_defaults_to_gpt_5_mini(monkeypatch) -> None:
    monkeypatch.delenv("LANGGRAPH_AGENT_MODEL", raising=False)
    monkeypatch.setenv("AI_GATEWAY_CHAT_MODEL", "openai/gpt-4.1-mini")

    assert DEFAULT_MODEL == "openai/gpt-5-mini"
    assert _resolve_model_name() == "openai/gpt-5-mini"


def test_langgraph_agent_model_can_be_overridden(monkeypatch) -> None:
    monkeypatch.setenv("LANGGRAPH_AGENT_MODEL", "openai/gpt-5")

    assert _resolve_model_name() == "openai/gpt-5"


def test_plan_node_summarizes_latest_human_request() -> None:
    result = plan_node(
        {
            "messages": [
                HumanMessage(
                    content="Validate a Next.js frontend against a Python LangGraph agent."
                )
            ]
        }
    )

    assert "Next.js frontend" in result["plan"]
    assert result["route"] == "general"


def test_greeting_stays_general_without_frontend_contract() -> None:
    routed = route_node({"messages": [HumanMessage(content="你好")]})
    result = tool_node(
        {
            "messages": [HumanMessage(content="你好")],
            "plan": "Reply naturally.",
            "route": routed["route"],
        }
    )

    assert routed["route"] == "general"
    assert result["observations"] == []


def test_integration_request_returns_frontend_contract_observations() -> None:
    routed = route_node(
        {
            "messages": [
                HumanMessage(content="How should the frontend call LangGraph?")
            ]
        }
    )
    result = tool_node(
        {
            "messages": [
                HumanMessage(content="How should the frontend call LangGraph?")
            ],
            "plan": "Use official thread-scoped streaming.",
            "route": routed["route"],
        }
    )

    assert routed["route"] == "integration"
    assert result["observations"]
    assert "threads/{thread_id}/runs/stream" in result["observations"][0]
    assert "does not provide durable checkpoints" in result["observations"][0]
    assert "LANGGRAPH_AGENT_API_URL" in result["observations"][0]
    assert "AI_GATEWAY_API_KEY" in result["observations"][0]
    assert "LANGGRAPH_AGENT_MODEL defaults to openai/gpt-5-mini" in result[
        "observations"
    ][0]
    assert "x-api-key" in result["observations"][0]
    assert "Next.js server route" in result["observations"][0]
    assert "Do not expose them as NEXT_PUBLIC" in result["observations"][0]
