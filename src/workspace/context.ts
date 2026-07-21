import { createContext, useContext } from "react";
import type { LearningWorkspaceValue } from "./contracts";

export const LearningWorkspaceContext =
  createContext<LearningWorkspaceValue | null>(null);

export function useLearningWorkspace() {
  const value = useContext(LearningWorkspaceContext);
  if (!value) {
    throw new Error(
      "useLearningWorkspace must be used inside LearningWorkspaceProvider",
    );
  }
  return value;
}
