import React, { useState } from 'react';
import { 
  Target, AlertOctagon, Plus, Lock, Unlock, CheckCircle2, 
  Clock, Calendar, Search, Sparkles, ArrowRight, ShieldCheck, 
  Trash2, ChevronRight, Layers, DollarSign
} from 'lucide-react';
import { sound } from '../core/sound.js';
import { ACTIONS } from '../data/actionsData.js';

export default function ProjectsView({
  activeProjects,
  onSaveProject,
  onAddProject,
  onDeleteProject,
  businessProjects,
  ideasVault,
  onAddIdea,
  onDeleteIdea,
  onLaunchIdea,
  spacedRecurrences,
  onCompleteRecurrence,
  focusTrio,
  onSetFocusTrio,
  onAddXp
}) {
  const [activeSubTab, setActiveSubTab] = useState('mk3'); // 'mk3', 'donjons', 'idees', 'recurrences', 'actions'
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState('Business');
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaNotes, setNewIdeaNotes] = useState('');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('all');
  const [warningMessage, setWarningMessage] = useState('');

  const handleAddProject = () => {
    if (!newProjectName.trim()) return;
    if (activeProjects.length >= 3) {
      sound.playAlarm();
      setWarningMessage("RÈGLE STRICTE R1 : Tu as déjà 3 projets actifs ! Tu dois en terminer un avant d'en ouvrir un 4e.");
      return;
    }
    sound.playClick();
    onAddProject({
      id: 'p_' + Date.now(),
      name: newProjectName.trim(),
      category: newProjectCategory,
      progress: 0,
      nextStep: 'Définir la première action concrète',
      status: 'ACTIVE'
    });
    setNewProjectName('');
    setWarningMessage('');
    onAddXp(10, 'INT');
  };

  const handleActivateDungeon = (dungeon) => {
    if (activeProjects.length >= 3) {
      sound.playAlarm();
      setWarningMessage("RÈGLE STRICTE R1 : Les 3 slots sont pleins ! Termine un projet avant d'activer un nouveau donjon.");
      return;
    }
    sound.playClick();
    onAddProject({
      id: 'p_' + dungeon.id,
      name: dungeon.name,
      category: 'Business',
      progress: 10,
      nextStep: dungeon.steps.find(s => !s.completed)?.text || 'Passer à l’étape suivante',
      status: 'ACTIVE'
    });
    setActiveSubTab('mk3');
    onAddXp(15, 'INT');
  };

  const handleAddIdea = () => {
    if (!newIdeaTitle.trim()) return;
    sound.playClick();
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    nextMonth.setDate(1);
    const lockedUntil = nextMonth.toISOString().split('T')[0];

    onAddIdea({
      id: 'idea_' + Date.now(),
      title: newIdeaTitle.trim(),
      notes: newIdeaNotes.trim(),
      capturedAt: new Date().toISOString().split('T')[0],
      lockedUntil: lockedUntil,
      status: 'LOCKED'
    });
    setNewIdeaTitle('');
    setNewIdeaNotes('');
    alert('Idée mise en quarantaine 30 jours pour protéger votre focus !');
  };

  const handleAddActionToTrio = (action) => {
    sound.playClick();
    const existing = [...(focusTrio || [])];
    const newHabit = {
      code: action.code,
      title: action.action,
      domain: action.domaine,
      status: 'TODO',
      xp: action.xp || 5
    };
    if (existing.length < 3) {
      existing.push(newHabit);
    } else {
      existing[0] = newHabit;
    }
    onSetFocusTrio(existing);
    alert(`« ${action.action} » a été ajouté à votre Focus Trio du Jour !`);
  };

  const filteredActions = (ACTIONS || []).filter(a => {
    const matchesSearch = !catalogSearch || a.action.toLowerCase().includes(catalogSearch.toLowerCase()) || a.sous_domaine?.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesDomain = selectedDomain === 'all' || a.domaine?.includes(selectedDomain);
    return matchesSearch && matchesDomain;
  });

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '12px' }} className="animate-float">
      
      {/* Sub Tabs Pill Bar */}
      <div className="pill-tabs-bar">
        {[
          { id: 'mk3', label: `3 PROJETS (${activeProjects.length}/3)` },
          { id: 'donjons', label: '5 DONJONS BIZ' },
          { id: 'idees', label: `QUARANTAINE IDÉES (${ideasVault.length})` },
          { id: 'recurrences', label: 'RÉCURRENCES' },
          { id: 'actions', label: '141 ACTIONS ÉVOLUTION' },
        ].map(st => (
          <button
            key={st.id}
            onClick={() => {
              sound.playClick();
              setActiveSubTab(st.id);
            }}
            className={`pill-tab ${activeSubTab === st.id ? 'active' : ''}`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {warningMessage && (
        <div className="neuro-card" style={{ borderColor: 'var(--alert-red)', background: 'rgba(239, 68, 68, 0.1)', padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--alert-red)', fontWeight: 700, fontSize: 11 }}>
            <AlertOctagon size={16} /> {warningMessage}
          </div>
        </div>
      )}

      {/* --- SOUS-ONGLET 1: LES 3 PROJETS STRICTS (Système MK) --- */}
      {activeSubTab === 'mk3' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="neuro-card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span className="system-window-title">RÈGLE STRICTE DES 3 PROJETS ACTIFS MAX</span>
              <span style={{ fontSize: 11, fontWeight: 900, fontFamily: 'var(--font-hud)', color: activeProjects.length >= 3 ? 'var(--alert-red)' : 'var(--neon-green)' }}>
                {activeProjects.length} / 3 SLOTS UTILISÉS
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Pour garantir la victoire, votre énergie mentale ne doit jamais être fragmentée sur plus de 3 fronts en même temps.
            </p>
          </div>

          {/* Formulaire nouveau projet si slot disponible */}
          {activeProjects.length < 3 && (
            <div className="neuro-card" style={{ borderColor: 'var(--border-cyan-dim)' }}>
              <span className="kpi-label" style={{ color: 'var(--border-cyan)', display: 'block', marginBottom: 8 }}>+ OUVRIR UN NOUVEAU CHANTIER</span>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="Nom du projet concret (ex: Lancement Offre KDP)" 
                  value={newProjectName} 
                  onChange={(e) => setNewProjectName(e.target.value)} 
                  style={{ flex: 2, minWidth: 160 }} 
                />
                <select 
                  value={newProjectCategory} 
                  onChange={(e) => setNewProjectCategory(e.target.value)} 
                  style={{ flex: 1, minWidth: 100 }}
                >
                  <option value="Business">Business</option>
                  <option value="Compétences">Compétences</option>
                  <option value="Foyer">Foyer</option>
                  <option value="Santé">Santé</option>
                </select>
                <button onClick={handleAddProject} className="btn-neuro btn-neuro-primary" style={{ padding: '6px 14px' }}>
                  <Plus size={14} /> Activer
                </button>
              </div>
            </div>
          )}

          {/* Liste des projets actifs */}
          {activeProjects.length === 0 ? (
            <div className="neuro-card" style={{ textAlign: 'center', padding: '24px 16px' }}>
              <Target size={32} color="var(--text-dim)" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-white)' }}>Aucun projet actif pour le moment</p>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                Ouvrez un chantier ci-dessus ou activez un Donjon Business ci-dessous.
              </p>
            </div>
          ) : (
            activeProjects.map(p => (
              <div key={p.id} className="neuro-card" style={{ borderColor: 'var(--border-subtle)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 900, fontFamily: 'var(--font-title)', color: 'var(--text-white)' }}>
                    {p.name}
                  </span>
                  <button 
                    onClick={() => onDeleteProject(p.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 2 }}
                    title="Archiver / Supprimer le projet"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 11, color: 'var(--text-dim)' }}>
                  <span>Catégorie : <strong>{p.category}</strong></span>
                  <span>•</span>
                  <span>Avancement : <strong>{p.progress || 0}%</strong></span>
                </div>

                <div className="hud-bar-container" style={{ marginBottom: 10 }}>
                  <div className="hud-bar-fill" style={{ width: `${p.progress || 0}%` }} />
                </div>

                <div style={{ background: 'var(--bg-inset)', padding: '8px 10px', borderRadius: 8, fontSize: 11 }}>
                  <span style={{ color: 'var(--border-cyan)', fontWeight: 700 }}>Prochaine étape : </span>
                  <span style={{ color: 'var(--text-main)' }}>{p.nextStep}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* --- SOUS-ONGLET 2: 5 DONJONS BUSINESS (Solo Leveling) --- */}
      {activeSubTab === 'donjons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(businessProjects || []).map(d => (
            <div key={d.id} className="neuro-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 900, fontFamily: 'var(--font-title)', color: 'var(--text-white)' }}>
                  {d.name}
                </span>
                <span className={`rank-badge rank-${d.rank}`}>RANG {d.rank}</span>
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                {d.description}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
                {d.steps.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-main)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--border-cyan)' }} />
                    <span>{s.text}</span>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => handleActivateDungeon(d)}
                className="btn-neuro btn-neuro-primary"
                style={{ width: '100%', fontSize: 11 }}
              >
                Activer comme l'un de mes 3 Projets MK
              </button>
            </div>
          ))}
        </div>
      )}

      {/* --- SOUS-ONGLET 3: BOÎTE À IDÉES SOUS QUARANTAINE (30J) --- */}
      {activeSubTab === 'idees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="neuro-card">
            <span className="system-window-title" style={{ display: 'block', marginBottom: 4 }}>RÈGLE DE QUARANTAINE DES 30 JOURS</span>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
              Toute nouvelle idée est capturée et verrouillée jusqu'au 1er du mois suivant. Si elle est toujours pertinente après 30 jours, elle peut être promue en projet.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <input 
                type="text" 
                placeholder="Titre de la nouvelle opportunité / idée"
                value={newIdeaTitle}
                onChange={(e) => setNewIdeaTitle(e.target.value)}
              />
              <textarea 
                placeholder="Détails, hypothèses ou notes rapides..."
                value={newIdeaNotes}
                onChange={(e) => setNewIdeaNotes(e.target.value)}
                rows={2}
              />
              <button onClick={handleAddIdea} className="btn-neuro btn-neuro-primary">
                <Lock size={14} /> Mettre en quarantaine 30j
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(ideasVault || []).map(idea => (
              <div key={idea.id} className="neuro-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-white)' }}>{idea.title}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                    Capturé le {idea.capturedAt} • Verrouillé jusqu'au {idea.lockedUntil}
                  </div>
                </div>
                <button 
                  onClick={() => onDeleteIdea(idea.id)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SOUS-ONGLET 4: RÉCURRENCES ESPACÉES (Évolution) --- */}
      {activeSubTab === 'recurrences' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(spacedRecurrences || []).map(r => (
            <div key={r.id} className="neuro-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-white)' }}>{r.name}</div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)' }}>
                  Fréquence : tous les {r.intervalMonths} mois • Catégorie : {r.category}
                </div>
              </div>
              <button 
                onClick={() => { sound.playQuestComplete(); onCompleteRecurrence(r.id); }}
                className="btn-neuro btn-neuro-success"
                style={{ fontSize: 10, padding: '6px 10px', minHeight: 30 }}
              >
                <CheckCircle2 size={12} /> Valider
              </button>
            </div>
          ))}
        </div>
      )}

      {/* --- SOUS-ONGLET 5: 141 ACTIONS (Catalogue Évolution) --- */}
      {activeSubTab === 'actions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <input 
              type="text" 
              placeholder="Rechercher une action parmi les 141..."
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              style={{ flex: 1 }}
            />
            <select 
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              style={{ width: 120 }}
            >
              <option value="all">Tous domaines</option>
              <option value="Corps">Corps</option>
              <option value="Esprit">Esprit</option>
              <option value="Finances">Finances</option>
              <option value="Cœur">Cœur</option>
              <option value="Âme">Âme</option>
            </select>
          </div>

          <div style={{ maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredActions.map(act => (
              <div key={act.code} className="neuro-card" style={{ padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ minWidth: 0, flex: 1, paddingRight: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3 }}>{act.action}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>
                    {act.domaine} • {act.sous_domaine} • +{act.xp} XP
                  </div>
                </div>
                <button 
                  onClick={() => handleAddActionToTrio(act)}
                  className="btn-neuro" 
                  style={{ fontSize: 9, padding: '4px 8px', minHeight: 28 }}
                  title="Ajouter au Focus Trio"
                >
                  + Trio
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
