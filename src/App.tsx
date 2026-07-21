import ExploreExperience from "./features/explore/ExploreExperience";
import JoinRoom from "./features/rooms/JoinRoom";
import RoomSession from "./features/rooms/RoomSession";
import SetupFlow from "./features/setup/SetupFlow";
import TeacherStudio from "./features/teacher/TeacherStudio";
import {
  LearningWorkspaceProvider,
} from "./workspace/LearningWorkspace";
import { useLearningWorkspace } from "./workspace/context";

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
      <WorkspaceRouter />
    </LearningWorkspaceProvider>
  );
}
