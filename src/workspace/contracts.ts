import type {
  LanguageCode,
  LearningGoal,
  LearningRoom,
  Level,
  WorkspaceProfile,
  WorkspaceRole,
} from "../domain/types";

export type WorkspaceRoute =
  | "setup"
  | "explore"
  | "saved"
  | "teacher"
  | "teacher-room"
  | "join"
  | "student-room";

export interface CreateRoomInput {
  name: string;
  topicId: string;
  targetLanguage: LanguageCode;
  supportLanguage: LanguageCode;
  level: Level;
}

export interface LearningWorkspaceValue {
  profile: WorkspaceProfile | null;
  route: WorkspaceRoute;
  savedIds: string[];
  activeRoom: LearningRoom | null;
  canControlActiveRoom: boolean;
  completeSetup(profile: WorkspaceProfile): void;
  updateGoal(goal: Partial<LearningGoal>): void;
  switchRole(role: WorkspaceRole): void;
  navigate(route: WorkspaceRoute): void;
  toggleSaved(topicId: string): void;
  createRoom(input: CreateRoomInput): Promise<LearningRoom>;
  joinRoom(
    code: string,
    studentName: string,
  ): Promise<{ room?: LearningRoom; error?: string }>;
  refreshRoom(snapshot?: LearningRoom): Promise<LearningRoom | null>;
  updateRoomQuestion(index: number): Promise<void>;
  leaveRoom(endForEveryone?: boolean): Promise<void>;
  resetWorkspace(): void;
}

export const workspaceDefaults: { goal: LearningGoal } = {
  goal: {
    interfaceLocale: "EN",
    nativeLanguage: "PL",
    targetLanguage: "EN",
    level: "B1",
  },
};
