export default function RulesScreen({ onAccept }) {
  const rules = [
    { num: '01', title: 'Scan the QR', body: 'At each location your team will find a QR code. Scan it to open the game on this device.' },
    { num: '02', title: 'Login with your Team Code', body: 'Enter your Team Number and 4-digit PIN. This unlocks your unique clue for that location.' },
    { num: '03', title: 'Solve the Clue', body: 'Read your clue carefully. It describes your next location somewhere on campus. Think smart.' },
    { num: '04', title: 'Reach the Reunion Point', body: 'After your 3rd stop, the game will tell you to reunite with your other team member at the Auditorium.' },
    { num: '05', title: 'Finish Together', body: 'Once reunited, you\'ll continue as a full team and race to complete the final stops.' },
    { num: '⚠', title: 'Code of Conduct', body: 'No sharing clues with other teams. No accessing another team\'s QR link. Cheating = disqualification.' },
  ];

  return (
    <div className="rules-overlay">
      <div className="rules-card">
        <div className="rules-header">
          <div className="rules-badge">T-HUNT // 2026</div>
          <h1 className="rules-title">MISSION BRIEF</h1>
          <p className="rules-subtitle">Read before you begin. Every detail matters.</p>
        </div>

        <ol className="rules-list">
          {rules.map(rule => (
            <li key={rule.num} className="rules-item">
              <span className="rules-num">{rule.num}</span>
              <div className="rules-content">
                <div className="rules-rule-title">{rule.title}</div>
                <div className="rules-rule-body">{rule.body}</div>
              </div>
            </li>
          ))}
        </ol>

        <div className="rules-footer">
          <p className="rules-footer-note">By tapping the button below you confirm you understand the rules.</p>
          <button className="rules-accept-btn" onClick={onAccept} id="accept-rules-btn">
            I UNDERSTAND — BEGIN
          </button>
        </div>
      </div>
    </div>
  );
}
