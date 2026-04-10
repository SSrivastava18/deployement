// client/my-app/src/components/SpamBadge.js

const SpamBadge = ({ isSpam, spamReasons = [] }) => {
  if (!isSpam) return null;

  return (
    <div style={{
      background: "#fff3cd",
      border: "1px solid #ffc107",
      borderRadius: "6px",
      padding: "6px 12px",
      margin: "8px 8px 0 8px",
      display: "flex",
      alignItems: "flex-start",
      gap: "8px",
      fontSize: "13px",
      color: "#856404",
    }}>
      <span style={{ fontSize: "16px" }}>⚠️</span>
      <div>
        <strong>Flagged as Spam</strong>
        {spamReasons.length > 0 && (
          <div style={{ fontWeight: "normal", marginTop: "2px" }}>
            {spamReasons[0]}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpamBadge;