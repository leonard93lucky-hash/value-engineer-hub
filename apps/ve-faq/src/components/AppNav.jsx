import { FiPlayCircle, FiBookOpen, FiFileText, FiPenTool, FiShield, FiLogOut, FiUser, FiDollarSign } from 'react-icons/fi';
import privyLogo from '../assets/Privy_Logo_Red.png';

export default function AppNav({
  currentScreen,
  userName,
  userPosition,
  onNavigate,
  onLogout,
}) {
  const role = (userPosition || '').toLowerCase();
  const isAuthorizedForQuestionnaire = role.includes('vp') || role.includes('manager');
  const isAuthorizedForAdmin = role === 'support';

  return (
    <header className="app-nav glass">
      <div className="app-nav-left">
        <img
          src={privyLogo}
          alt="Privy"
          className="app-nav-logo"
        />
        <span className="app-nav-divider" />
        <span className="app-nav-brand">Value Engineering Hub</span>
      </div>

      <nav className="app-nav-center" aria-label="Hub sections">
        <button
          className={`app-nav-tab ${currentScreen === 'faq' ? 'active' : ''}`}
          aria-current={currentScreen === 'faq' ? 'page' : undefined}
          onClick={() => onNavigate('faq')}
        >
          <FiBookOpen size={16} aria-hidden="true" />
          <span>FAQ</span>
        </button>

        {isAuthorizedForQuestionnaire && (
          <button
            className={`app-nav-tab ${currentScreen === 'send-questionnaire' ? 'active' : ''}`}
          aria-current={currentScreen === 'send-questionnaire' ? 'page' : undefined}
            onClick={() => onNavigate('send-questionnaire')}
          >
            <FiFileText size={16} aria-hidden="true" />
            <span>Questionnaire</span>
          </button>
        )}

        <button
          className={`app-nav-tab ${currentScreen === 'sow' ? 'active' : ''}`}
          aria-current={currentScreen === 'sow' ? 'page' : undefined}
          onClick={() => onNavigate('sow')}
        >
          <FiPenTool size={16} aria-hidden="true" />
          <span>SOW Generator</span>
        </button>

        <button
          className={`app-nav-tab ${currentScreen === 'team-fund' ? 'active' : ''}`}
          aria-current={currentScreen === 'team-fund' ? 'page' : undefined}
          onClick={() => onNavigate('team-fund')}
        >
          <FiDollarSign size={16} aria-hidden="true" />
          <span>Team Fund</span>
        </button>

        <button
          className={`app-nav-tab ${currentScreen === 'games' ? 'active' : ''}`}
          aria-current={currentScreen === 'games' ? 'page' : undefined}
          onClick={() => onNavigate('games')}
        >
          <FiPlayCircle size={16} aria-hidden="true" />
          <span>Games</span>
        </button>

        {isAuthorizedForAdmin && (
          <button
            className={`app-nav-tab ${currentScreen === 'sow-admin' ? 'active' : ''}`}
          aria-current={currentScreen === 'sow-admin' ? 'page' : undefined}
            onClick={() => onNavigate('sow-admin')}
          >
            <FiShield size={16} aria-hidden="true" />
            <span>Admin</span>
          </button>
        )}
      </nav>

      <div className="app-nav-right">
        <div className="app-nav-user">
          <FiUser size={14} aria-hidden="true" />
          <span>{userName}</span>
        </div>
        <button className="app-nav-icon-btn" onClick={onLogout} aria-label="Log out" title="Log out">
          <FiLogOut size={16} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
