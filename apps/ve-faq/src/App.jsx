import { useState, useEffect, useCallback, useRef } from 'react';
import LoginScreen from './components/LoginScreen.jsx';
import FAQDashboard from './components/FAQDashboard.jsx';
import FAQModal from './components/FAQModal.jsx';
import ActivityLog from './components/ActivityLog.jsx';

const SOW_ORIGIN = import.meta.env.VITE_SOW_URL || (import.meta.env.PROD ? 'https://valueengineeringhub.vercel.app' : 'http://localhost:3000');
const TEAM_FUND_ORIGIN = import.meta.env.PROD
  ? (import.meta.env.VITE_TEAM_FUND_URL || 'https://v0-team-fund-idr-tracker-leonard93lucky-2074s-projects.vercel.app')
  : 'http://localhost:3002';
import StatsDashboard from './components/StatsDashboard.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import Toast from './components/Toast.jsx';
import SendQuestionnaire from './components/SendQuestionnaire.jsx';
import ClientQuestionnaire from './components/ClientQuestionnaire.jsx';
import AppNav from './components/AppNav.jsx';
import FAQChatbot from './components/FAQChatbot.jsx';
import GamesPage from './components/GamesPage.jsx';
import { 
  fetchFAQs, addFAQ, updateFAQ, deleteFAQ, fetchLogs, 
  fetchCategories, addCategory, deleteCategory,
  fetchRatings, rateFAQ, fetchRelated, addRelated, removeRelated
} from './api.js';

// Each hub tab has its own address. The hub's files live under /login/; these paths are
// sent to the hub's index.html by vercel.json (production) and vite.config.js (local dev).
const SCREEN_PATHS = {
  faq: '/faq',
  'send-questionnaire': '/questionnaire',
  sow: '/sow',
  'team-fund': '/team-fund',
  games: '/games',
  'sow-admin': '/sow-admin',
};
const screenFromPath = (pathname) => {
  const path = (pathname || '').replace(/\/+$/, '');
  return Object.keys(SCREEN_PATHS).find(k => SCREEN_PATHS[k] === path) || null;
};

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
  const initialScreen = screenFromPath(window.location.pathname);
  // Tab to open after sign-in when someone arrives at e.g. /games while signed out
  const pendingScreenRef = useRef(initialScreen);
  const [currentScreen, setCurrentScreen] = useState(initialScreen || 'faq'); // see SCREEN_PATHS
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState(null);
  const [deletingFaq, setDeletingFaq] = useState(null);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [sowMounted, setSowMounted] = useState(initialScreen === 'sow');
  const [adminMounted, setAdminMounted] = useState(initialScreen === 'sow-admin');
  const [teamFundMounted, setTeamFundMounted] = useState(initialScreen === 'team-fund');
  const [scrollToFaqId, setScrollToFaqId] = useState(null);

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

  // Show a tab and put its address in the browser bar (push = new history entry, replace = same entry)
  const openScreen = useCallback((screen, { replace = false } = {}) => {
    if (screen === 'sow') setSowMounted(true);
    if (screen === 'sow-admin') setAdminMounted(true);
    if (screen === 'team-fund') setTeamFundMounted(true);
    setCurrentScreen(screen);
    const path = SCREEN_PATHS[screen];
    if (path && window.location.pathname !== path) {
      window.history[replace ? 'replaceState' : 'pushState']({ screen }, '', path);
    }
  }, []);

  // Keep the address bar in step with sign-in state: signed out → /login, signed in → the tab's path
  useEffect(() => {
    if (window.location.pathname.includes('/privy-officer-performance-questionnaire')) return;
    if (!isAuthenticated) {
      if (window.location.pathname !== '/login') window.history.replaceState({}, '', '/login' + window.location.search);
      return;
    }
    const role = (userPosition || '').toLowerCase();
    const blocked =
      (currentScreen === 'send-questionnaire' && !(role.includes('vp') || role.includes('manager'))) ||
      (currentScreen === 'sow-admin' && role !== 'support');
    openScreen(blocked ? 'faq' : currentScreen, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userPosition]);

  // Browser back / forward between tabs
  useEffect(() => {
    const onPop = () => {
      if (!isAuthenticated) return;
      const screen = screenFromPath(window.location.pathname) || 'faq';
      if (screen === 'sow') setSowMounted(true);
      if (screen === 'sow-admin') setAdminMounted(true);
      if (screen === 'team-fund') setTeamFundMounted(true);
      setCurrentScreen(screen);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [isAuthenticated]);

  // Listen for postMessage from SOW iframe
  useEffect(() => {
    const handleMessage = (e) => {
      if (e.data === 'open-activity-log') setIsLogOpen(true);
      if (e.data === 'open-leaderboard') setIsStatsOpen(true);
      if (e.data === 'back-to-faq') openScreen('faq');
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [openScreen]);

  // Keep iframe containers aligned with the real nav height
  useEffect(() => {
    if (!isAuthenticated) return;
    const nav = document.querySelector('.app-nav');
    if (!nav) return;
    const updateNavHeight = () => {
      document.documentElement.style.setProperty('--app-nav-height', `${nav.getBoundingClientRect().height}px`);
    };
    updateNavHeight();
    const observer = new ResizeObserver(updateNavHeight);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [isAuthenticated]);

  // --- Handlers ---
  // LoginScreen fully handles authentication steps and calls onLogin with the resolved user
  const handleLogin = (result) => {
    setUserId(result.userId);
    setUserName(result.name);
    setUserPosition(result.position || '');
    setIsAuthenticated(true);
    const target = pendingScreenRef.current || 'faq';
    pendingScreenRef.current = null;
    setCurrentScreen(target);
    if (target === 'team-fund') setTeamFundMounted(true);
    if (target === 'sow-admin') setAdminMounted(true);
    setSowMounted(true);
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
    setCurrentScreen('faq');
    pendingScreenRef.current = null;
    window.history.replaceState({}, '', '/login');
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
  if (window.location.pathname.includes('/privy-officer-performance-questionnaire')) {
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
          openScreen(screen);
        }}
        onLogout={handleLogout}
      />

      {sowMounted && (
        <div className="sow-iframe-container" style={{ display: currentScreen === 'sow' ? 'block' : 'none' }}>
          <iframe
            src={`${SOW_ORIGIN}/?userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}`}
            className="sow-iframe"
            title="SOW Generator"
            allow="clipboard-read; clipboard-write"
          />
        </div>
      )}

      {adminMounted && (
        <div className="sow-iframe-container" style={{ display: currentScreen === 'sow-admin' ? 'block' : 'none' }}>
          <iframe
            src={`${SOW_ORIGIN}/admin?userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}&position=${encodeURIComponent(userPosition)}`}
            className="sow-iframe"
            title="Admin Panel"
            allow="clipboard-read; clipboard-write"
          />
        </div>
      )}

      {teamFundMounted && (
        <div className="sow-iframe-container" style={{ display: currentScreen === 'team-fund' ? 'block' : 'none' }}>
          <iframe
            src={`${TEAM_FUND_ORIGIN}?userId=${encodeURIComponent(userId)}&userName=${encodeURIComponent(userName)}&position=${encodeURIComponent(userPosition)}`}
            className="sow-iframe"
            title="Team Fund Tracker"
            allow="clipboard-read; clipboard-write"
          />
        </div>
      )}

      {currentScreen === 'games' && (
        <GamesPage userId={userId} userName={userName} showToast={showToast} />
      )}

      {currentScreen === 'send-questionnaire' && isAuthorizedForQuestionnaire && (
        <SendQuestionnaire
          userId={userId}
          userName={userName}
          showToast={showToast}
        />
      )}

      {currentScreen === 'faq' && (
        <>
          <FAQDashboard
            faqs={faqs}
            userName={userName}
            userId={userId}
            userPosition={userPosition}
            categories={categories}
            ratings={ratings}
            related={related}
            scrollToFaqId={scrollToFaqId}
            onAdd={handleAddFaq}
            onEdit={handleEditFaq}
            onDelete={handleDeleteFaq}
            onShowLogs={() => setIsLogOpen(true)}
            onShowStats={() => setIsStatsOpen(true)}
            onRefresh={loadData}
            isLoading={loading}
            onRate={handleRate}
            onAddRelated={handleAddRelated}
            onRemoveRelated={handleRemoveRelated}
            onScrollHandled={() => setScrollToFaqId(null)}
          />
          <FAQChatbot faqs={faqs} onScrollToFaq={setScrollToFaqId} />
        </>
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
