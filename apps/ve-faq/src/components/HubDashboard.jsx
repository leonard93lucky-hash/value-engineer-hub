import { FiBookOpen, FiFileText, FiPenTool, FiShield } from 'react-icons/fi';

const SOW_ORIGIN = import.meta.env.PROD ? '' : 'http://localhost:3000';

export default function HubDashboard({
  userId,
  userName,
  userPosition,
  onNavigate,
}) {
  const role = (userPosition || '').toLowerCase();
  const isAuthorizedForQuestionnaire = role.includes('vp') || role.includes('manager');

  const queryParams = new URLSearchParams();
  if (userId) queryParams.append('userId', userId);
  if (userName) queryParams.append('userName', userName);
  
  const sowGeneratorUrl = `${SOW_ORIGIN}/${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const adminUrl = `${SOW_ORIGIN}/admin`;

  return (
    <div className="hub-container animate-fade-in">
      <div className="hero-section" style={{ padding: '2rem 0 2.5rem' }}>
        <h2>Welcome back, {userName || 'User'}</h2>
        <p>Select a workspace to get started</p>
      </div>

      <div className="hub-grid">
        <div className="hub-card" onClick={() => onNavigate('faq')}>
          <div className="hub-card-icon" style={{ background: 'var(--primary-glow)' }}>
            <FiBookOpen size={28} color="var(--primary)" />
          </div>
          <h2>FAQ Database</h2>
          <p>
            Access and manage the centralized repository of internal knowledge, project policies, and technical details.
          </p>
          <button className="btn-primary">Open FAQ</button>
        </div>

        <div className="hub-card" style={{ opacity: isAuthorizedForQuestionnaire ? 1 : 0.6 }}
             onClick={() => { if (isAuthorizedForQuestionnaire) onNavigate('send-questionnaire'); }}>
          <div className="hub-card-icon" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
            <FiFileText size={28} color="#10B981" />
          </div>
          <h2>Questionnaire</h2>
          <p>
            Send performance evaluation questionnaires to project members.
            {!isAuthorizedForQuestionnaire && (
              <span style={{ display: 'block', marginTop: '0.5rem', color: 'var(--error)', fontSize: '0.8rem' }}>
                (Requires VP or Manager access)
              </span>
            )}
          </p>
          <button className="btn-primary" style={{ background: isAuthorizedForQuestionnaire ? '#10B981' : 'var(--text-dim)' }}
                  disabled={!isAuthorizedForQuestionnaire}>
            {isAuthorizedForQuestionnaire ? 'Send Questionnaire' : 'Access Denied'}
          </button>
        </div>

        <div className="hub-card" onClick={() => window.open(sowGeneratorUrl, '_blank')}>
          <div className="hub-card-icon" style={{ background: 'rgba(139, 92, 246, 0.15)' }}>
            <FiPenTool size={28} color="#8B5CF6" />
          </div>
          <h2>SOW Generator</h2>
          <p>
            Generate Scope of Work documents using AI. Opens in a new tab connected to your local SOW backend.
          </p>
          <button className="btn-primary" style={{ background: '#8B5CF6' }}>
            Open SOW Generator
          </button>
        </div>

        <div className="hub-card" onClick={() => window.open(adminUrl, '_blank')}>
          <div className="hub-card-icon" style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
            <FiShield size={28} color="#EF4444" />
          </div>
          <h2>Admin Panel</h2>
          <p>
            Manage, edit, and generate SOW &amp; Credential documents. Admin ID required.
          </p>
          <button className="btn-primary" style={{ background: '#EF4444' }}>
            Open Admin
          </button>
        </div>
      </div>
    </div>
  );
}
