import { lazy, Suspense } from "react";
import {
  LearningWorkspaceProvider,
} from "./workspace/LearningWorkspace";
import { useLearningWorkspace } from "./workspace/context";

const ExploreExperience = lazy(() => import("./features/explore/ExploreExperience"));
const JoinRoom = lazy(() => import("./features/rooms/JoinRoom"));
const RoomSession = lazy(() => import("./features/rooms/RoomSession"));
const SetupFlow = lazy(() => import("./features/setup/SetupFlow"));
const TeacherStudio = lazy(() => import("./features/teacher/TeacherStudio"));

function WorkspaceRouter() {
  const { profile, route, activeRoom } = useLearningWorkspace();

  if (!profile || route === "setup") {
    return <SetupFlow />;
  }

  if (route === "teacher") return <TeacherStudio />;
  if (route === "teacher-room") {
    return activeRoom ? <RoomSession mode="teacher" /> : <TeacherStudio />;
  }
  if (route === "join") return <JoinRoom />;
  if (route === "student-room") {
    return activeRoom ? <RoomSession mode="student" /> : <JoinRoom />;
  }
  return <ExploreExperience />;
}

export default function App() {
  return (
    <LearningWorkspaceProvider>
      <Suspense
        fallback={
          <main className="route-loading" role="status" aria-label="Loading LinguaFlow">
            <span aria-hidden="true" />
            LinguaFlow
          </main>
        }
      >
        <WorkspaceRouter />
      </Suspense>
    </LearningWorkspaceProvider>
  );
}
