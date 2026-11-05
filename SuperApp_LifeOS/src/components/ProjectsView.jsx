import React, { useState } from 'react';
import { 
  Target, AlertOctagon, Plus, Lock, Unlock, CheckCircle, 
  Clock, Calendar, Search, Sparkles, ArrowRight, ShieldCheck, CheckSquare, Trash2
} from 'lucide-react';
import { sound } from '../core/sound.js';
import { ACTIONS } from '../data/actionsData.js';

export default function ProjectsView({
  activeProjects,
  onSaveProject,
  onAddProject,
  onDeleteProject,
  businessProjects,
  onToggleBusinessStep,
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
    setWarningMessage('');
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
  };

  const handleAddActionToTrio = (action) => {
    sound.playClick();
    const existing = [...(focusTrio || [])];
    const newHabit = {
      code: action.code,
      title: action.action,
      domain: action.domaine,
      status: 'TODO',
      xp: action.xp || 1
    };
    if (existing.length < 3) {
      existing.push(newHabit);
    } else {
      existing[0] = newHabit; // replace first
    }
    onSetFocusTrio(existing);
    alert(`« ${action.action} » a été ajouté à ton Trio de Focus Quotidien !`);
  };

  const filteredActions = (ACTIONS || []).filter(a => {
    const matchesSearch = !catalogSearch || a.action.toLowerCase().includes(catalogSearch.toLowerCase()) || a.sous_domaine?.toLowerCase().includes(catalogSearch.toLowerCase());
    const matchesDomain = selectedDomain === 'all' || a.domaine?.includes(selectedDomain);
    return matchesSearch && matchesDomain;
  });

  return (
    <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }} className="animate-float">
      
      {/* Sub Tabs Navigation */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { id: 'mk3', label: `LES 3 PROJETS (${activeProjects.length}/3)` },
          { id: 'donjons', label: '5 DONJONS BIZ' },
          { id: 'idees', label: `BOÎTE À IDÉES (${ideasVault.length})` },
          { id: 'recurrences', label: 'RÉCURRENCES' },
          { id: 'actions', label: '141 ACTIONS' },
        ].map(st => (
          <button
            key={st.id}
            onClick={() => {
              sound.playClick();
              setActiveSubTab(st.id);
            }}
            style={{
              padding: '6px 10px',
              fontSize: 10,
              fontFamily: 'var(--font-hud)',
              fontWeight: 700,
              borderRadius: 6,
              border: `1px solid ${activeSubTab === st.id ? 'var(--border-cyan)' : 'var(--border-cyan-dim)'}`,
              background: activeSubTab === st.id ? 'rgba(0,217,255,0.2)' : 'rgba(0,0,0,0.4)',
              color: activeSubTab === st.id ? 'var(--border-cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {st.label}
          </button>
        ))}
      </div>

      {warningMessage && (
        <div className="system-window" style={{ borderColor: 'var(--alert-red)', background: 'rgba(255,46,76,0.15)', padding: '10px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--alert-red)', fontWeight: 700, fontSize: 11 }}>
            <AlertOctagon size={16} /> {warningMessage}
          </div>
        </div>
      )}

      {/* --- SUB TAB 1: LES 3 PROJETS STRICTS (Système MK) --- */}
      {activeSubTab === 'mk3' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="system-window" style={{ padding: '12px 14px', background: 'rgba(255,46,76,0.06)', borderColor: 'var(--alert-red-dim)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--alert-red)', fontSize: 11, fontWeight: 700 }}>
              <AlertOctagon size={16} /> RÈGLE STRICTE R1 • FOCUS MAXIMUM
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              <strong>Zone interdite à un 4e projet.</strong> Aucun projet nouveau ne peut entrer tant que l'un des 3 slots n'est pas terminé ou archivé au bilan mensuel.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeProjects.map((p, idx) => (
              <div key={p.id} className="system-window" style={{ padding: '14px', borderColor: 'var(--border-cyan)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-hud)', fontWeight: 700 }}>
                      SLOT {idx + 1} / 3 • {p.category.toUpperCase()}
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', marginTop: 2 }}>{p.name}</div>
                  </div>
                  <button
                    onClick={() => {
                      sound.playLevelUp();
                      onAddXp(50, 'DSC');
                      onDeleteProject(p.id);
                    }}
                    className="btn-monarch"
                    style={{ padding: '4px 8px', fontSize: 10, background: 'rgba(0,255,136,0.15)', borderColor: 'var(--neon-green)', color: 'var(--neon-green)' }}
                  >
                    TERMINER (+50 XP)
                  </button>
                </div>

                {/* Progress bar and slider */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                    <span>Progression</span>
                    <span>{p.progress || 0}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={p.progress || 0}
                    onChange={(e) => onSaveProject({ ...p, progress: parseInt(e.target.value, 10) })}
                    style={{ width: '100%', accentColor: 'var(--border-cyan)' }}
                  />
                </div>

                {/* Next immediate step */}
                <div>
                  <span style={{ fontSize: 10, color: 'var(--border-cyan)', fontFamily: 'var(--font-hud)' }}>
                    PROCHAINE ÉTAPE IMMÉDIATE :
                  </span>
                  <input
                    type="text"
                    value={p.nextStep || ''}
                    onChange={(e) => onSaveProject({ ...p, nextStep: e.target.value })}
                    placeholder="Quelle est la prochaine action ?"
                    style={{
                      width: '100%',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-cyan-dim)',
                      borderRadius: 4,
                      color: '#fff',
                      fontSize: 12,
                      padding: '5px 8px',
                      marginTop: 3,
                      outline: 'none'
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Add project field if less than 3 */}
          {activeProjects.length < 3 && (
            <div className="system-window" style={{ padding: '12px 14px' }}>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-title)', color: 'var(--border-cyan)', display: 'block', marginBottom: 8 }}>
                AJOUTER UN PROJET DANS LE SLOT LIBRE ({activeProjects.length}/3)
              </span>
              <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Nom du projet..."
                  style={{ flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', fontSize: 12, padding: '6px 8px', outline: 'none' }}
                />
                <select
                  value={newProjectCategory}
                  onChange={(e) => setNewProjectCategory(e.target.value)}
                  style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', fontSize: 11, padding: '0 8px', outline: 'none' }}
                >
                  <option value="Business">Business</option>
                  <option value="Santé">Santé</option>
                  <option value="Spirituel">Spirituel</option>
                  <option value="Personnel">Personnel</option>
                </select>
              </div>
              <button
                onClick={handleAddProject}
                className="btn-monarch"
                style={{ width: '100%', padding: '8px', fontSize: 11 }}
              >
                + ACTIVER DANS LE SLOT LIBRE
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- SUB TAB 2: LES 5 DONJONS BUSINESS --- */}
      {activeSubTab === 'donjons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Les 5 projets business concrets pour passer de 203 000 FCFA à 733 333 FCFA / mois.
          </div>

          {(businessProjects || []).map(b => (
            <div key={b.id} className="system-window" style={{ padding: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--border-cyan)' }}>{b.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-hud)', marginTop: 2 }}>
                    💰 {b.potential} • Coût: {b.cost}
                  </div>
                </div>
                <button
                  onClick={() => handleActivateDungeon(b)}
                  className="btn-monarch"
                  style={{ padding: '4px 8px', fontSize: 10 }}
                >
                  🚀 Activer en Slot MK
                </button>
              </div>

              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>{b.description}</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border-cyan-dim)', paddingTop: 8 }}>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-hud)', color: 'var(--text-dim)' }}>
                  ÉTAPES DU DONJON ({b.steps.filter(s => s.completed).length} / {b.steps.length}) :
                </span>
                {b.steps.map(step => (
                  <div
                    key={step.id}
                    onClick={() => {
                      sound.playClick();
                      onToggleBusinessStep(b.id, step.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 11,
                      color: step.completed ? 'var(--text-muted)' : '#fff',
                      cursor: 'pointer'
                    }}
                  >
                    {step.completed ? <CheckSquare size={14} color="var(--neon-green)" /> : <CheckSquare size={14} color="var(--text-dim)" />}
                    <span style={{ textDecoration: step.completed ? 'line-through' : 'none' }}>{step.text}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- SUB TAB 3: BOÎTE À IDÉES SOUS SÉQUESTRE (Système MK) --- */}
      {activeSubTab === 'idees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="system-window" style={{ padding: '12px', background: 'rgba(0,217,255,0.05)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--border-cyan)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={14} /> SÉQUESTRE ANTI-DISPERSION (30 JOURS)
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Toute idée capturée reste sous séquestre jusqu'au premier jour du mois suivant pour éliminer l'impulsivité du "shiny object syndrome".
            </div>
          </div>

          <div className="system-window" style={{ padding: '12px' }}>
            <input
              type="text"
              value={newIdeaTitle}
              onChange={(e) => setNewIdeaTitle(e.target.value)}
              placeholder="Titre de la nouvelle idée..."
              style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', fontSize: 12, padding: '6px 8px', marginBottom: 6, outline: 'none' }}
            />
            <textarea
              value={newIdeaNotes}
              onChange={(e) => setNewIdeaNotes(e.target.value)}
              placeholder="Notes ou détails supplémentaires..."
              rows={2}
              style={{ width: '100%', background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', fontSize: 12, padding: '6px 8px', marginBottom: 8, outline: 'none' }}
            />
            <button
              onClick={handleAddIdea}
              className="btn-monarch"
              style={{ width: '100%', padding: '8px', fontSize: 11 }}
            >
              🔒 VERROUILLER SOUS SÉQUESTRE
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(ideasVault || []).map(idea => (
              <div key={idea.id} className="system-window" style={{ padding: '10px 12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{idea.title}</div>
                    {idea.notes && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{idea.notes}</div>}
                    <div style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-hud)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Lock size={11} /> Verrouillée jusqu’au {idea.lockedUntil}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => onDeleteIdea(idea.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--alert-red)', cursor: 'pointer' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SUB TAB 4: GESTION DES RÉCURRENCES ESPACÉES (Évolution v1.7) --- */}
      {activeSubTab === 'recurrences' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            Actions périodiques et rendez-vous espacés (coiffure, bilans, contrôles) qui ne bloquent pas le Trio de Focus.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(spacedRecurrences || []).map(r => (
              <div key={r.id} className="system-window" style={{ padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{r.name}</span>
                  <span style={{ fontSize: 10, color: 'var(--gold)', fontFamily: 'var(--font-hud)' }}>
                    Tous les {r.intervalMonths} mois
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-muted)' }}>
                  <span>Prochaine échéance : <strong>{r.nextDue}</strong></span>
                  <button
                    onClick={() => {
                      sound.playQuestComplete();
                      onAddXp(15, 'DSC');
                      onCompleteRecurrence(r.id);
                    }}
                    className="btn-monarch"
                    style={{ padding: '4px 8px', fontSize: 10 }}
                  >
                    ✓ Validé (+15 XP)
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SUB TAB 5: LE CATALOGUE DES 141 ACTIONS (Évolution) --- */}
      {activeSubTab === 'actions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Rechercher parmi 141 actions..."
                style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', fontSize: 11, padding: '6px 8px 6px 28px', outline: 'none' }}
              />
              <Search size={14} color="var(--text-dim)" style={{ position: 'absolute', top: 9, left: 8 }} />
            </div>
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              style={{ background: 'rgba(0,0,0,0.7)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, color: '#fff', fontSize: 10, padding: '0 6px', outline: 'none' }}
            >
              <option value="all">Tous domaines</option>
              <option value="Personnel">Personnel / Santé</option>
              <option value="Religieux">Spirituel</option>
              <option value="Professionnel">Professionnel</option>
              <option value="Financier">Financier</option>
              <option value="relations">Relations / Cœur</option>
            </select>
          </div>

          <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-hud)' }}>
            {filteredActions.length} actions trouvées dans le catalogue
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: '60vh', overflowY: 'auto' }}>
            {filteredActions.slice(0, 30).map(act => (
              <div key={act.code} style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid var(--border-cyan-dim)', borderRadius: 6, padding: '8px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1, paddingRight: 8 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{act.action}</div>
                  <div style={{ fontSize: 9, color: 'var(--text-dim)' }}>{act.domaine} • {act.frequence}</div>
                </div>
                <button
                  onClick={() => handleAddActionToTrio(act)}
                  className="btn-monarch"
                  style={{ padding: '4px 6px', fontSize: 9, whiteSpace: 'nowrap' }}
                >
                  + Trio Focus
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

