export type DocumentType = 'photo' | 'signature' | 'pdf' | 'document';

export interface SpecRequirement {
  widthMm?: number;
  heightMm?: number;
  widthPx?: number;
  heightPx?: number;
  minKb: number;
  maxKb: number;
  dpi?: number;
  aspectRatio?: number; // width / height
  bgColors?: string[]; // e.g. ['white', 'blue', 'any']
  formats: string[]; // e.g. ['image/jpeg', 'image/png', 'application/pdf']
  instructions?: string;
}

export interface DocumentSpec {
  id: string;
  name: string;
  type: DocumentType;
  required: boolean;
  spec: SpecRequirement;
}

export interface ApplicationProfile {
  id: string;
  name: string;
  category: 'admissions' | 'exams' | 'government' | 'travel' | 'custom';
  description: string;
  documents: DocumentSpec[];
  effectiveFrom: string;
  effectiveTo?: string;
  sourceUrl?: string;       // Link to official specification/notification
  lastVerifiedDate?: string; // When specs were last verified against official source
}

// Confidence Score — replaces binary PASS/FAIL
export interface ConfidenceBreakdown {
  size: number;       // 0–20 pts
  aspectRatio: number; // 0–15 pts
  dimensions: number;  // 0–15 pts
  background: number;  // 0–20 pts
  sharpness: number;   // 0–15 pts
  face: number;        // 0–15 pts (photos only, always full marks for non-photos)
}

export interface ConfidenceScore {
  overall: number; // 0–100
  label: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  breakdown: ConfidenceBreakdown;
  details: Record<string, string>; // Human-readable explanation per check
}

// Undo stack state entry
export interface UndoState {
  dataUrl: string;
  timestamp: number;
  label: string; // e.g. "Background replaced", "Scale 150%"
  thumbnailUrl: string; // small 80px thumbnail for filmstrip
}

// Threat Ticker — live privacy instrumentation
export interface ThreatTicker {
  diskBytesWritten: number;    // Always 0 — enforced by never calling localStorage/IndexedDB
  externalRequests: number;    // Always 0 — tracked via fetch intercept count
  ramClearsPerformed: number;  // Incremented on every handleWipeSessionMemory call
  lastWipeTimestamp: string | null;
  sessionStartTimestamp: string;
}

export interface ProcessedFile {
  id: string;
  name: string;
  type: string; // mime
  size: number; // in bytes
  dataUrl: string; // base64 representation of data
  width?: number; // px
  height?: number; // px
  originalName: string;
  originalSize: number;
  validated: boolean;
  issues: string[];
  lastModified: number;
  confidenceScore?: ConfidenceScore; // Phase 2: weighted score
}

export interface DeletionLog {
  id: string;
  fileName: string;
  timestamp: string;
  sessionToken: string;
  bufferSizeBytes?: number; // Size of buffer at time of wipe
}

// Face analysis pre-flight result
export interface FaceAnalysisResult {
  faceDetected: boolean;
  issues: FaceIssue[];
  score: number; // 0–100 — used as face sub-score in ConfidenceScore
}

export type FaceIssueType = 
  | 'eyes_closed'
  | 'smile_teeth'
  | 'head_tilt'
  | 'face_not_centered'
  | 'face_too_small'
  | 'face_too_large'
  | 'multiple_faces'
  | 'no_face';

export interface FaceIssue {
  type: FaceIssueType;
  message: string;
  severity: 'warning' | 'error';
}

// Signature consistency check result
export interface SignatureConsistencyResult {
  similarity: number; // 0–100
  verdict: 'consistent' | 'slightly_different' | 'significantly_different';
  message: string;
}

// ── Phase 3: Admission Playbook Engine types ─────────────────────────────────

export interface AdmissionPlaybook {
  id: string;                          // "mh-fyjc-11th"
  title: string;                       // "Maharashtra 11th (FYJC) Admission"
  appliesTo: {
    stage: 'after-10th' | 'after-12th' | 'after-ug' | 'cross-cutting';
    state?: string;                    // "Maharashtra" | undefined = generic/national
    board?: string[];                  // ["SSC", "CBSE", "ICSE"]
  };
  officialPortal: {
    name: string;                      // "mahafyjcadmissions.in"
    url: string;
    sourceUrl: string;                 // article/gov page this was verified against
    lastVerifiedDate: string;          // ISO date — MUST be re-checked each cycle
  };
  steps: PlaybookStep[];
  commonMistakes: string[];
  parentSummary: string;               // one-paragraph plain-language Hindi+English summary
  relatedDocSprintProfiles: string[];  // links into existing Live Rules Engine profile IDs
  disclaimer: string;                  // "Dates shift yearly — always confirm on the official portal before acting."
}

export interface PlaybookStep {
  order: number;
  title: string;                       // "Part 2: Fill College & Stream Preferences"
  description: string;                 // plain-language what-and-why
  timingWindow: string;                // relative language, NOT a hardcoded date
  documentsNeeded: {
    name: string;
    docSprintStudio?: 'photo' | 'signature' | 'pdf' | 'document';
    docSprintProfileId?: string;       // pre-loads the right spec in that studio
    printCopies?: number;
    originalOrPhotocopy: 'original' | 'photocopy' | 'both';
  }[];
  actionType: 'online-form' | 'document-upload' | 'in-person-report' | 'payment' | 'wait';
  tips: string[];
  studyGuide?: {
    syllabus?: string[];
    resources?: string[];
  };
}

export interface FeedbackLog {
  id: string;
  playbookId: string;
  playbookTitle: string;
  timestamp: string;
  suggestedCorrection: string;
  status: 'pending' | 'reviewed';
}

