interface TopNavProps {
  activeTab: "map" | "shortfall";
  onTabChange: (tab: "map" | "shortfall") => void;
  onOpenAbout: () => void;
}

export function TopNav({ activeTab, onTabChange, onOpenAbout }: TopNavProps) {
  return (
    <header className="top-nav" aria-label="Global Navigation">
      <div className="top-nav-brand">
        <span className="brand-badge">MOIL</span>
        <div className="brand-text">
          <span className="brand-title">Oresight</span>
          <span className="brand-sub">Manganese Mine Intelligence</span>
        </div>
      </div>

      <nav className="top-nav-tabs" role="tablist" aria-label="Main navigation">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "map"}
          className={`nav-tab ${activeTab === "map" ? "is-active" : ""}`}
          onClick={() => onTabChange("map")}
        >
          <span className="tab-icon">🗺️</span>
          <span className="tab-text">Map Intelligence</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "shortfall"}
          className={`nav-tab ${activeTab === "shortfall" ? "is-active" : ""}`}
          onClick={() => onTabChange("shortfall")}
        >
          <span className="tab-icon">📉</span>
          <span className="tab-text">Shortfall Prediction</span>
        </button>
      </nav>

      <div className="top-nav-actions">
        <button
          type="button"
          className="about-btn"
          onClick={onOpenAbout}
          aria-label="About this intelligence platform"
        >
          <span className="about-icon">ℹ️</span>
          <span>About</span>
        </button>
      </div>
    </header>
  );
}
