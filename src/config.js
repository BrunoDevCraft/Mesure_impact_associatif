// ====================================================================
// CONFIGURATION GLOBALE & STRUCTURES DE DONNÉES
// Modèle Générique de Mesure d'Impact Multi-Activités
// VERSION CORRIGÉE - Cohérence stricte des noms
// ====================================================================

const CONFIG = {
  DB_NAME: 'DashboardImpactMultiDB',
  DB_VERSION: 2,
  STORE_NAME: 'settings',
  HANDLE_KEY: 'projectDirectoryHandle',
  
  ACTIVITY_TYPES: [
    'inclusion_numerique',
    'secourisme',
    'accompagnement_social',
    'formation_citoyenne'
  ],
  
  ACTIVITY_LABELS: {
    inclusion_numerique: '💻 Inclusion Numérique',
    secourisme: '🚑 Secourisme',
    accompagnement_social: '🤝 Accompagnement Social',
    formation_citoyenne: '🏛️ Formation Citoyenne'
  },
  
  COLORS: [
    '#007bff', '#28a745', '#17a2b8', '#ffc107',
    '#dc3545', '#6c757d', '#9354e3', '#e35493'
  ],
  
  PHASES: ['avant', 'apres', 'suivi_3mois', 'suivi_6mois'],
  
  PHASE_LABELS: {
    avant: 'Avant (Diagnostic)',
    apres: 'Après (Évaluation immédiate)',
    suivi_3mois: 'Suivi à 3 mois',
    suivi_6mois: 'Suivi à 6 mois'
  },
  
  TRANSVERSAL_FIELDS: [
    'autonomie_percue',
    'confiance_en_soi',
    'integration_sociale',
    'satisfaction_globale',
    'recommandation_nps'
  ]
};

// ====================================================================
// TEMPLATE DE QUESTIONNAIRE GÉNÉRIQUE
// ====================================================================

const QUESTIONNAIRE_TEMPLATE = {
  metadata: {
    activity_type: String,
    questionnaire_phase: String,
    participant_id: String,
    session_id: String,
    timestamp: String
  },
  
  demographics: {
    age: Number,
    genre: String,
    origine: String,
    statut_professionnel: String,
    niveau_etudes: String,
    code_postal: String
  },
  
  activity_specific: {},
  
  transversal_indicators: {
    autonomie_percue: Number,
    confiance_en_soi: Number,
    integration_sociale: Number,
    satisfaction_globale: Number,
    recommandation_nps: Number,
    remarques_ouvertes: String
  }
};

// ====================================================================
// INDICATEURS UNIVERSELS (KPIs TRANSVERSAUX)
// ====================================================================

const UNIVERSAL_KPIS = {
  taux_participation: {
    label: 'Taux de Participation',
    calcul: 'participants_actifs / participants_inscrits',
    format: 'percentage',
    target: 80
  },
  satisfaction_moyenne: {
    label: 'Satisfaction Moyenne',
    calcul: 'moyenne(satisfaction_globale)',
    format: 'score_5',
    target: 4
  },
  nps_score: {
    label: 'Net Promoter Score',
    calcul: '(promoteurs - detracteurs) / total * 100',
    format: 'nps',
    target: 30
  },
  progression_autonomie: {
    label: 'Progression Autonomie',
    calcul: 'autonomie_apres - autonomie_avant',
    format: 'delta',
    target: 1.5
  },
  progression_confiance: {
    label: 'Progression Confiance',
    calcul: 'confiance_apres - confiance_avant',
    format: 'delta',
    target: 1.5
  },
  taux_retention: {
    label: 'Taux de Rétention',
    calcul: 'participants_suivi / participants_initiaux',
    format: 'percentage',
    target: 70
  }
};

// ====================================================================
// ACTIVITÉ 1 : INCLUSION NUMÉRIQUE
// ====================================================================

const INCLUSION_NUMERIQUE_INDICATORS = {
  outputs: {
    nb_ateliers_realises: { label: 'Ateliers Réalisés', type: 'number' },
    nb_heures_formation: { label: 'Heures de Formation', type: 'number' },
    nb_participants_formes: { label: 'Participants Formés', type: 'number' },
    taux_assiduite: { label: "Taux d'Assiduité", type: 'percentage' }
  },
  
  outcomes: {
    competence_navigation_web: { label: 'Navigation Web', type: 'scale_5' },
    competence_email: { label: 'Gestion Email', type: 'scale_5' },
    competence_demarches_admin: { label: 'Démarches Admin', type: 'scale_5' },
    competence_recherche_info: { label: 'Recherche Info', type: 'scale_5' },
    frequence_utilisation_internet: { label: 'Fréquence Usage', type: 'category' },
    confiance_outils_num: { label: 'Confiance Numérique', type: 'scale_5' }
  },
  
  impact: {
    emploi_trouve_grace_num: { label: 'Emploi via Numérique', type: 'boolean' },
    demarches_admin_autonomes: { label: 'Autonomie Admin', type: 'boolean' },
    reduction_isolement: { label: 'Réduction Isolement', type: 'scale_5' },
    transmission_competences: { label: 'Transmission Savoirs', type: 'boolean' }
  }
};

const INCLUSION_NUM_QUESTIONS = {
  avant: [
    {
      id: 'in_q1',
      type: 'select',
      question: 'À quelle fréquence utilisez-vous Internet ?',
      options: ['Jamais', 'Rarement (1x/mois)', 'Hebdomadaire', 'Quotidiennement'],
      indicator: 'frequence_utilisation_internet',
      required: true
    },
    {
      id: 'in_q2',
      type: 'scale_1_5',
      question: 'Comment évaluez-vous votre capacité à naviguer sur Internet ?',
      indicator: 'competence_navigation_web',
      required: true
    },
    {
      id: 'in_q3',
      type: 'scale_1_5',
      question: 'Comment évaluez-vous votre capacité à gérer vos emails ?',
      indicator: 'competence_email',
      required: true
    },
    {
      id: 'in_q4',
      type: 'scale_1_5',
      question: 'Comment évaluez-vous votre capacité à faire des démarches administratives en ligne ?',
      indicator: 'competence_demarches_admin',
      required: true
    },
    {
      id: 'in_q5',
      type: 'scale_1_5',
      question: 'Vous sentez-vous confiant(e) face aux outils numériques ?',
      indicator: 'confiance_outils_num',
      required: true
    }
  ],
  
  apres: [
    {
      id: 'in_q6',
      type: 'number',
      question: 'Combien de démarches administratives avez-vous réalisées seul(e) en ligne depuis la formation ?',
      indicator: 'nb_demarches_realisees_seul',
      required: true
    }
  ],
  
  suivi_6mois: [
    {
      id: 'in_q7',
      type: 'boolean',
      question: 'Ces compétences numériques vous ont-elles aidé à trouver un emploi ?',
      indicator: 'emploi_trouve_grace_num',
      required: true
    },
    {
      id: 'in_q8',
      type: 'boolean',
      question: 'Avez-vous transmis ces compétences à d\'autres personnes ?',
      indicator: 'transmission_competences',
      required: true
    },
    {
      id: 'in_q9',
      type: 'scale_1_5',
      question: 'Vous sentez-vous moins isolé(e) grâce au numérique ?',
      indicator: 'reduction_isolement',
      required: true
    }
  ]
};

// ====================================================================
// ACTIVITÉ 2 : SECOURISME 
// ====================================================================

const SECOURISME_INDICATORS = {
  outputs: {
    nb_formations_psc1: { label: 'Formations PSC1', type: 'number' },
    nb_personnes_certifiees: { label: 'Personnes Certifiées', type: 'number' },
    taux_reussite_examen: { label: 'Taux de Réussite', type: 'percentage' },
    nb_heures_formation: { label: 'Heures Formation', type: 'number' }
  },
  
  outcomes: {
    maitrise_pls: { label: 'Maîtrise PLS', type: 'scale_5' },
    maitrise_rcp: { label: 'Maîtrise RCP', type: 'scale_5' },
    maitrise_dae: { label: 'Maîtrise DAE', type: 'scale_5' },
    confiance_intervention: { label: 'Confiance Intervention', type: 'scale_5' },
    capacite_garder_calme: { label: 'Garder son Calme', type: 'scale_5' }
  },
  
  impact: {
    nb_interventions_reelles: { label: 'Interventions Réelles', type: 'number' },
    intervention_reussie: { label: 'Intervention Efficace', type: 'boolean' },
    formation_entourage: { label: 'Formation Entourage', type: 'boolean' },
    changement_comportement_securite: { label: 'Changement Comportement', type: 'scale_5' }
  }
};

const SECOURISME_QUESTIONS = {
  avant: [
    {
      id: 'sec_q1',
      type: 'boolean',
      question: 'Avez-vous déjà suivi une formation aux premiers secours ?',
      indicator: 'formation_anterieure',
      required: true
    },
    {
      id: 'sec_q2',
      type: 'scale_1_5',
      question: 'Vous sentiriez-vous capable d\'intervenir face à une personne inconsciente ?',
      indicator: 'confiance_intervention',
      required: true
    },
    {
      id: 'sec_q3',
      type: 'scale_1_5',
      question: 'Sauriez-vous comment alerter les secours efficacement ?',
      indicator: 'connaissance_alertes',
      required: true
    },
    {
      id: 'sec_q4',
      type: 'scale_1_5',
      question: 'Vous sentez-vous capable de garder votre calme en situation d\'urgence ?',
      indicator: 'capacite_garder_calme',
      required: true
    }
  ],
  
  apres: [
    {
      id: 'sec_q5',
      type: 'scale_1_5',
      question: 'Comment évaluez-vous votre maîtrise de la Position Latérale de Sécurité (PLS) ?',
      indicator: 'maitrise_pls',
      required: true
    },
    {
      id: 'sec_q6',
      type: 'scale_1_5',
      question: 'Comment évaluez-vous votre maîtrise de la Réanimation Cardio-Pulmonaire (RCP) ?',
      indicator: 'maitrise_rcp',
      required: true
    },
    {
      id: 'sec_q7',
      type: 'scale_1_5',
      question: 'Comment évaluez-vous votre capacité à utiliser un défibrillateur (DAE) ?',
      indicator: 'maitrise_dae',
      required: true
    }
  ],
  
  suivi_6mois: [
    {
      id: 'sec_q8',
      type: 'number',
      question: 'Combien de fois avez-vous dû intervenir pour porter secours depuis la formation ?',
      indicator: 'nb_interventions_reelles',
      required: true
    },
    {
      id: 'sec_q9',
      type: 'boolean',
      question: 'Avez-vous formé ou sensibilisé votre entourage aux gestes de premiers secours ?',
      indicator: 'formation_entourage',
      required: true
    },
    {
      id: 'sec_q10',
      type: 'scale_1_5',
      question: 'Cette formation a-t-elle changé vos comportements de sécurité au quotidien ?',
      indicator: 'changement_comportement_securite',
      required: true
    }
  ]
};

// ====================================================================
// ACTIVITÉ 3 : ACCOMPAGNEMENT SOCIAL
// ====================================================================

const ACCOMPAGNEMENT_SOCIAL_INDICATORS = {
  outputs: {
    nb_personnes_accompagnees: { label: 'Personnes Accompagnées', type: 'number' },
    nb_entretiens_realises: { label: 'Entretiens Réalisés', type: 'number' },
    nb_orientations: { label: 'Orientations', type: 'number' },
    duree_moyenne_accompagnement: { label: 'Durée Moy. (mois)', type: 'number' }
  },
  
  outcomes: {
    comprehension_demarches: { label: 'Compréhension Démarches', type: 'scale_5' },
    capacite_faire_seul: { label: 'Capacité Autonome', type: 'scale_5' },
    connaissance_interlocuteurs: { label: 'Connaissance Acteurs', type: 'scale_5' },
    reduction_stress_admin: { label: 'Réduction Stress', type: 'scale_5' },
    sentiment_ecoute: { label: 'Sentiment Écoute', type: 'scale_5' }
  },
  
  impact: {
    autonomie_demarches: { label: 'Autonomie Démarches', type: 'boolean' },
    situation_stabilisee: { label: 'Situation Stabilisée', type: 'boolean' },
    acces_logement_ameliore: { label: 'Accès Logement', type: 'boolean' },
    acces_emploi: { label: 'Accès Emploi', type: 'boolean' },
    qualite_vie_amelioree: { label: 'Qualité de Vie', type: 'scale_5' }
  }
};

const ACCOMPAGNEMENT_SOCIAL_QUESTIONS = {
  avant: [
    {
      id: 'as_q1',
      type: 'multiselect',
      question: 'Quels sont vos besoins principaux ?',
      options: [
        'Aide administrative',
        'Accès aux droits sociaux',
        'Recherche de logement',
        'Recherche d\'emploi',
        'Accès aux soins',
        'Régularisation de situation',
        'Autre'
      ],
      indicator: 'besoins_initiaux',
      required: true
    },
    {
      id: 'as_q2',
      type: 'scale_1_5',
      question: 'Comprenez-vous les démarches administratives que vous devez effectuer ?',
      indicator: 'comprehension_demarches',
      required: true
    },
    {
      id: 'as_q3',
      type: 'scale_1_5',
      question: 'Vous sentez-vous capable de faire vos démarches seul(e) ?',
      indicator: 'capacite_faire_seul',
      required: true
    }
  ],
  
  apres: [
    {
      id: 'as_q4',
      type: 'number',
      question: 'Combien de vos droits ont été identifiés grâce à l\'accompagnement ?',
      indicator: 'droits_identifies',
      required: true
    },
    {
      id: 'as_q5',
      type: 'scale_1_5',
      question: 'Vous sentez-vous écouté(e) et compris(e) ?',
      indicator: 'sentiment_ecoute',
      required: true
    }
  ],
  
  suivi_6mois: [
    {
      id: 'as_q6',
      type: 'boolean',
      question: 'Êtes-vous désormais autonome dans vos démarches administratives ?',
      indicator: 'autonomie_demarches',
      required: true
    },
    {
      id: 'as_q7',
      type: 'boolean',
      question: 'Votre situation globale s\'est-elle stabilisée ?',
      indicator: 'situation_stabilisee',
      required: true
    },
    {
      id: 'as_q8',
      type: 'scale_1_5',
      question: 'Comment évaluez-vous votre qualité de vie actuelle ?',
      indicator: 'qualite_vie_amelioree',
      required: true
    }
  ]
};

// ====================================================================
// ACTIVITÉ 4 : FORMATION CITOYENNE
// ====================================================================

const FORMATION_CITOYENNE_INDICATORS = {
  outputs: {
    nb_ateliers_realises: { label: 'Ateliers Réalisés', type: 'number' },
    nb_participants: { label: 'Participants', type: 'number' },
    nb_debats_organises: { label: 'Débats Organisés', type: 'number' },
    taux_participation_active: { label: 'Participation Active', type: 'percentage' }
  },
  
  outcomes: {
    connaissance_institutions: { label: 'Connaissance Institutions', type: 'scale_5' },
    comprehension_democratie: { label: 'Compréhension Démocratie', type: 'scale_5' },
    capacite_argumenter: { label: 'Capacité Argumenter', type: 'scale_5' },
    esprit_critique: { label: 'Esprit Critique', type: 'scale_5' },
    ouverture_opinions_differentes: { label: 'Ouverture Opinions', type: 'scale_5' }
  },
  
  impact: {
    participation_elections: { label: 'Participation Élections', type: 'boolean' },
    engagement_associatif: { label: 'Engagement Associatif', type: 'boolean' },
    participation_debats_publics: { label: 'Débats Publics', type: 'boolean' },
    sensibilisation_entourage: { label: 'Sensibilisation Entourage', type: 'boolean' },
    evolution_tolerance: { label: 'Évolution Tolérance', type: 'scale_5' }
  }
};

const FORMATION_CITOYENNE_QUESTIONS = {
  avant: [
    {
      id: 'fc_q1',
      type: 'scale_1_5',
      question: 'Comment évaluez-vous votre connaissance des institutions françaises ?',
      indicator: 'connaissance_institutions',
      required: true
    },
    {
      id: 'fc_q2',
      type: 'scale_1_5',
      question: 'Comment évaluez-vous votre compréhension du fonctionnement démocratique ?',
      indicator: 'comprehension_democratie',
      required: true
    },
    {
      id: 'fc_q3',
      type: 'scale_1_5',
      question: 'Vous sentez-vous capable de défendre votre point de vue dans un débat ?',
      indicator: 'capacite_argumenter',
      required: true
    }
  ],
  
  apres: [
    {
      id: 'fc_q4',
      type: 'scale_1_5',
      question: 'Comment évaluez-vous votre capacité à développer un esprit critique ?',
      indicator: 'esprit_critique',
      required: true
    },
    {
      id: 'fc_q5',
      type: 'scale_1_5',
      question: 'Vous sentez-vous mieux armé(e) pour participer à des débats citoyens ?',
      indicator: 'capacite_debattre',
      required: true
    }
  ],
  
  suivi_6mois: [
    {
      id: 'fc_q6',
      type: 'boolean',
      question: 'Avez-vous participé à des élections depuis la formation ?',
      indicator: 'participation_elections',
      required: true
    },
    {
      id: 'fc_q7',
      type: 'boolean',
      question: 'Vous êtes-vous engagé(e) dans une association ?',
      indicator: 'engagement_associatif',
      required: true
    },
    {
      id: 'fc_q8',
      type: 'scale_1_5',
      question: 'Êtes-vous devenu(e) plus tolérant(e) envers les opinions différentes ?',
      indicator: 'evolution_tolerance',
      required: true
    }
  ]
};

// ====================================================================
// CARTES DE CORRESPONDANCE
// ====================================================================

const INDICATORS_MAP = {
  inclusion_numerique: INCLUSION_NUMERIQUE_INDICATORS,
  secourisme: SECOURISME_INDICATORS,
  accompagnement_social: ACCOMPAGNEMENT_SOCIAL_INDICATORS,
  formation_citoyenne: FORMATION_CITOYENNE_INDICATORS
};

const QUESTIONS_MAP = {
  inclusion_numerique: INCLUSION_NUM_QUESTIONS,
  secourisme: SECOURISME_QUESTIONS,
  accompagnement_social: ACCOMPAGNEMENT_SOCIAL_QUESTIONS,
  formation_citoyenne: FORMATION_CITOYENNE_QUESTIONS
};

// ====================================================================
// EXPORT
// ====================================================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CONFIG,
    QUESTIONNAIRE_TEMPLATE,
    UNIVERSAL_KPIS,
    INDICATORS_MAP,
    QUESTIONS_MAP
  };
}