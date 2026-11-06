import React, { useState, useMemo } from 'react';
import { 
  Target, AlertOctagon, Plus, Lock, Unlock, CheckCircle2, 
  Clock, Calendar, Search, Sparkles, ArrowRight, ShieldCheck, 
  Trash2, ChevronRight, Layers, DollarSign, Edit3, X, Check,
  Briefcase, Heart, Flame, BookOpen, Landmark, FolderPlus, Flag
} from 'lucide-react';
import { sound } from '../core/sound.js';
import { formatFCFA } from '../core/financeEngine.js';
import { ACTIONS } from '../data/actionsData.js';

const LIFE_AREAS = [
  { id: 'all', label: 'Tous', icon: Target },
  { id: 'finances', label: 'Finances', icon: DollarSign },
  { id: 'carriere', label: 'Carrière & Business', icon: Briefcase },
  { id: 'sante', label: 'Santé & Vitalité', icon: Heart },
  { id: 'famille', label: 'Couple & Famille', icon: Heart },
  { id: 'spirituel', label: 'Spiritualité', icon: Flame },
  { id: 'dev_perso', label: 'Dév. Personnel', icon: BookOpen },
  { id: 'patrimoine', label: 'Patrimoine', icon: Landmark }
];

const PRIORITY_OPTIONS = ['CRITIQUE', 'HAUTE', 'MOYENNE', 'FAIBLE'];
const STATUS_OPTIONS = ['A_PLANIFIER', 'PLANIFIE', 'EN_COURS', 'BLOQUE', 'TERMINE'];

export default function ProjectsView({
  lifeGoals = [],
  onAddLifeGoal,
  onUpdateLifeGoal,
  onDeleteLifeGoal,
  activeProjects = [],
  onSaveProject,
  onAddProject,
  onDeleteProject,
  businessProjects = [],
  onToggleBusinessStep,
  ideasVault = [],
  onAddIdea,
  onDeleteIdea,
  spacedRecurrences = [],
  onCompleteRecurrence,
  focusTrio = [],
  onSetFocusTrio,
  onAddXp,
  theme
}) {
  const [activeSubTab, setActiveSubTab] = useState('goals'); // 'goals', 'mk3', 'donjons', 'idees', 'evolution'
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [warningMessage, setWarningMessage] = useState('');

  // Life Goal Modal / Form state
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState(null);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalArea, setGoalArea] = useState('finances');
  const [goalYear, setGoalYear] = useState(new Date().getFullYear());
  const [goalPriority, setGoalPriority] = useState('HAUTE');
  const [goalStatus, setGoalStatus] = useState('EN_COURS');
  const [goalTargetDate, setGoalTargetDate] = useState('');
  const [goalBudget, setGoalBudget] = useState('');
  const [goalProgress, setGoalProgress] = useState(0);

  // MK 3 Projects Form state
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCategory, setNewProjectCategory] = useState('Business');

  // Idea Quarantine Form state
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaNotes, setNewIdeaNotes] = useState('');

  // 141 Actions Catalog Search
  const [actionSearch, setActionSearch] = useState('');
  const [actionDomain, setActionDomain] = useState('all');

  // Filtered Life Goals
  const filteredGoals = useMemo(() => {
    return (lifeGoals || []).filter(g => {
      const matchArea = selectedArea === 'all' || g.area === selectedArea;
      const matchStatus = selectedStatus === 'all' || g.status === selectedStatus;
      return matchArea && matchStatus;
    });
  }, [lifeGoals, selectedArea, selectedStatus]);

  // Goal Form Handlers
  const handleOpenGoalModal = (goal = null) => {
    sound.playClick();
    if (goal) {
      setEditingGoalId(goal.id);
      setGoalTitle(goal.title || '');
      setGoalDesc(goal.description || '');
      setGoalArea(goal.area || 'finances');
      setGoalYear(goal.year || new Date().getFullYear());
      setGoalPriority(goal.priority || 'HAUTE');
      setGoalStatus(goal.status || 'EN_COURS');
      setGoalTargetDate(goal.targetDate || '');
      setGoalBudget(goal.budget ? String(goal.budget) : '');
      setGoalProgress(goal.progress || 0);
    } else {
      setEditingGoalId(null);
      setGoalTitle('');
      setGoalDesc('');
      setGoalArea('finances');
      setGoalYear(new Date().getFullYear());
      setGoalPriority('HAUTE');
      setGoalStatus('EN_COURS');
      setGoalTargetDate('');
      setGoalBudget('');
      setGoalProgress(0);
    }
    setShowGoalModal(true);
  };

  const handleSaveGoal = () => {
    if (!goalTitle.trim()) return;
    sound.playQuestComplete();
    const goalPayload = {
      id: editingGoalId || 'goal_' + Date.now(),
      title: goalTitle.trim(),
      description: goalDesc.trim(),
      area: goalArea,
      year: parseInt(goalYear, 10) || new Date().getFullYear(),
      priority: goalPriority,
      status: goalStatus,
      targetDate: goalTargetDate,
      budget: goalBudget ? parseInt(goalBudget, 10) : null,
      progress: parseInt(goalProgress, 10) || 0
    };

    if (editingGoalId && onUpdateLifeGoal) {
      onUpdateLifeGoal(goalPayload);
    } else if (onAddLifeGoal) {
      onAddLifeGoal(goalPayload);
      onAddXp(15, 'INT');
    }
    setShowGoalModal(false);
  };

  // MK Projects Handlers
  const handleAddProject = () => {
    if (!newProjectName.trim()) return;
    if (activeProjects.length >= 3) {
      sound.playAlarm();
      setWarningMessage("RÈGLE STRICTE R1 : Tu as déjà 3 chantiers ouverts ! Termine ou archive un projet avant d'en démarrer un nouveau.");
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

  // Idea Quarantine Handlers
  const handleAddIdea = () => {
    if (!newIdeaTitle.trim()) return;
    sound.playClick();
    const nextMonth = new Date();
    nextMonth.setDate(nextMonth.getDate() + 30);
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

  // Habit Focus Trio Add
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

  const filteredActions = useMemo(() => {
    return (ACTIONS || []).filter(a => {
      const matchesSearch = !actionSearch || a.action.toLowerCase().includes(actionSearch.toLowerCase()) || a.sous_domaine?.toLowerCase().includes(actionSearch.toLowerCase());
      const matchesDomain = actionDomain === 'all' || a.domaine?.includes(actionDomain);
      return matchesSearch && matchesDomain;
    });
  }, [actionSearch, actionDomain]);

  return (
    <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '100%', boxSizing: 'border-box' }} className="animate-float">
      
      {/* Sub Tabs Capsule Bar */}
      <div className="pill-tabs-bar" style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        {[
          { id: 'goals', label: `🎯 OBJECTIFS (${(lifeGoals || []).length})` },
          { id: 'mk3', label: `⚡ 3 PROJETS (${(activeProjects || []).length}/3)` },
          { id: 'donjons', label: '🏰 5 DONJONS BIZ' },
          { id: 'idees', label: `🔒 QUARANTAINE (${(ideasVault || []).length})` },
          { id: 'evolution', label: '🚀 141 ACTIONS' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => { sound.playClick(); setActiveSubTab(tab.id); }}
            className={`pill-tab ${activeSubTab === tab.id ? 'active' : ''}`}
            style={{
              padding: '6px 12px',
              fontSize: 10,
              fontFamily: 'var(--font-hud)',
              fontWeight: 700,
              borderRadius: 20,
              border: `1px solid ${activeSubTab === tab.id ? 'var(--border-cyan)' : 'rgba(255,255,255,0.08)'}`,
              background: activeSubTab === tab.id ? 'rgba(0, 217, 255, 0.16)' : 'rgba(255,255,255,0.03)',
              color: activeSubTab === tab.id ? 'var(--border-cyan)' : 'var(--text-muted)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {warningMessage && (
        <div className="omni-card" style={{ borderColor: 'var(--accent-red)', background: 'rgba(239, 68, 68, 0.08)', padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-red)', fontWeight: 700, fontSize: 11 }}>
            <AlertOctagon size={16} /> {warningMessage}
          </div>
        </div>
      )}

      {/* ========================================================
          1. OBJECTIFS DE VIE (LIFEOS GOALS)
         ======================================================== */}
      {activeSubTab === 'goals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          
          {/* Header Action Bar */}
          <div className="omni-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)', letterSpacing: 0.5 }}>
                OBJECTIFS STRATÉGIQUES DE VIE
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Alignement par domaine : Santé, Carrière, Finances, Foyer & Patrimoine
              </div>
            </div>
            <button
              onClick={() => handleOpenGoalModal()}
              className="haptic-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'linear-gradient(135deg, var(--neon-cyan), var(--electric-blue))',
                color: '#000',
                fontWeight: 800,
                fontSize: 11,
                padding: '6px 12px',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Plus size={14} /> Nouvel Objectif
            </button>
          </div>

          {/* Area Filters */}
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            {LIFE_AREAS.map(area => {
              const isSelected = selectedArea === area.id;
              return (
                <button
                  key={area.id}
                  onClick={() => { sound.playClick(); setSelectedArea(area.id); }}
                  style={{
                    padding: '4px 10px',
                    fontSize: 10,
                    borderRadius: 14,
                    border: `1px solid ${isSelected ? 'var(--neon-cyan)' : 'rgba(255,255,255,0.06)'}`,
                    background: isSelected ? 'rgba(0,217,255,0.15)' : 'rgba(0,0,0,0.2)',
                    color: isSelected ? 'var(--neon-cyan)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {area.label}
                </button>
              );
            })}
          </div>

          {/* Goals List */}
          {filteredGoals.length === 0 ? (
            <div className="omni-card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              <Target size={36} style={{ margin: '0 auto 10px auto', opacity: 0.3 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>Aucun objectif enregistré dans ce domaine</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Cliquez sur « Nouvel Objectif » pour formaliser vos ambitions stratégiques.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredGoals.map(goal => {
                const priorityColor = goal.priority === 'CRITIQUE' ? 'var(--accent-red)' : goal.priority === 'HAUTE' ? 'var(--neon-gold)' : 'var(--neon-cyan)';
                return (
                  <div key={goal.id} className="omni-card" style={{ padding: '12px 14px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                          <span style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: `${priorityColor}22`,
                            color: priorityColor,
                            border: `1px solid ${priorityColor}55`
                          }}>
                            {goal.priority}
                          </span>
                          <span style={{
                            fontSize: 9,
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 4,
                            background: 'rgba(255,255,255,0.05)',
                            color: 'var(--text-muted)'
                          }}>
                            {goal.area?.toUpperCase()}
                          </span>
                          <span style={{
                            fontSize: 9,
                            fontWeight: 800,
                            color: goal.status === 'TERMINE' ? 'var(--neon-green)' : 'var(--electric-blue)'
                          }}>
                            {goal.status}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>
                          {goal.title}
                        </div>
                        {goal.description && (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                            {goal.description}
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          onClick={() => handleOpenGoalModal(goal)}
                          className="haptic-btn"
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                        >
                          <Edit3 size={14} />
                        </button>
                        {onDeleteLifeGoal && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Supprimer l'objectif « ${goal.title} » ?`)) {
                                onDeleteLifeGoal(goal.id);
                              }
                            }}
                            className="haptic-btn"
                            style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: 4 }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Target Data */}
                    <div style={{ marginTop: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                        <span>Progression : {goal.progress || 0}%</span>
                        {goal.budget && <span>Budget : {formatFCFA(goal.budget)}</span>}
                      </div>
                      <div className="progress-bar-hud" style={{ height: 6, borderRadius: 3 }}>
                        <div
                          className="progress-fill-hud"
                          style={{
                            width: `${Math.min(100, Math.max(0, goal.progress || 0))}%`,
                            background: goal.progress >= 100 ? 'var(--neon-green)' : 'linear-gradient(90deg, var(--neon-cyan), var(--electric-blue))'
                          }}
                        />
                      </div>
                      {goal.targetDate && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text-dim)', marginTop: 6 }}>
                          <Clock size={11} /> Échéance : {goal.targetDate}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          2. LES 3 PROJETS STRICTS (SYSTÈME MK)
         ======================================================== */}
      {activeSubTab === 'mk3' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="omni-card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--neon-cyan)', letterSpacing: 0.5 }}>
                RÈGLE R1 : 3 CHANTIERS ACTIFS MAXIMUM
              </span>
              <span style={{ fontSize: 11, fontWeight: 900, color: (activeProjects || []).length >= 3 ? 'var(--accent-red)' : 'var(--neon-green)' }}>
                {(activeProjects || []).length} / 3 SLOTS
              </span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: 0 }}>
              Pour garantir une exécution chirurgicale, votre bande passante cognitive ne doit jamais être dispersée sur plus de 3 projets simultanés.
            </p>
          </div>

          {/* Formulaire nouveau projet si slot disponible */}
          {(activeProjects || []).length < 3 && (
            <div className="omni-card" style={{ padding: '12px 14px' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--neon-cyan)', marginBottom: 8 }}>
                + OUVRIR UN NOUVEAU PROJET ACTIF
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="Nom du projet concret (ex: Lancement Offre KDP)" 
                  value={newProjectName} 
                  onChange={(e) => setNewProjectName(e.target.value)} 
                  style={{
                    flex: 2,
                    minWidth: 160,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    color: 'var(--text-main)',
                    fontSize: 11
                  }} 
                />
                <select 
                  value={newProjectCategory} 
                  onChange={(e) => setNewProjectCategory(e.target.value)} 
                  style={{
                    flex: 1,
                    minWidth: 100,
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 6,
                    padding: '8px 10px',
                    color: 'var(--text-main)',
                    fontSize: 11
                  }}
                >
                  <option value="Business">Business</option>
                  <option value="Compétences">Compétences</option>
                  <option value="Foyer">Foyer</option>
                  <option value="Santé">Santé</option>
                </select>
                <button 
                  onClick={handleAddProject} 
                  className="haptic-btn" 
                  style={{
                    padding: '8px 14px',
                    background: 'linear-gradient(135deg, var(--neon-cyan), var(--electric-blue))',
                    color: '#000',
                    fontWeight: 800,
                    fontSize: 11,
                    borderRadius: 6,
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} /> Activer
                </button>
              </div>
            </div>
          )}

          {/* Liste des projets actifs */}
          {(activeProjects || []).length === 0 ? (
            <div className="omni-card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              <Layers size={36} style={{ margin: '0 auto 10px auto', opacity: 0.3 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>Aucun projet en cours</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Activez un projet concret ou importez un Donjon Business ci-dessous.</div>
            </div>
          ) : (
            (activeProjects || []).map(p => (
              <div key={p.id} className="omni-card" style={{ padding: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div>
                    <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--neon-cyan)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      [{p.category || 'GÉNÉRAL'}]
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                      {p.name}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (window.confirm(`Clôturer ou archiver le projet « ${p.name} » ?`)) {
                        onDeleteProject(p.id);
                        onAddXp(20, 'INT');
                      }
                    }}
                    className="haptic-btn"
                    style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: 4 }}
                    title="Archiver ce projet"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <div style={{ background: 'rgba(0,0,0,0.25)', borderRadius: 6, padding: '8px 10px', margin: '8px 0', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', textTransform: 'uppercase' }}>Prochaine Action Concrète :</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--neon-green)', marginTop: 2 }}>
                    ➔ {p.nextStep || 'Définir la prochaine étape'}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
                  <span>Progression globale</span>
                  <span style={{ fontWeight: 800, color: 'var(--neon-cyan)' }}>{p.progress || 0}%</span>
                </div>
                <div className="progress-bar-hud" style={{ height: 6, borderRadius: 3 }}>
                  <div 
                    className="progress-fill-hud" 
                    style={{ 
                      width: `${p.progress || 0}%`,
                      background: 'linear-gradient(90deg, var(--neon-cyan), var(--electric-blue))'
                    }} 
                  />
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  {[25, 50, 75, 100].map(val => (
                    <button
                      key={val}
                      onClick={() => {
                        sound.playClick();
                        onSaveProject({ ...p, progress: val });
                        if (val === 100) {
                          sound.playQuestComplete();
                          onAddXp(50, 'INT');
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: '4px 0',
                        fontSize: 9,
                        fontWeight: 700,
                        borderRadius: 4,
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: p.progress === val ? 'rgba(0,217,255,0.2)' : 'rgba(0,0,0,0.3)',
                        color: p.progress === val ? 'var(--neon-cyan)' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================
          3. 5 DONJONS BUSINESS (SOLO LEVELING)
         ======================================================== */}
      {activeSubTab === 'donjons' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="omni-card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--neon-purple)', letterSpacing: 0.5 }}>
              PORTAILS BUSINESS DU MONARQUE
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Chaque donjon représente un pôle d'expansion financière avec ses étapes clés à conquérir.
            </p>
          </div>

          {(businessProjects || []).map(dungeon => {
            const completedCount = (dungeon.steps || []).filter(s => s.completed).length;
            const totalSteps = (dungeon.steps || []).length;
            const progress = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
            return (
              <div key={dungeon.id} className="omni-card" style={{ padding: '14px', borderLeft: '3px solid var(--neon-purple)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 9, fontWeight: 900, color: 'var(--neon-purple)', letterSpacing: 1 }}>
                      RANG {dungeon.rank || 'A'} • DONJON
                    </span>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text-main)', marginTop: 2 }}>
                      {dungeon.name}
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--neon-cyan)' }}>
                    {progress}%
                  </span>
                </div>

                <div className="progress-bar-hud" style={{ height: 4, borderRadius: 2, marginBottom: 10 }}>
                  <div className="progress-fill-hud" style={{ width: `${progress}%`, background: 'var(--neon-purple)' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(dungeon.steps || []).map(step => (
                    <div
                      key={step.id}
                      onClick={() => onToggleBusinessStep && onToggleBusinessStep(dungeon.id, step.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '6px 8px',
                        borderRadius: 6,
                        background: step.completed ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${step.completed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.04)'}`,
                        cursor: 'pointer'
                      }}
                    >
                      <CheckCircle2 size={14} color={step.completed ? 'var(--neon-green)' : 'var(--text-dim)'} />
                      <span style={{
                        fontSize: 11,
                        color: step.completed ? 'var(--text-muted)' : 'var(--text-main)',
                        textDecoration: step.completed ? 'line-through' : 'none',
                        flex: 1
                      }}>
                        {step.text}
                      </span>
                      <span style={{ fontSize: 9, color: 'var(--neon-purple)', fontWeight: 700 }}>+10 XP</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================
          4. QUARANTAINE DES IDÉES 30 JOURS (SYSTÈME MK)
         ======================================================== */}
      {activeSubTab === 'idees' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="omni-card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--neon-gold)', fontWeight: 800, fontSize: 12 }}>
              <Lock size={16} /> SAS DE QUARANTAINE COGNITIVE (30 JOURS)
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Le syndrome de l'objet brillant détruit la discipline. Déposez vos nouvelles idées ici : elles restent verrouillées 30 jours. Si elles vous obsèdent encore après un mois, elles méritent d'être étudiées.
            </p>
          </div>

          {/* Formulaire ajout idée */}
          <div className="omni-card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--neon-gold)', marginBottom: 8 }}>
              + METTRE UNE NOUVELLE IDÉE EN QUARANTAINE
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="text"
                placeholder="Titre de l'idée (ex: Nouvelle appli de livraison bio)"
                value={newIdeaTitle}
                onChange={(e) => setNewIdeaTitle(e.target.value)}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  color: 'var(--text-main)',
                  fontSize: 11
                }}
              />
              <textarea
                placeholder="Détails, intuitions ou notes rapides..."
                value={newIdeaNotes}
                onChange={(e) => setNewIdeaNotes(e.target.value)}
                rows={2}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 6,
                  padding: '8px 10px',
                  color: 'var(--text-main)',
                  fontSize: 11,
                  resize: 'none'
                }}
              />
              <button
                onClick={handleAddIdea}
                className="haptic-btn"
                style={{
                  alignSelf: 'flex-start',
                  padding: '8px 14px',
                  background: 'linear-gradient(135deg, var(--neon-gold), #f59e0b)',
                  color: '#000',
                  fontWeight: 800,
                  fontSize: 11,
                  borderRadius: 6,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Lock size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} /> Verrouiller pour 30 jours
              </button>
            </div>
          </div>

          {/* Liste des idées en quarantaine */}
          {(ideasVault || []).length === 0 ? (
            <div className="omni-card" style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)' }}>
              <Lock size={36} style={{ margin: '0 auto 10px auto', opacity: 0.3 }} />
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>Aucune idée en quarantaine</div>
              <div style={{ fontSize: 11, marginTop: 4 }}>Votre esprit est concentré sur les chantiers actifs prioritaires.</div>
            </div>
          ) : (
            (ideasVault || []).map(idea => {
              const isLocked = new Date(idea.lockedUntil) > new Date();
              return (
                <div key={idea.id} className="omni-card" style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {isLocked ? <Lock size={13} color="var(--neon-gold)" /> : <Unlock size={13} color="var(--neon-green)" />}
                        <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-main)' }}>{idea.title}</span>
                      </div>
                      {idea.notes && (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{idea.notes}</div>
                      )}
                      <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 6 }}>
                        Capturée le {idea.capturedAt || idea.dateAdded} • {isLocked ? `Verrouillée jusqu'au ${idea.lockedUntil}` : 'Période de quarantaine terminée'}
                      </div>
                    </div>
                    {onDeleteIdea && (
                      <button
                        onClick={() => onDeleteIdea(idea.id)}
                        className="haptic-btn"
                        style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer', padding: 4 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================
          5. 141 ACTIONS STRATÉGIQUES (ÉVOLUTION)
         ======================================================== */}
      {activeSubTab === 'evolution' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="omni-card" style={{ padding: '12px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--neon-green)', letterSpacing: 0.5 }}>
              CATALOGUE DES 141 ACTIONS & RÉCURRENCES
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Sélectionnez des actions éprouvées pour alimenter votre Focus Trio ou suivez vos récurrences espacées.
            </p>
          </div>

          {/* Recherche & Filtres */}
          <div style={{ display: 'flex', gap: 6 }}>
            <input
              type="text"
              placeholder="Rechercher une action neuro-ergonomique..."
              value={actionSearch}
              onChange={(e) => setActionSearch(e.target.value)}
              style={{
                flex: 1,
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                padding: '8px 10px',
                color: 'var(--text-main)',
                fontSize: 11
              }}
            />
          </div>

          {/* Liste des actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
            {filteredActions.slice(0, 30).map(act => (
              <div
                key={act.code}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                <div>
                  <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--neon-cyan)' }}>[{act.domaine}]</span>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginTop: 2 }}>
                    {act.action}
                  </div>
                </div>
                <button
                  onClick={() => handleAddActionToTrio(act)}
                  className="haptic-btn"
                  style={{
                    padding: '4px 8px',
                    fontSize: 10,
                    fontWeight: 700,
                    background: 'rgba(0, 217, 255, 0.1)',
                    color: 'var(--neon-cyan)',
                    border: '1px solid rgba(0, 217, 255, 0.3)',
                    borderRadius: 6,
                    cursor: 'pointer'
                  }}
                >
                  + Au Trio
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL DE CRÉATION / ÉDITION D'OBJECTIF DE VIE
         ======================================================== */}
      {showGoalModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          zIndex: 9999
        }}>
          <div className="omni-card" style={{ width: '100%', maxWidth: 440, padding: 18, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--neon-cyan)' }}>
                {editingGoalId ? 'Modifier l’Objectif' : 'Nouvel Objectif de Vie'}
              </div>
              <button
                onClick={() => setShowGoalModal(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>TITRE DE L'OBJECTIF</label>
                <input
                  type="text"
                  placeholder="ex: Constituer 6 mois de fonds de réserve"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 12, boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>DESCRIPTION / MOTIVATION</label>
                <textarea
                  rows={2}
                  placeholder="Pourquoi cet objectif est vital..."
                  value={goalDesc}
                  onChange={(e) => setGoalDesc(e.target.value)}
                  style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box', resize: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>DOMAINE</label>
                  <select
                    value={goalArea}
                    onChange={(e) => setGoalArea(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11 }}
                  >
                    {LIFE_AREAS.filter(a => a.id !== 'all').map(a => (
                      <option key={a.id} value={a.id}>{a.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>PRIORITÉ</label>
                  <select
                    value={goalPriority}
                    onChange={(e) => setGoalPriority(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11 }}
                  >
                    {PRIORITY_OPTIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>STATUT</label>
                  <select
                    value={goalStatus}
                    onChange={(e) => setGoalStatus(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11 }}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>PROGRESSION (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={goalProgress}
                    onChange={(e) => setGoalProgress(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>BUDGET CIBLE (FCFA)</label>
                  <input
                    type="number"
                    placeholder="ex: 1500000"
                    value={goalBudget}
                    onChange={(e) => setGoalBudget(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 10, color: 'var(--text-dim)', display: 'block', marginBottom: 4 }}>DATE CIBLE</label>
                  <input
                    type="date"
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, color: '#fff', fontSize: 11, boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  onClick={() => setShowGoalModal(false)}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'var(--text-muted)',
                    borderRadius: 6,
                    border: 'none',
                    fontWeight: 700,
                    fontSize: 11,
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveGoal}
                  style={{
                    flex: 1,
                    padding: '10px 0',
                    background: 'linear-gradient(135deg, var(--neon-cyan), var(--electric-blue))',
                    color: '#000',
                    borderRadius: 6,
                    border: 'none',
                    fontWeight: 800,
                    fontSize: 11,
                    cursor: 'pointer'
                  }}
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
