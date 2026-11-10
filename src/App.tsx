import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { WordbookListPage } from './pages/WordbookListPage';
import { ChapterListPage } from './pages/ChapterListPage';
import { WordListPage } from './pages/WordListPage';
import { VocabularyTestPage } from './pages/VocabularyTestPage';
import { ListeningPage } from './pages/ListeningPage';
import { ReadingPage } from './pages/ReadingPage';
import { ReadingDetailPage } from './pages/ReadingDetailPage';
import { ReadingTestPage } from './pages/ReadingTestPage';
import { ReadingVocabularyPage } from './pages/ReadingVocabularyPage';
import { PdfPreviewPage } from './pages/PdfPreviewPage';
import { LoginPage } from './pages/LoginPage';
import { ProfilePage } from './pages/ProfilePage';
import { DataPage } from './pages/DataPage';
import { getSession } from './lib/api';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!getSession()) {
    return <Navigate to="/login" />;
  }
  return <>{children}</>;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/vocabulary" element={<WordbookListPage />} />
                  <Route path="/vocabulary/wordbook/:wordbookId" element={<ChapterListPage />} />
                  <Route path="/vocabulary/chapter/:chapterId" element={<WordListPage />} />
                  <Route path="/vocabulary/test/:chapterId" element={<VocabularyTestPage />} />
                  <Route path="/listening" element={<ListeningPage />} />
                  <Route path="/reading" element={<ReadingPage />} />
                  <Route path="/reading/:id" element={<ReadingDetailPage />} />
                  <Route path="/reading/:id/test" element={<ReadingTestPage />} />
                  <Route path="/reading/vocabulary" element={<ReadingVocabularyPage />} />
                  <Route path="/vocabulary/ebook/:id" element={<PdfPreviewPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/data" element={<DataPage />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
