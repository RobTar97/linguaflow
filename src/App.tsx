import { lazy, Suspense } from "react";
import {
  LearningWorkspaceProvider,
} from "./workspace/LearningWorkspace";
import { useLearningWorkspace } from "./workspace/context";
import { TopicLibraryProvider } from "./packs/context";
import { ConnectivityStatus } from "./ui/ConnectivityStatus";

const ExploreExperience = lazy(() => import("./features/explore/ExploreExperience"));
const JoinRoom = lazy(() => import("./features/rooms/JoinRoom"));
const RoomSession = lazy(() => import("./features/rooms/RoomSession"));
const SetupFlow = lazy(() => import("./features/setup/SetupFlow"));
const TeacherStudio = lazy(() => import("./features/teacher/TeacherStudio"));
const ContributorPreview = lazy(() => import("./features/contribute/ContributorPreview"));
const LearnerDataManager = lazy(() => import("./features/data/LearnerDataManager"));

function WorkspaceRouter() {
  const { profile, route, activeRoom } = useLearningWorkspace();

  if (new URLSearchParams(window.location.search).has("contribute")) {
    return <ContributorPreview />;
  }

  if (!profile || route === "setup") {
    return <SetupFlow />;
  }

  if (route === "teacher") return <TeacherStudio />;
  if (route === "data") return <LearnerDataManager />;
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
    <TopicLibraryProvider>
      <LearningWorkspaceProvider>
        <ConnectivityStatus />
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
    </TopicLibraryProvider>
  );
}
