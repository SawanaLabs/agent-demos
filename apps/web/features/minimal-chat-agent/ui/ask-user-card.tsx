"use client";

import { Badge } from "@workspace/ui/components/badge";
import { Button } from "@workspace/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { MessageCircleQuestionIcon, SendIcon } from "lucide-react";
import { useMemo, useState } from "react";

import type { AskUserInput, AskUserOutput } from "../server/tools";
import { buildAskUserOutput } from "./ask-user-state";

interface AskUserCardProps {
  disabled?: boolean;
  input: AskUserInput;
  onSubmit: (output: AskUserOutput) => Promise<void> | void;
}

export function AskUserCard({
  disabled = false,
  input,
  onSubmit,
}: AskUserCardProps) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const output = useMemo(
    () => buildAskUserOutput(input, answers),
    [answers, input]
  );

  return (
    <Card className="border-primary/25 bg-primary/[0.03] shadow-none">
      <CardHeader className="gap-2 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 font-medium text-base">
            <MessageCircleQuestionIcon className="size-4 text-primary" />A quick
            decision from you
          </CardTitle>
          <Badge variant="outline">Human in the loop</Badge>
        </div>
        <p className="text-muted-foreground text-sm/relaxed">
          The agent paused instead of guessing. Answer every question to
          continue the same tool loop.
        </p>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();

            if (!output || isSubmitting) {
              return;
            }

            setIsSubmitting(true);
            Promise.resolve(onSubmit(output)).finally(() => {
              setIsSubmitting(false);
            });
          }}
        >
          {input.questions.map((question, index) => (
            <fieldset className="space-y-3" key={question.question}>
              <legend className="font-medium text-sm">
                <span className="mr-2 font-mono text-muted-foreground text-xs">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {question.question}
              </legend>
              <div className="grid gap-2 sm:grid-cols-3">
                {question.choices.map((choice) => {
                  const isSelected = answers[index] === choice;

                  return (
                    <Button
                      aria-pressed={isSelected}
                      className="h-auto min-h-10 justify-start whitespace-normal text-left"
                      disabled={disabled || isSubmitting}
                      key={choice}
                      onClick={() => {
                        setAnswers((current) => ({
                          ...current,
                          [index]: choice,
                        }));
                      }}
                      type="button"
                      variant={isSelected ? "secondary" : "outline"}
                    >
                      {choice}
                    </Button>
                  );
                })}
              </div>
              <Input
                aria-label={`Custom answer for: ${question.question}`}
                disabled={disabled || isSubmitting}
                onChange={(event) => {
                  setAnswers((current) => ({
                    ...current,
                    [index]: event.target.value,
                  }));
                }}
                placeholder="Or type a custom answer"
                value={
                  question.choices.includes(answers[index] ?? "")
                    ? ""
                    : (answers[index] ?? "")
                }
              />
            </fieldset>
          ))}
          <Button
            className="w-full sm:w-auto"
            disabled={disabled || isSubmitting || !output}
            type="submit"
          >
            <SendIcon className="size-4" />
            {isSubmitting ? "Continuing…" : "Continue agent run"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
