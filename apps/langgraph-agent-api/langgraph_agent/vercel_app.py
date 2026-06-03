from __future__ import annotations

import os
import json
from collections.abc import AsyncIterator, Sequence
from typing import Any, Literal, Protocol
from uuid import UUID

from fastapi import FastAPI, Header, HTTPException
from fastapi.encoders import jsonable_encoder
from fastapi.responses import StreamingResponse
from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from pydantic import BaseModel, Field


class GraphRunner(Protocol):
    def astream(
        self,
        input_data: dict[str, Any],
        config: dict[str, Any],
        stream_mode: Sequence[str],
    ) -> AsyncIterator[Any]: ...


class ThreadCreateRequest(BaseModel):
    thread_id: UUID = Field(alias="thread_id")
    if_exists: Literal["do_nothing"] = Field(alias="if_exists")


class ThreadCreateResponse(BaseModel):
    thread_id: str


class LangGraphMessage(BaseModel):
    content: str
    role: Literal["ai", "human", "system"]


class RunInput(BaseModel):
    messages: list[LangGraphMessage] = Field(min_length=1)


class RunStreamRequest(BaseModel):
    assistant_id: str
    input: RunInput
    stream_mode: list[Literal["updates", "messages-tuple"]] = Field(
        default_factory=lambda: ["updates", "messages-tuple"]
    )


def _require_api_key(x_api_key: str | None) -> None:
    expected_api_key = os.getenv("LANGGRAPH_AGENT_API_KEY")

    if not expected_api_key:
        raise HTTPException(
            status_code=500,
            detail="LANGGRAPH_AGENT_API_KEY is required for the LangGraph agent API.",
        )

    if x_api_key != expected_api_key:
        raise HTTPException(status_code=401, detail="Invalid LangGraph agent API key.")


def _resolve_assistant_id() -> str:
    return os.getenv("LANGGRAPH_AGENT_ASSISTANT_ID") or "agent"


def _resolve_graph_runner(graph_runner: GraphRunner | None) -> GraphRunner:
    if graph_runner is not None:
        return graph_runner

    from langgraph_agent.agent import graph

    return graph


def _to_langchain_message(message: LangGraphMessage) -> BaseMessage:
    if message.role == "human":
        return HumanMessage(content=message.content)

    if message.role == "ai":
        return AIMessage(content=message.content)

    return SystemMessage(content=message.content)


def _to_graph_stream_modes(stream_modes: Sequence[str]) -> list[str]:
    graph_modes: list[str] = []

    for mode in stream_modes:
        graph_mode = "messages" if mode == "messages-tuple" else mode

        if graph_mode not in graph_modes:
            graph_modes.append(graph_mode)

    return graph_modes


def _read_stream_item(stream_item: Any) -> tuple[str, Any]:
    if (
        isinstance(stream_item, tuple)
        and len(stream_item) == 2
        and isinstance(stream_item[0], str)
    ):
        return stream_item

    raise RuntimeError("LangGraph stream item did not include a stream mode.")


def _read_message_content(message_chunk: Any) -> str:
    content = (
        message_chunk
        if isinstance(message_chunk, str)
        else getattr(message_chunk, "content", "")
    )

    if isinstance(content, str):
        return content

    if isinstance(content, list):
        text_blocks = [
            item
            for item in content
            if isinstance(item, str)
        ]

        return "".join(text_blocks)

    return str(content)


def _normalize_message_tuple(payload: Any) -> list[dict[str, Any]]:
    if not isinstance(payload, (list, tuple)) or len(payload) < 2:
        raise RuntimeError("LangGraph messages stream item was not a message tuple.")

    message_chunk, metadata = payload[:2]

    return [
        {
            "content": _read_message_content(message_chunk),
        },
        jsonable_encoder(metadata),
    ]


def _sse_frame(event: str, data: Any) -> str:
    encoded_data = json.dumps(
        jsonable_encoder(data),
        ensure_ascii=False,
        separators=(",", ":"),
    )

    return f"event: {event}\ndata: {encoded_data}\n\n"


async def _stream_thread_run(
    *,
    graph_runner: GraphRunner,
    request: RunStreamRequest,
    thread_id: UUID,
) -> AsyncIterator[str]:
    messages = [_to_langchain_message(message) for message in request.input.messages]
    graph_stream_modes = _to_graph_stream_modes(request.stream_mode)

    async for stream_item in graph_runner.astream(
        {
            "messages": messages,
        },
        config={
            "configurable": {
                "thread_id": str(thread_id),
            },
        },
        stream_mode=graph_stream_modes,
    ):
        event_type, payload = _read_stream_item(stream_item)

        if event_type == "updates":
            yield _sse_frame("updates", payload)
            continue

        if event_type == "messages":
            yield _sse_frame("messages-tuple", _normalize_message_tuple(payload))
            continue

        raise RuntimeError(f"Unsupported LangGraph stream mode: {event_type}")


def create_app(graph_runner: GraphRunner | None = None) -> FastAPI:
    app = FastAPI(title="LangGraph Agent Vercel API")
    resolved_graph_runner = _resolve_graph_runner(graph_runner)

    @app.post("/threads")
    def create_thread(
        request: ThreadCreateRequest,
        x_api_key: str | None = Header(default=None),
    ) -> ThreadCreateResponse:
        _require_api_key(x_api_key)

        return ThreadCreateResponse(thread_id=str(request.thread_id))

    @app.post("/threads/{thread_id}/runs/stream")
    def stream_thread_run(
        thread_id: UUID,
        request: RunStreamRequest,
        x_api_key: str | None = Header(default=None),
    ) -> StreamingResponse:
        _require_api_key(x_api_key)

        if request.assistant_id != _resolve_assistant_id():
            raise HTTPException(
                status_code=422,
                detail="Unsupported LangGraph assistant id.",
            )

        return StreamingResponse(
            _stream_thread_run(
                graph_runner=resolved_graph_runner,
                request=request,
                thread_id=thread_id,
            ),
            media_type="text/event-stream",
        )

    return app
