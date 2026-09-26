/**
 * Shared types for the UxPromptBar family.
 *
 * Split out so both the component file and the state hook file can import
 * them without a circular dependency.
 */

export interface UxPromptBarSource {
  id: string;
  kind: "doc" | "web" | "tool";
  title: string;
}

export interface UxPromptBarCommand {
  description: string;
  id: string;
  name: string;
}

export interface UxPromptBarModel {
  id: string;
  label: string;
}

export interface UxPromptBarSubmit {
  command: UxPromptBarCommand | null;
  model: UxPromptBarModel;
  sources: UxPromptBarSource[];
  text: string;
}
