# 🏛️ DocSprint — Technical Architecture Specification

## 1. Architectural Philosophy

**DocSprint** is architected as an **in-browser, zero-server document engineering workstation**. The primary technical goal is to process, compress, format, and encrypt sensitive identity documents entirely within client memory without a single byte escaping to external cloud infrastructure.

### Guiding Principles
1. **Zero-Retention Memory Sandbox**: Data flows strictly through ephemeral typed arrays (`Uint8Array`, `ArrayBuffer`, `ImageData`) that are reclaimed via browser garbage collection upon session completion.
2. **Sub-Second Execution**: Complex image filtering (Otsu thresholding, Laplacian edge filtering, bicubic resampling) and PDF transformations execute in <500ms using HTML5 2D Canvas and WebAssembly.
3. **Cryptographic Self-Sovereignty**: When users choose to persist files locally, sensitive documents are encrypted with **AES-256-GCM** using keys derived via **PBKDF2** (100,000 iterations), ensuring even browser storage dumps cannot be decrypted without the user passphrase.
4. **Declarative Specification Engine**: Rules for 70+ entrance examinations are maintained as pure immutable data matrices, allowing instant compliance scoring without brittle UI coupling.

---

## 2. High-Level Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             BROWSER RUNTIME                                 │
│                                                                             │
│   ┌────────────────────────┐                   ┌────────────────────────┐   │
│   │   User File Input      │                   │   Command Palette &    │   │
│   │   (Image, PDF, Scan)   │                   │   Interactive Studios  │   │
│   └───────────┬────────────┘                   └───────────▲────────────┘   │
│               │                                            │                │
│               ▼ [File.arrayBuffer() / URL.createObjectURL]  │ Events / State │
│   ┌────────────────────────────────────────────────────────┴────────────┐   │
│   │                    Ephemeral In-Memory RAM Buffer                   │   │
│   │                       (0 Bytes Network Egress)                      │   │
│   └───────┬───────────────────────────┬──────────────────────────┬──────┘   │
│           │                           │                          │          │
│           ▼                           ▼                          ▼          │
│   ┌───────────────┐           ┌───────────────┐          ┌───────────────┐  │
│   │  Canvas 2D    │           │    PDF-Lib    │          │ Web Crypto    │  │
│   │  Image Engine │           │  WASM Engine  │          │ SubtleCrypto  │  │
│   │               │           │               │          │               │  │
│   │ • Resampling  │           │ • Merge/Split │          │ • PBKDF2 Key  │  │
│   │ • Otsu Thresh │           │ • Compression │          │ • AES-256-GCM │  │
│   │ • Whitening   │           │ • Reordering  │          │ • IndexedDB   │  │
│   │ • Face Detect │           │ • Watermark   │          │   Persistence │  │
│   └───────┬───────┘           └───────┬───────┘          └───────┬───────┘  │
│           │                           │                          │          │
│           └───────────────────────────┼──────────────────────────┘          │
│                                       │                                     │
│                                       ▼                                     │
│                       ┌───────────────────────────────┐                     │
│                       │  Processed Output Artifact    │                     │
│                       │  (Instant Client Download)    │                     │
│                       └───────────────────────────────┘                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Core Processing Pipelines

### 3.1 Biometric Photo Studio Pipeline
Located in [`src/components/PhotoStudio.tsx`](file:///d:/docsprint/src/components/PhotoStudio.tsx) and [`src/utils/faceAnalysis.ts`](file:///d:/docsprint/src/utils/faceAnalysis.ts):
1. **Source Loading**: Image is ingested and decoded onto an offscreen HTML5 `CanvasRenderingContext2D`.
2. **Skin & Face Heuristic Scanning**:
   - Analyzes RGB/YCbCr color channels to establish facial bounding box approximations.
   - Evaluates pupil-to-chin distance and crown clearance against the active exam preset (e.g. 70–80% face coverage for NEET/JEE).
3. **Background Whitening**:
   - Perimeter sampling measures luminosity and color deviation along the border pixels.
   - High-luminance pixels (`L > 0.82`) are boosted to pure `#FFFFFF` without bleeding into foreground skin tones or hair outlines.
4. **Binary Search Compression**:
   - To satisfy strict maximum file size constraints (e.g. `<= 200 KB` or `<= 50 KB`), an iterative canvas quality binary search (`quality: 0.1` to `0.95`) determines the highest fidelity export within threshold limits.

### 3.2 Adaptive Signature Vectorization & Transparency
Located in [`src/components/SignatureStudio.tsx`](file:///d:/docsprint/src/components/SignatureStudio.tsx) and [`src/utils/signatureConsistency.ts`](file:///d:/docsprint/src/utils/signatureConsistency.ts):
1. **Grayscale Decomposition**: Evaluates pixel luminosity:
   $$Y = 0.299R + 0.587G + 0.114B$$
2. **Adaptive Thresholding**: Dynamically separates foreground ink (blue/black ballpoint or gel pen) from uneven page shadows and ruled lines.
3. **Alpha Channel Synthesis**: Background pixels exceeding the threshold are converted to `alpha = 0`, producing a crystal-clear transparent PNG.
4. **Stroke Quality Analysis**: Measures continuous ink runs and stroke variance to detect broken lines, low DPI, or blurry photos before portal rejection.

### 3.3 Zero-Upload PDF Toolkit
Located in [`src/components/PdfToolkit.tsx`](file:///d:/docsprint/src/components/PdfToolkit.tsx) and [`src/utils/pdfUtils.ts`](file:///d:/docsprint/src/utils/pdfUtils.ts):
1. **Binary Ingestion**: Consumes files as `ArrayBuffer` directly into `pdf-lib` document instances.
2. **Lossless Structural Optimization**: Eliminates orphan references, unreferenced font subsets, and compresses stream contents.
3. **Canvas-Based Page Downsampling**: For aggressive compression requirements (e.g., bringing a 15MB scanned mark-sheet down to 300KB):
   - Renders individual PDF pages onto canvas at calibrated DPI targets (72–150 DPI).
   - Encodes each page as high-efficiency JPEG.
   - Reassembles downsampled bitmaps into a unified compliant PDF structure.

### 3.4 Cryptographic Local Vault
Located in [`src/components/VaultManager.tsx`](file:///d:/docsprint/src/components/VaultManager.tsx) and [`src/utils/vaultCrypto.ts`](file:///d:/docsprint/src/utils/vaultCrypto.ts):
- **Key Derivation**: `SubtleCrypto.deriveKey()` with PBKDF2 using SHA-256, 100,000 rounds, and a cryptographically random 16-byte salt.
- **Cipher**: AES-GCM (Galois/Counter Mode) with 128-bit authentication tag and 12-byte initialization vector (IV).
- **Storage Target**: Browser `IndexedDB` key-value store, keeping decrypted artifacts strictly in volatile memory.

---

## 4. State Management & Lifecycle

- **React 19 Concurrent Primitives**: Utilizes reactive hook state with zero global mutable leaks.
- **Memory Disposers**: Object URLs generated via `URL.createObjectURL()` are explicitly revoked (`URL.revokeObjectURL()`) on component unmount to prevent browser memory leaks during batch processing.
- **Undo / Redo Filmstrips**: Filter states are stored in an immutable history array limited to 20 states, preserving memory overhead while enabling step-back experimentation.
