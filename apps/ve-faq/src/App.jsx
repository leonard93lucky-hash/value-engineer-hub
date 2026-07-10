import { useState, useEffect, useCallback } from 'react';
import LoginScreen from './components/LoginScreen.jsx';
import FAQDashboard from './components/FAQDashboard.jsx';
import FAQModal from './components/FAQModal.jsx';
import ActivityLog from './components/ActivityLog.jsx';
import StatsDashboard from './components/StatsDashboard.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import Toast from './components/Toast.jsx';
import SendQuestionnaire from './components/SendQuestionnaire.jsx';
import ClientQuestionnaire from './components/ClientQuestionnaire.jsx';
import AppNav from './components/AppNav.jsx';
import { 
  fetchFAQs, addFAQ, updateFAQ, deleteFAQ, fetchLogs, 
  fetchCategories, addCategory, deleteCategory,
  fetchRatings, rateFAQ, fetchRelated, addRelated, removeRelated
} from './api.js';

function App() {
  // Restore session from sessionStorage on load
  const storedAuth = (() => {
    try {
      const raw = sessionStorage.getItem('ve_hub_user');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  })();

  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(!!storedAuth);
  const [userId, setUserId] = useState(storedAuth?.userId || '');
  const [userName, setUserName] = useState(storedAuth?.name || '');
  const [userPosition, setUserPosition] = useState(storedAuth?.position || '');

  // Data state
  const [faqs, setFaqs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [ratings, setRatings] = useState({});
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI state
  const [currentScreen, setCurrentScreen] = useState('faq'); // 'faq' | 'send-questionnaire' | 'sow'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [deletingFaq, setDeletingFaq] = useState(null);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [faqData, logData, catData, ratingsData, relatedData] = await Promise.all([
        fetchFAQs(), 
        fetchLogs(userId), 
        fetchCategories(),
        fetchRatings(),
        fetchRelated(),
      ]);
      
      // Frontend validation: Filter logs by userId or resolved userName
      const resolvedName = userName || userId;
      const filteredLogs = logData.filter(log => {
        const logUser = String(log.userId || '').trim().toUpperCase();
        const targetId = String(userId).trim().toUpperCase();
        const targetName = String(resolvedName || '').trim().toUpperCase();
        return logUser === targetId || logUser === targetName;
      });

      setFaqs(faqData);
      setLogs(filteredLogs);
      setCategories(catData);
      setRatings(ratingsData);
      setRelated(relatedData);
    } catch (err) {
      showToast('Failed to load data: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [userId, userName, showToast]);

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated, loadData]);

  // --- Handlers ---
  // LoginScreen fully handles authentication steps and calls onLogin with the resolved user
  const handleLogin = (result) => {
    setUserId(result.userId);
    setUserName(result.name);
    setUserPosition(result.position || '');
    setIsAuthenticated(true);
    // Persist session so navigating back from SOW generator doesn't log out
    sessionStorage.setItem('ve_hub_user', JSON.stringify({
      userId: result.userId,
      name: result.name,
      position: result.position || ''
    }));
  };

  const handleLogout = () => {
    sessionStorage.removeItem('ve_hub_user');
    setIsAuthenticated(false);
    setUserId('');
    setUserName('');
    setUserPosition('');
    setCurrentScreen('hub');
    setFaqs([]);
    setLogs([]);
    setRatings({});
    setRelated([]);
  };

  const handleAddFaq = () => {
    setEditingFaq(null);
    setIsModalOpen(true);
  };

  const handleEditFaq = (faq) => {
    setEditingFaq(faq);
    setIsModalOpen(true);
  };

  const handleDeleteFaq = (faq) => {
    setDeletingFaq(faq);
  };

  const handleSaveFaq = async (formData) => {
    if (editingFaq) {
      // Update existing
      await updateFAQ(editingFaq.id, formData, userId);
      showToast('FAQ updated successfully!');
    } else {
      // Add new
      await addFAQ(formData, userId);
      showToast('FAQ added successfully!');
    }
    await loadData();
  };

  const handleConfirmDelete = async () => {
    if (!deletingFaq) return;
    await deleteFAQ(deletingFaq.id, userId);
    setDeletingFaq(null);
    showToast('FAQ deleted successfully!');
    await loadData();
  };

  const handleRefreshLogs = async () => {
    const logData = await fetchLogs(userId);
    const resolvedName = userName || userId;
    const filteredLogs = logData.filter(log => {
      const logUser = String(log.userId || '').trim().toUpperCase();
      const targetId = String(userId).trim().toUpperCase();
      const targetName = String(resolvedName || '').trim().toUpperCase();
      return logUser === targetId || logUser === targetName;
    });
    setLogs(filteredLogs);
  };

  const handleAddCategory = async (name) => {
    await addCategory(name);
    await loadData();
  };

  const handleDeleteCategory = async (name) => {
    await deleteCategory(name);
    await loadData();
  };

  const handleRate = async (faqId, vote) => {
    try {
      const updated = await rateFAQ(faqId, userId, vote);
      if (updated) {
        setRatings(prev => ({ ...prev, [faqId]: updated }));
      }
    } catch (err) {
      showToast('Failed to submit rating: ' + err.message, 'error');
    }
  };

  const handleAddRelated = async (faqId, relatedFaqId, note) => {
    try {
      const result = await addRelated(faqId, userId, relatedFaqId, note);
      if (result?.success === false && result?.reason === 'already_exists') {
        showToast('These FAQs are already linked.', 'error');
      } else {
        showToast('Related FAQ linked!');
        const relatedData = await fetchRelated();
        setRelated(relatedData);
      }
    } catch (err) {
      showToast('Failed to link FAQ: ' + err.message, 'error');
    }
  };

  const handleRemoveRelated = async (faqId, relatedFaqId) => {
    try {
      await removeRelated(faqId, relatedFaqId, userId);
      showToast('Link removed.');
      const relatedData = await fetchRelated();
      setRelated(relatedData);
    } catch (err) {
      showToast('Failed to remove link: ' + err.message, 'error');
    }
  };

  // --- Render ---
  
  // Public-facing route: Client evaluation form
  if (window.location.pathname === '/privy-officer-performance-questionnaire') {
    return (
      <>
        <ClientQuestionnaire />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen onLogin={handleLogin} />
        <Toast toast={toast} onDismiss={() => setToast(null)} />
      </>
    );
  }

  const role = (userPosition || '').toLowerCase();
  const isAuthorizedForQuestionnaire = role.includes('vp') || role.includes('manager');

  return (
    <>
      <AppNav
        currentScreen={currentScreen}
        userId={userId}
        userName={userName}
        userPosition={userPosition}
        onNavigate={(screen) => {
          if (screen === 'send-questionnaire' && !isAuthorizedForQuestionnaire) return;
          setCurrentScreen(screen);
        }}
        onLogout={handleLogout}
      />

      {currentScreen === 'sow' && (
        <div className="sow-iframe-container">
          <iframe
            src={`http://localhost:3000?userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`}
            className="sow-iframe"
            title="SOW Generator"
            allow="clipboard-read; clipboard-write"
          />
        </div>
      )}

      {currentScreen === 'send-questionnaire' && isAuthorizedForQuestionnaire && (
        <SendQuestionnaire
          userId={userId}
          userName={userName}
          showToast={showToast}
        />
      )}

      {currentScreen === 'faq' && (
        <FAQDashboard
          faqs={faqs}
          userName={userName}
          userId={userId}
          userPosition={userPosition}
          categories={categories}
          ratings={ratings}
          related={related}
          onAdd={handleAddFaq}
          onEdit={handleEditFaq}
          onDelete={handleDeleteFaq}
          onShowLogs={() => setIsLogOpen(true)}
          onShowStats={() => setIsStatsOpen(true)}
          isLoading={loading}
          onRate={handleRate}
          onAddRelated={handleAddRelated}
          onRemoveRelated={handleRemoveRelated}
        />
      )}

      <FAQModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingFaq(null); }}
        onSave={handleSaveFaq}
        editData={editingFaq}
        categories={categories}
        onAddCategory={handleAddCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <ActivityLog
        isOpen={isLogOpen}
        onClose={() => setIsLogOpen(false)}
        logs={logs}
        onRefresh={handleRefreshLogs}
      />

      <StatsDashboard
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        faqs={faqs}
        ratings={ratings}
      />

      <ConfirmDialog
        isOpen={!!deletingFaq}
        onClose={() => setDeletingFaq(null)}
        onConfirm={handleConfirmDelete}
        title="Delete FAQ"
        message={`Are you sure you want to delete "${deletingFaq?.question}"? This action cannot be undone.`}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </>
  );
}

export default App;
