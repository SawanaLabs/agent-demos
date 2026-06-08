"use client";

import { useEffect, useState } from "react";

import {
  loadUltraChatbotAgentVotes,
  saveUltraChatbotAgentVote,
} from "./ultra-chatbot-agent-workspace-api";

export function useUltraChatbotAgentVotes(input: {
  chatId: string;
  messagesLength: number;
}) {
  const { chatId, messagesLength } = input;
  const [pendingVote, setPendingVote] = useState<{
    messageId: string;
    target: "down" | "up";
  } | null>(null);
  const [votesByMessageId, setVotesByMessageId] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (messagesLength < 2) {
      setVotesByMessageId({});
      return;
    }

    let isCancelled = false;

    loadUltraChatbotAgentVotes(chatId)
      .then((votes) => {
        if (isCancelled) {
          return;
        }

        setVotesByMessageId(
          Object.fromEntries(
            votes.map((vote) => [vote.messageId, vote.isUpvoted])
          )
        );
      })
      .catch((loadVotesError) => {
        if (isCancelled) {
          return;
        }

        console.error(
          "Failed to load ultra-chatbot-agent votes.",
          loadVotesError
        );
      });

    return () => {
      isCancelled = true;
    };
  }, [chatId, messagesLength]);

  async function handleVote(messageId: string, type: "down" | "up") {
    const currentVote = votesByMessageId[messageId];
    const nextType =
      (type === "up" && currentVote === true) ||
      (type === "down" && currentVote === false)
        ? "clear"
        : type;

    setPendingVote({
      messageId,
      target: type,
    });

    try {
      await saveUltraChatbotAgentVote({
        chatId,
        messageId,
        type: nextType,
      });
      setVotesByMessageId((current) => {
        if (nextType === "clear") {
          const { [messageId]: _removed, ...rest } = current;
          return rest;
        }

        return {
          ...current,
          [messageId]: nextType === "up",
        };
      });
    } catch (voteError) {
      console.error("Failed to save ultra-chatbot-agent vote.", voteError);
    } finally {
      setPendingVote(null);
    }
  }

  return {
    handleVote,
    pendingVote,
    votesByMessageId,
  };
}
