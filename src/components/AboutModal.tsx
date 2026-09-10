import { useEffect } from "react";

interface AboutModalProps {
  open: boolean;
  onClose: () => void;
}

export function AboutModal({ open, onClose }: AboutModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-kicker">MOIL LIMITED · MANGANESE MINE INTELLIGENCE</span>
            <h2>About Oresight Platform</h2>
          </div>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog">
            ✕
          </button>
        </header>

        <div className="modal-content">
          <section className="about-section">
            <h3>Overview & Mission</h3>
            <p>
              <strong>Oresight</strong> is a geospatial and predictive operational intelligence platform designed for{" "}
              <strong>MOIL Limited</strong> (formerly Manganese Ore India Limited), India’s largest producer of manganese ore.
              The platform bridges remote sensing observation, exploration drillhole logs, and real-time operational risk indicators across the Central Indian Manganese Belt.
            </p>
          </section>

          <section className="about-section">
            <h3>🛰️ Copernicus Sentinel-2 Satellite Integration</h3>
            <p>
              The platform ingests European Space Agency (ESA) <strong>Copernicus Sentinel-2</strong> Level-2A surface reflectance data:
            </p>
            <ul>
              <li>
                <strong>10m Cloudless Basemap</strong>: Seamless, high-resolution optical mosaic refreshed annually via EOX Sentinel-2 Cloudless.
              </li>
              <li>
                <strong>SWIR Diagnostic Bands (B11 & B12)</strong>: Short-Wave Infrared reflectance (1610 nm and 2190 nm) highlights hydroxyl-bearing clay alteration and weathered lateritic caps that host or conceal manganese ore deposits.
              </li>
              <li>
                <strong>Iron Oxide & Gossan Indices</strong>: Ratio analysis (B4 / B2 and B11 / B12) isolates surface oxidation zones around opencast pit perimeters.
              </li>
              <li>
                <strong>Vegetation Canopy (NDVI)</strong>: Sentinel-2 B8 (NIR) and B4 (Red) index tracking seasonal canopy cover changes that obscure surface outcrops.
              </li>
            </ul>
          </section>

          <section className="about-section">
            <h3>📉 Shortfall Prediction & Operational Risk Model</h3>
            <p>
              Production shortfalls are modeled 30 days in advance using a weighted hazard formula calibrated across opencast (OC) and underground (UG) workings:
            </p>
            <div className="about-formula-card">
              <code>Risk = 0.35 · Downtime + 0.25 · Blast Delay + 0.25 · Weather Constraint + 0.15 · Reserve Depletion</code>
            </div>
            <ul>
              <li>
                <strong>Haul-Road Saturation</strong>: Monsoon rainfall exceeding 140 mm heavily discounts opencast haulage speeds and triggers blast cycle slips.
              </li>
              <li>
                <strong>Dynamic Fleet Re-allocation</strong>: Cross-mine recommendations allow moving mobile dumpers and shovels from low-risk underground operations to weather-constrained surface pits.
              </li>
            </ul>
          </section>

          <section className="about-section">
            <h3>⛏️ Assets & Deposits Covered</h3>
            <p>
              The intelligence network covers key operations in Maharashtra (Nagpur, Bhandara) and Madhya Pradesh (Balaghat):
            </p>
            <div className="about-assets-grid">
              <span className="asset-tag">Balaghat (UG · Deepest shaft)</span>
              <span className="asset-tag">Dongri Buzurg (OC · High-grade dioxide)</span>
              <span className="asset-tag">Chikla (UG)</span>
              <span className="asset-tag">Kandri (UG/OC)</span>
              <span className="asset-tag">Mansar (UG/OC)</span>
              <span className="asset-tag">Tirodi (OC)</span>
              <span className="asset-tag">Gumgaon (UG)</span>
              <span className="asset-tag">Ukwa (UG)</span>
              <span className="asset-tag">Selva Prospect (Exploration)</span>
              <span className="asset-tag">Bhudkum Prospect (Exploration)</span>
            </div>
          </section>
        </div>

        <footer className="modal-footer">
          <span className="modal-version">v1.2 · Powered by Copernicus Sentinel-2 & MapLibre GL</span>
          <button type="button" className="modal-btn-primary" onClick={onClose}>
            Got it
          </button>
        </footer>
      </div>
    </div>
  );
}
