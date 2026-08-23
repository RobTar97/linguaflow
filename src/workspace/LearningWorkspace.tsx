import { useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  LearningRoom,
  WorkspaceProfile,
} from "../domain/types";
import { buildLearningRoom, normalizeRoomSnapshot } from "../domain/room";
import {
  createLearnerLibraryRepository,
  mergeLearnerLibrary,
  toggleSavedTopic,
  toggleVocabularyBookmark,
  writeTopicNote,
} from "../learnerData/library";
import { browserStorage } from "../platform/storage";
import { RoomServiceError, roomService } from "../platform/roomService";
import { secureRandomInt } from "../platform/secureRandom";
import { readShareIntent } from "../platform/shareLinks";
import { useTopicLibrary } from "../packs/libraryContext";
import { LearningWorkspaceContext } from "./context";
import {
  workspaceDefaults,
  type LearningWorkspaceValue,
  type ExtendedWorkspaceRoute,
  type WorkspaceRoute,
} from "./contracts";

const PROFILE_KEY = "linguaflow-profile-v2";
const ACTIVE_ROOM_KEY = "linguaflow-active-room";
const learnerLibraryRepository = createLearnerLibraryRepository(browserStorage);

function createRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const letters = Array.from(
    { length: 3 },
    () => alphabet[secureRandomInt(alphabet.length)],
  ).join("");
  const digits = 100 + secureRandomInt(900);
  return `${letters}-${digits}`;
}

function initialProfile() {
  return browserStorage.get<WorkspaceProfile | null>(PROFILE_KEY, null);
}

function initialActiveRoom() {
  return normalizeRoomSnapshot(browserStorage.get<unknown>(ACTIVE_ROOM_KEY, null));
}

function initialRoute(
  profile: WorkspaceProfile | null,
  activeRoom: LearningRoom | null = null,
): WorkspaceRoute {
  if (!profile?.setupComplete) return "setup";
  if (readShareIntent()?.kind === "join" && !activeRoom) return "join";
  if (profile.role === "teacher") {
    return activeRoom && roomService.canControl(activeRoom.code)
      ? "teacher-room"
      : "teacher";
  }
  if (profile.role === "student") return activeRoom ? "student-room" : "join";
  return "explore";
}

export function LearningWorkspaceProvider({ children }: { children: ReactNode }) {
  const { catalog } = useTopicLibrary();
  const [profile, setProfile] = useState<WorkspaceProfile | null>(initialProfile);
  const [route, setRoute] = useState<ExtendedWorkspaceRoute>(() =>
    initialRoute(
      initialProfile(),
      initialActiveRoom(),
    ),
  );
  const [learnerLibrary, setLearnerLibrary] = useState(() =>
    learnerLibraryRepository.load(),
  );
  const [activeRoom, setActiveRoom] = useState<LearningRoom | null>(() =>
    initialActiveRoom(),
  );

  useEffect(() => {
    document.documentElement.lang =
      profile?.goal.interfaceLocale.toLowerCase() ?? "en";
  }, [profile?.goal.interfaceLocale]);

  const value = useMemo<LearningWorkspaceValue>(
    () => ({
      profile,
      route,
      savedIds: learnerLibrary.savedIds,
      topicNotes: learnerLibrary.topicNotes,
      vocabularyBookmarks: learnerLibrary.vocabularyBookmarks,
      activeRoom,
      canControlActiveRoom: Boolean(
        activeRoom && roomService.canControl(activeRoom.code),
      ),
      completeSetup(nextProfile) {
        setProfile(nextProfile);
        browserStorage.set(PROFILE_KEY, nextProfile);
        setRoute(initialRoute(nextProfile));
      },
      updateGoal(goal) {
        setProfile((current) => {
          if (!current) return current;
          const next = { ...current, goal: { ...current.goal, ...goal } };
          browserStorage.set(PROFILE_KEY, next);
          return next;
        });
      },
      switchRole(role) {
        setProfile((current) => {
          const base =
            current ??
            ({
              name: "",
              role,
              goal: workspaceDefaults.goal,
              setupComplete: true,
            } satisfies WorkspaceProfile);
          const next = { ...base, role };
          browserStorage.set(PROFILE_KEY, next);
          return next;
        });
        setRoute(role === "teacher" ? "teacher" : role === "student" ? "join" : "explore");
      },
      navigate: setRoute,
      toggleSaved(topicId) {
        const next = learnerLibraryRepository.save(
          toggleSavedTopic(learnerLibrary, topicId),
        );
        setLearnerLibrary(next);
      },
      setTopicNote(topicId, note) {
        const next = learnerLibraryRepository.save(
          writeTopicNote(learnerLibrary, topicId, note),
        );
        setLearnerLibrary(next);
      },
      toggleVocabularyBookmark(key) {
        const next = learnerLibraryRepository.save(
          toggleVocabularyBookmark(learnerLibrary, key),
        );
        setLearnerLibrary(next);
      },
      importLearnerLibrary(input) {
        const next = learnerLibraryRepository.save(
          mergeLearnerLibrary(
            learnerLibrary,
            {
              savedTopicIds: input.savedIds,
              topicNotes: input.topicNotes,
              vocabularyBookmarks: input.vocabularyBookmarks,
            },
            input.replaceConflicts,
          ),
        );
        setLearnerLibrary(next);
        if (input.replaceProfile && input.profile) {
          setProfile(input.profile);
          browserStorage.set(PROFILE_KEY, input.profile);
        }
      },
      async createRoom(input) {
        if (!navigator.onLine && !import.meta.env.DEV) {
          throw new RoomServiceError("Live rooms require an internet connection.");
        }
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const selectedTopic = catalog.get(input.topicId);
          if (!selectedTopic) {
            throw new Error("The selected topic is no longer available.");
          }
          const room = buildLearningRoom({
            code: createRoomCode(),
            name: input.name,
            topic: selectedTopic,
            teacherName: profile?.name || "Teacher",
            targetLanguage: input.targetLanguage,
            supportLanguage: input.supportLanguage,
            level: input.level,
            sessionMode: input.sessionMode,
          });
          try {
            const created = await roomService.create(room, crypto.randomUUID());
            browserStorage.set(ACTIVE_ROOM_KEY, created);
            setActiveRoom(created);
            setRoute("teacher-room");
            return created;
          } catch (error) {
            if (!(error instanceof RoomServiceError) || error.status !== 409) {
              throw error;
            }
          }
        }
        throw new Error("Could not reserve a unique room code. Please try again.");
      },
      async joinRoom(code, studentName) {
        const normalized = code.trim().toUpperCase();
        const participant = {
          id: roomService.participantId(normalized),
          name: studentName.trim() || profile?.name || "Student",
          status: "ready" as const,
        };
        try {
          const joined = await roomService.join(normalized, participant);
          browserStorage.set(ACTIVE_ROOM_KEY, joined);
          setActiveRoom(joined);
          setRoute("student-room");
          return { room: joined };
        } catch (error) {
          return {
            error:
              error instanceof Error
                ? error.message
                : "We could not find that room.",
          };
        }
      },
      async refreshRoom(snapshot) {
        if (!activeRoom) return null;
        try {
          const refreshed = snapshot ?? (await roomService.get(activeRoom.code));
          browserStorage.set(ACTIVE_ROOM_KEY, refreshed);
          setActiveRoom((current) =>
            current && JSON.stringify(current) === JSON.stringify(refreshed)
              ? current
              : refreshed,
          );
          return refreshed;
        } catch (error) {
          if (error instanceof RoomServiceError && error.status === 404) {
            browserStorage.remove(ACTIVE_ROOM_KEY);
            setActiveRoom(null);
          }
          return null;
        }
      },
      async updateRoomQuestion(index) {
        if (!activeRoom) return;
        const next = await roomService.setQuestion(activeRoom.code, index);
        browserStorage.set(ACTIVE_ROOM_KEY, next);
        setActiveRoom(next);
      },
      async leaveRoom(endForEveryone = false) {
        if (endForEveryone && activeRoom) {
          await roomService.end(activeRoom.code);
        } else if (activeRoom && profile?.role === "student") {
          await roomService.leave(activeRoom.code);
        }
        setActiveRoom(null);
        browserStorage.remove(ACTIVE_ROOM_KEY);
        setRoute(
          profile?.role === "teacher"
            ? "teacher"
            : profile?.role === "student"
              ? "join"
              : "explore",
        );
      },
      resetWorkspace() {
        browserStorage.remove(PROFILE_KEY);
        browserStorage.remove(ACTIVE_ROOM_KEY);
        setProfile(null);
        setActiveRoom(null);
        setRoute("setup");
      },
    }),
    [activeRoom, catalog, learnerLibrary, profile, route],
  );

  return (
    <LearningWorkspaceContext.Provider value={value}>
      {children}
    </LearningWorkspaceContext.Provider>
  );
}
