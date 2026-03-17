# [program] Touch & Consent Research Programme
description: PhD research programme investigating affective touch sensing, privacy-preserving modelling, and relational consent architectures for emotion-AI systems.
status: in-progress

## [project] TouchTales
description: Validated touch as a modality for emotion recognition. Participant-specific touch-only models predicted emotion direction at 65.2±16.3% accuracy (chance 25%), comparably to physiological-signal models. Established care-centred collection protocol.
status: completed
venue: IEEE Transactions on Affective Computing (TAFFC) 2025/2026
contributions:
- Data collection protocol and labelled dataset for TouchTraces and the TMF study
- Evidence that rigorous consent can be supportive, but repetitive check-ins create friction, motivating the Blueprint work on consent fatigue
- Concrete case for dynamic consent architecture from one participant's post-session data deletion request

## [project] TouchTraces
description: Empirical analysis of how pressure, shear, and temporal gradients encode individual emotional signatures and carry biometric identifiability risk. Uses existing TouchTales dataset. Proposes privacy-preserving feature transformations.
status: in-progress
venue: Frontiers in Neuroscience / EuroHaptics 2026 / ACII 2026
rq:
- How do pressure, shear, and temporal gradients encode individual emotional signatures under mild anxiety?
- How do tactile features vary across individuals in emotional expression?
- How do different touch features serve as potential biometric identifiers, and what privacy preservation strategies are required to prevent unintended identification?
contributions:
- Empirical feature analysis of affective touch variation and cross-participant identifiability risk assessment
- Prototype privacy-preserving feature transformations and sensitivity scoring matrix
- Ethical and technical implications for consent in affective touch datasets, motivating Projects 3 and 4

### [subproject] AMP Case Study
description: The Affective Modeling Pipeline case study within Beauty and the Beagle. Evaluates how Missing Links design recommendations perform on an affective touch analysis pipeline. Developer building and documenting the AMP case; co-analyzing data across both case studies.
status: in-progress
authorRole: Developer and co-analyst

## [threadhub] Blueprint: Relational Consent Framework
description: Interdisciplinary framework for consent in emotion-AI systems integrating psychology, law, UX design, and care ethics. A vertical that both receives input from and feeds into all other projects. Workshop paper in preparation.
status: planned
venue: CS + Law workshop → FAccT / CSCW workshop
rq:
- What are appropriate consent models when willingness to consent changes over time?
- What ownership do participants have over a model personalised with their data?
- How can accountability and repair be operationalised across disciplinary boundaries?
- How to handle selective erasure, local model running, and varying levels of participant technical expertise?

## [project] Technical Infrastructure and Consent Architecture
description: Comprehensive stage-wise consent architecture spanning pre-collection, interaction-time negotiation, and post-collection rights. Integrates TouchTraces privacy findings with the Blueprint relational framework.
status: planned
venue: CHI 2027 / ACII 2027
contributions:
- Multi-stage consent architecture supporting negotiation, scope limitation, partial withdrawal, and right-to-erasure propagation across derived models
- Reproducibility and audit-trail schema: versioned consent logs, selective redaction APIs, and consent-provenance metadata for computational pipelines
- Design taxonomy of consent interaction patterns (adaptive prompts, consent dashboards, fatigue-mitigation heuristics)

### [subproject] Multi-Stage Consent Architecture
description: Stage-wise consent spanning pre-collection, interaction-time negotiation, and post-collection rights, embedding GDPR-style right to erasure, IRB policies, and participant-centred consent contracts.
status: not-started

### [subproject] Reproducibility and Audit Trail
description: Versioned consent logs, selective redaction APIs, and consent-provenance metadata enabling scientific reproducibility under dynamic consent and transparent tracking of consent changes.
status: not-started

### [subproject] Consent Interaction Design
description: Adaptive non-intrusive prompting patterns, consent dashboards, and fatigue-mitigation heuristics ensuring consent remains an ongoing process without inducing consent fatigue.
status: not-started

## [project] Evaluation of Consent-as-Collaboration
description: Implements the Project 3 framework in a simulated or real emotion-AI deployment. Evaluates user trust, data quality, and model reproducibility. Aims to produce an open-source toolkit for broader community adoption.
status: planned
venue: TAFFC / CHI 2028
rq:
- How do people experience ongoing consent for touch-based emotion-AI data, and what dimensions of trust, agency, and fairness emerge when they can renegotiate or revoke data contributions?
- How do participant-driven data modifications affect model validity and reproducibility, and what strategies enable ethical research continuity under dynamic consent?
- Which interaction patterns best support a felt sense of agency and safety?
contributions:
- User study examining how participants negotiate ongoing consent when sharing affective touch data
- Empirical analysis of how consent-driven data changes affect model performance and reproducibility
- Recommendations and tools (consent-log manager, audit scripts) for broader use in emotion AI and HCI research

## [collaboration] Reproducibility Thread
description: Methodological scaffolding for how the consent-aware pipeline is built and evaluated. Role across three papers: co-authored REP position paper, helped run participant studies and analyse data for interview study, building AMP case study and co-analyzing data for longitudinal evaluation.
status: in-progress
authorRole: 2nd author on all

### [publication] Raising the Reproducibility Bar
description: Position paper arguing for comprehensibility as a goal of reproducibility. Proposes the reproducibility support taxonomy (obtain, provision, re-execute, verify, comprehend). Directly informs the audit-trail design in Project 3.
status: completed
venue: ACM REP 2025
authorRole: Co-author

### [publication] Missing Links / Embracing Emergence
description: Interview study (N=15) surfacing how data science practitioners' tools fail to capture evolving mental models, creating friction. Produces design recommendations: capture trajectory not state, multi-layered visibility, bridge exploration to publication. Tested in Beauty and the Beagle.
status: submitted
authorRole: Co-author

### [publication] Beauty and the Beagle
description: Longitudinal multiple case study evaluating the Missing Links recommendations across two cases: museum specimen digitization (BMDT) and the affective modeling pipeline (AMP). Produces refined recommendations that also inform Project 3 evaluation design.
status: in-progress
authorRole: Co-author and AMP case developer

## [collaboration] Sensing and Touch Collaborations
description: Empirical and theoretical foundations for touch-based affective sensing and the ecological validity of touch as a modality for emotion regulation.
status: in-progress

### [publication] ShearSense
description: Validated soft capacitive sensor array (LLShear) measuring normal pressure and 2D shear. Showed shear carries substantial emotion and identity information. Sensor used in TouchTraces data collection.
status: completed
venue: UIST 2024
authorRole: 3rd author

### [publication] Goalless Touch and TMF
description: Touch Maintenance Framework for fidgeting as self-regulation. Data collected in parallel with TouchTraces sessions. Positions fidgeting as a structured, analyzable activity with longitudinal gestural markers of shifting affective state.
status: planned
venue: EuroHaptics 2026
authorRole: 1st author

### [publication] Tactile Comfort Objects
description: Expands the landscape of touch-mediated affect regulation beyond purposive gestures. Informs the ecological validity of touch-based emotion sensing in naturalistic contexts.
status: completed
venue: CHI 2026
authorRole: 4th author

## [threadhub] Research Values
description: Foundational philosophical and ethical commitments permeating all projects in the programme.
status: in-progress

### [annotation] Enactivism
description: Cognition and consent are dynamic, embodied processes enacted within relationships. The consent architecture in this thesis is not a one-and-done checkbox, but a live adaptable process evolving with each new encounter or shift in relationship conditions.
status: in-progress

### [annotation] Collaborative Consent
description: Drawing from Dossie Easton: consent as an active collaboration for the well-being of all concerned. A felt, embodied sense of safety and inclusion for each participant, researcher, and system at every stage of data collection and use.
status: in-progress

### [annotation] Emotion as Constructed
description: Affective experiences are not merely detected but emergent from the participant's own meaning-making, bodily context, and relational situation. Computational models scaffold each person's interpretative process, centring self-report as ground truth.
status: in-progress

### [annotation] Reproducibility as Collaboration
description: Knowledge is always partial, situated, and open to collective reinterpretation. Research should be a sharable object supporting open scrutiny and enabling others to collaboratively build, repair, and contest claims as new perspectives emerge.
status: in-progress
