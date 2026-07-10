import { FiBookOpen, FiFileText, FiPenTool, FiLogOut, FiUser } from 'react-icons/fi';

export default function AppNav({
  currentScreen,
  userName,
  userPosition,
  onNavigate,
  onLogout,
}) {
  const role = (userPosition || '').toLowerCase();
  const isAuthorizedForQuestionnaire = role.includes('vp') || role.includes('manager');

  return (
    <header className="app-nav glass">
      <div className="app-nav-left">
        <img
          src="https://privy.id/_nuxt/Privy_Logo_Red.BXNsidzu.png"
          alt="Privy"
          className="app-nav-logo"
        />
        <span className="app-nav-divider" />
        <span className="app-nav-brand">Value Engineering Hub</span>
      </div>

      <div className="app-nav-center">
        <button
          className={`app-nav-tab ${currentScreen === 'faq' ? 'active' : ''}`}
          onClick={() => onNavigate('faq')}
        >
          <FiBookOpen size={15} />
          <span>FAQ</span>
        </button>

        {isAuthorizedForQuestionnaire && (
          <button
            className={`app-nav-tab ${currentScreen === 'send-questionnaire' ? 'active' : ''}`}
            onClick={() => onNavigate('send-questionnaire')}
          >
            <FiFileText size={15} />
            <span>Questionnaire</span>
          </button>
        )}

        <button
          className={`app-nav-tab ${currentScreen === 'sow' ? 'active' : ''}`}
          onClick={() => onNavigate('sow')}
        >
          <FiPenTool size={15} />
          <span>SOW Generator</span>
        </button>
      </div>

      <div className="app-nav-right">
        <div className="app-nav-user">
          <FiUser size={14} />
          <span>{userName}</span>
        </div>
        <button className="app-nav-icon-btn" onClick={onLogout} title="Logout">
          <FiLogOut size={16} />
        </button>
      </div>
    </header>
  );
}
