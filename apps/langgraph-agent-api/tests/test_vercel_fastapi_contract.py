from uuid import uuid4

from langchain_core.messages import AIMessageChunk
from fastapi.testclient import TestClient

from langgraph_agent.vercel_app import create_app


class EchoGraph:
    async def astream(self, input_data, config=None, stream_mode=None):
        thread_id = (config or {}).get("configurable", {}).get("thread_id")
        latest_message = input_data["messages"][-1]

        yield (
            "updates",
            {
                "route": {
                    "route": "general",
                }
            },
        )
        yield (
            "messages",
            (
                AIMessageChunk(content=f"Echo: {latest_message.content}"),
                {
                    "langgraph_node": "answer",
                    "run_id": thread_id,
                },
            ),
        )


def test_thread_endpoint_fails_closed_when_api_key_env_is_missing(
    monkeypatch,
) -> None:
    monkeypatch.delenv("LANGGRAPH_AGENT_API_KEY", raising=False)
    client = TestClient(create_app(graph_runner=EchoGraph()))
    thread_id = str(uuid4())

    response = client.post(
        "/threads",
        json={
            "if_exists": "do_nothing",
            "thread_id": thread_id,
        },
    )

    assert response.status_code == 500
    assert response.json() == {
        "detail": "LANGGRAPH_AGENT_API_KEY is required for the LangGraph agent API.",
    }


def test_thread_endpoint_confirms_uuid_thread_with_required_api_key(
    monkeypatch,
) -> None:
    monkeypatch.setenv("LANGGRAPH_AGENT_API_KEY", "service-key")
    client = TestClient(create_app(graph_runner=EchoGraph()))
    thread_id = str(uuid4())

    unauthorized = client.post(
        "/threads",
        json={
            "if_exists": "do_nothing",
            "thread_id": thread_id,
        },
    )
    response = client.post(
        "/threads",
        headers={"x-api-key": "service-key"},
        json={
            "if_exists": "do_nothing",
            "thread_id": thread_id,
        },
    )

    assert unauthorized.status_code == 401
    assert response.status_code == 200
    assert response.json()["thread_id"] == thread_id


def test_thread_run_streams_agent_server_like_sse_events(monkeypatch) -> None:
    monkeypatch.setenv("LANGGRAPH_AGENT_API_KEY", "service-key")
    client = TestClient(create_app(graph_runner=EchoGraph()))
    thread_id = str(uuid4())

    with client.stream(
        "POST",
        f"/threads/{thread_id}/runs/stream",
        headers={"x-api-key": "service-key"},
        json={
            "assistant_id": "agent",
            "input": {
                "messages": [
                    {
                        "content": "hello",
                        "role": "human",
                    }
                ]
            },
            "stream_mode": ["updates", "messages-tuple"],
        },
    ) as response:
        body = response.read().decode()

    assert response.status_code == 200
    assert "event: updates" in body
    assert '"route":"general"' in body
    assert "event: messages-tuple" in body
    assert '"content":"Echo: hello"' in body
    assert f'"run_id":"{thread_id}"' in body
