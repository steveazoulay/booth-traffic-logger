import React from 'react'
import { useApp } from '../context/AppContext'
import { ArrowLeft, Sparkles, Check, Clock, Wrench } from 'lucide-react'

const RELEASES = [
  {
    version: '1.5.0',
    date: '29 Janvier 2026',
    status: 'current',
    title: 'Offline Mode & QR Scanner',
    features: [
      { type: 'new', text: 'Mode offline complet - fonctionne sans connexion WiFi' },
      { type: 'new', text: 'Sync automatique des leads quand la connexion revient' },
      { type: 'new', text: 'Indicateur offline avec compteur de changements en attente' },
      { type: 'new', text: 'Scan QR code des badges visiteurs (vCard, JSON, texte)' },
      { type: 'new', text: 'Export PDF des statistiques avec rapport complet' },
      { type: 'improved', text: 'Cache local IndexedDB pour chargement instantané' }
    ]
  },
  {
    version: '1.4.0',
    date: '28 Janvier 2026',
    status: 'released',
    title: 'Comparative Dashboard & Tags',
    features: [
      { type: 'new', text: 'Dashboard comparatif entre Chicago Collective et Metro Show' },
      { type: 'new', text: 'Tags personnalisés: Follow-up Urgent, Send Catalog, Call Back, Demo Requested, Qualified Prospect' },
      { type: 'new', text: 'Affichage des tags sur les cartes de leads' },
      { type: 'improved', text: 'Duplicate detection avec alerte visuelle' }
    ]
  },
  {
    version: '1.3.0',
    date: '27 Janvier 2026',
    status: 'released',
    title: 'Multi-Show Support',
    features: [
      { type: 'new', text: 'Support multi-shows: Chicago Collective (USA) et Metro Show (Canada)' },
      { type: 'new', text: 'Base de données séparée par show' },
      { type: 'new', text: 'Écran de sélection de show au démarrage' },
      { type: 'new', text: 'Bouton "Change Show" dans le menu' },
      { type: 'improved', text: 'Badge dynamique selon le show sélectionné' }
    ]
  },
  {
    version: '1.2.0',
    date: '26 Janvier 2026',
    status: 'released',
    title: 'Analytics Dashboard',
    features: [
      { type: 'new', text: 'Dashboard analytics avec graphiques visuels' },
      { type: 'new', text: 'Graphiques de leads par heure et par jour' },
      { type: 'new', text: 'Carte heatmap géographique des leads' },
      { type: 'new', text: 'Statistiques par état, ville et staff' },
      { type: 'new', text: 'Export CSV des leads' }
    ]
  },
  {
    version: '1.1.0',
    date: '25 Janvier 2026',
    status: 'released',
    title: 'Business Card Scanner',
    features: [
      { type: 'new', text: 'Scanner de cartes de visite avec OCR (Tesseract.js)' },
      { type: 'new', text: 'Auto-remplissage du formulaire depuis la carte scannée' },
      { type: 'new', text: 'Voice notes pour les leads' },
      { type: 'new', text: 'Auto-lookup ZIP code (ville/état automatique)' }
    ]
  },
  {
    version: '1.0.0',
    date: '24 Janvier 2026',
    status: 'released',
    title: 'Initial Release',
    features: [
      { type: 'new', text: 'Application PWA installable sur mobile' },
      { type: 'new', text: 'Gestion des leads avec température (Hot/Warm/Browsing)' },
      { type: 'new', text: 'Intérêts: SS26, F26, Core, Reorder, New Account' },
      { type: 'new', text: 'Système de login par passcode' },
      { type: 'new', text: 'Gestion des utilisateurs (admin only)' },
      { type: 'new', text: 'Sync temps réel avec Supabase' }
    ]
  }
]

const ROADMAP = [
  { text: 'Search & Filter avancé (recherche full-text, filtre par date)', priority: 'high' },
  { text: 'Email/SMS templates pour follow-up rapide', priority: 'medium' },
  { text: 'Import contacts depuis CSV/vCard', priority: 'medium' },
  { text: 'Lead scoring automatique', priority: 'low' },
  { text: 'Multi-language (FR/EN)', priority: 'low' }
]

export function ReleaseNotes() {
  const { setView } = useApp()

  return (
    <div className="release-notes">
      <div className="release-notes-header">
        <button className="back-btn" onClick={() => setView('list')}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>Release Notes</h1>
          <p className="release-subtitle">Stone Rose Booth Traffic Logger</p>
        </div>
      </div>

      <div className="release-notes-content">
        {/* Current Version Banner */}
        <div className="current-version-banner">
          <Sparkles size={20} />
          <span>Version actuelle: <strong>1.5.0</strong></span>
        </div>

        {/* Releases */}
        <div className="releases-list">
          {RELEASES.map((release) => (
            <div key={release.version} className={`release-card ${release.status}`}>
              <div className="release-card-header">
                <div className="release-version">
                  <span className="version-number">v{release.version}</span>
                  {release.status === 'current' && (
                    <span className="version-badge current">Current</span>
                  )}
                </div>
                <span className="release-date">{release.date}</span>
              </div>
              <h3 className="release-title">{release.title}</h3>
              <ul className="release-features">
                {release.features.map((feature, idx) => (
                  <li key={idx} className={`feature-item ${feature.type}`}>
                    {feature.type === 'new' ? (
                      <span className="feature-badge new">NEW</span>
                    ) : (
                      <span className="feature-badge improved">IMPROVED</span>
                    )}
                    <span>{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Roadmap */}
        <div className="roadmap-section">
          <h2 className="roadmap-title">
            <Clock size={20} />
            <span>Roadmap</span>
          </h2>
          <div className="roadmap-list">
            {ROADMAP.map((item, idx) => (
              <div key={idx} className={`roadmap-item priority-${item.priority}`}>
                <span className={`priority-badge ${item.priority}`}>
                  {item.priority === 'high' ? 'Priorité haute' :
                   item.priority === 'medium' ? 'Priorité moyenne' : 'À considérer'}
                </span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="tech-stack-section">
          <h2 className="tech-stack-title">
            <Wrench size={20} />
            <span>Tech Stack</span>
          </h2>
          <div className="tech-grid">
            <div className="tech-item">
              <strong>Frontend</strong>
              <span>React 18 + Vite</span>
            </div>
            <div className="tech-item">
              <strong>Database</strong>
              <span>Supabase (PostgreSQL)</span>
            </div>
            <div className="tech-item">
              <strong>Offline</strong>
              <span>IndexedDB (idb)</span>
            </div>
            <div className="tech-item">
              <strong>Charts</strong>
              <span>Recharts</span>
            </div>
            <div className="tech-item">
              <strong>Maps</strong>
              <span>Leaflet</span>
            </div>
            <div className="tech-item">
              <strong>PDF</strong>
              <span>jsPDF</span>
            </div>
            <div className="tech-item">
              <strong>QR Scanner</strong>
              <span>html5-qrcode</span>
            </div>
            <div className="tech-item">
              <strong>OCR</strong>
              <span>Tesseract.js</span>
            </div>
          </div>
        </div>

        <div className="release-footer">
          <p>Développé avec Claude Code</p>
          <p className="footer-note">Pour Steve Azoulay - Stone Rose</p>
        </div>
      </div>
    </div>
  )
}
