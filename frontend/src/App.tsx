import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthProvider";
import { ConfirmProvider } from "./context/ConfirmProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AppLayout } from "./components/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { HomePage } from "./pages/HomePage";
import { RoadmapPage } from "./pages/RoadmapPage";
import { NoteDetailPage } from "./pages/NoteDetailPage";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfirmProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<HomePage />} />
            <Route path="/roadmaps/:roadmapId" element={<RoadmapPage />} />
            <Route
              path="/roadmaps/:roadmapId/nodes/:nodeId/notes/:noteId"
              element={<NoteDetailPage />}
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ConfirmProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
