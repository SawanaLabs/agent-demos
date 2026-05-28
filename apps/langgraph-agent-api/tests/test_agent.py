from langchain_core.messages import HumanMessage

from langgraph_agent.agent import plan_node, tool_node


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


def test_tool_node_returns_frontend_contract_observations() -> None:
    result = tool_node(
        {
            "messages": [
                HumanMessage(content="How should the frontend call LangGraph?")
            ],
            "plan": "Use official thread-scoped streaming.",
            "route": "general",
        }
    )

    assert result["observations"]
    assert "threads/{thread_id}/runs/stream" in result["observations"][0]
