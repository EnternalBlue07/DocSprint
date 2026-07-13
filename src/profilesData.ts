import { ApplicationProfile } from './types';

export const APPLICATION_PROFILES: ApplicationProfile[] = [
  {
    id: 'mah-cet',
    name: 'MAH-CET 2026',
    category: 'exams',
    description: 'Maharashtra Common Entrance Test for MBA, MCA, Law, and Engineering courses.',
    effectiveFrom: '2026-01-01',
    documents: [
      {
        id: 'photo',
        name: 'Passport Photo',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 45,
          aspectRatio: 3.5 / 4.5,
          minKb: 20,
          maxKb: 50,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white', 'light-gray'],
          instructions: 'Recent colour passport photo against a light-coloured background (preferably white). No caps or dark glasses.'
        }
      },
      {
        id: 'signature',
        name: 'Signature',
        type: 'signature',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 15,
          aspectRatio: 3.5 / 1.5,
          minKb: 10,
          maxKb: 20,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Sign on white paper with a black ink pen. Scan or photograph and crop cleanly.'
        }
      }
    ]
  },
  {
    id: 'jee-main',
    name: 'JEE Main 2026',
    category: 'exams',
    description: 'Joint Entrance Examination for top engineering institutions (IITs, NITs, IIITs) in India.',
    effectiveFrom: '2026-01-01',
    documents: [
      {
        id: 'photo',
        name: 'Passport Photo (with Name/Date)',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 45,
          aspectRatio: 3.5 / 4.5,
          minKb: 10,
          maxKb: 200,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Spectacles allowed only if used regularly. Background must be plain white. Polaroids or mobile selfies are not accepted.'
        }
      },
      {
        id: 'signature',
        name: 'Signature',
        type: 'signature',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 15,
          aspectRatio: 3.5 / 1.5,
          minKb: 4,
          maxKb: 30,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Sign in running handwriting on white paper with a black/blue ink pen.'
        }
      },
      {
        id: 'category-cert',
        name: 'Category Certificate',
        type: 'pdf',
        required: false,
        spec: {
          minKb: 50,
          maxKb: 300,
          formats: ['application/pdf'],
          instructions: 'SC/ST/OBC-NCL/EWS Certificate if applicable. Must be clear and readable.'
        }
      }
    ]
  },
  {
    id: 'neet',
    name: 'NEET UG 2026',
    category: 'exams',
    description: 'National Eligibility cum Entrance Test for medical admissions (MBBS/BDS) in India.',
    effectiveFrom: '2026-01-01',
    documents: [
      {
        id: 'photo',
        name: 'Passport Size Photo',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 45,
          aspectRatio: 3.5 / 4.5,
          minKb: 10,
          maxKb: 200,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'White background. Clear focus on face with 80% face coverage. Ears must be visible.'
        }
      },
      {
        id: 'postcard-photo',
        name: 'Postcard Size Photo (4"x6")',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 101,
          heightMm: 152,
          aspectRatio: 4 / 6,
          minKb: 10,
          maxKb: 200,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Recent postcard-size color photo (4x6 inches) with white background, displaying 80% face coverage.'
        }
      },
      {
        id: 'signature',
        name: 'Signature',
        type: 'signature',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 15,
          aspectRatio: 3.5 / 1.5,
          minKb: 4,
          maxKb: 30,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Sign on white paper with black ink pen only. Do not sign in capital letters.'
        }
      }
    ]
  },
  {
    id: 'gate',
    name: 'GATE 2026',
    category: 'exams',
    description: 'Graduate Aptitude Test in Engineering for postgraduate admissions and PSU hiring.',
    effectiveFrom: '2025-08-01',
    documents: [
      {
        id: 'photo',
        name: 'GATE Passport Photo',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 45,
          aspectRatio: 3.5 / 4.5,
          minKb: 5,
          maxKb: 200,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white', 'light-gray'],
          instructions: 'High-quality color photo. The face must cover 60-70% of the photo area.'
        }
      },
      {
        id: 'signature',
        name: 'GATE Signature',
        type: 'signature',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 10,
          aspectRatio: 3.5 / 1.0,
          minKb: 2,
          maxKb: 150,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Sign inside a rectangular box on white paper with a black ink pen.'
        }
      }
    ]
  },
  {
    id: 'cat',
    name: 'CAT 2026',
    category: 'exams',
    description: 'Common Admission Test for MBA admissions into elite Indian Institutes of Management (IIMs).',
    effectiveFrom: '2026-01-01',
    documents: [
      {
        id: 'photo',
        name: 'Passport Photo',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 45,
          aspectRatio: 3.5 / 4.5,
          minKb: 30,
          maxKb: 80,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'The photo must not be more than 6 months old. Must be white or light background.'
        }
      },
      {
        id: 'signature',
        name: 'Signature',
        type: 'signature',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 15,
          aspectRatio: 3.5 / 1.5,
          minKb: 10,
          maxKb: 80,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Sign with blue or black ink on a clear white background.'
        }
      }
    ]
  },
  {
    id: 'upsc',
    name: 'UPSC Civil Services',
    category: 'government',
    description: 'Union Public Service Commission civil services recruitment exam.',
    effectiveFrom: '2026-02-01',
    documents: [
      {
        id: 'photo',
        name: 'UPSC Passport Photo',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 45,
          aspectRatio: 3.5 / 4.5,
          minKb: 20,
          maxKb: 300,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'The photograph must include the candidate\'s name and date of taking photograph printed at the bottom.'
        }
      },
      {
        id: 'signature',
        name: 'Signature',
        type: 'signature',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 15,
          aspectRatio: 3.5 / 1.5,
          minKb: 20,
          maxKb: 300,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Dark blue or black ink signature on a crisp white sheet.'
        }
      }
    ]
  },
  {
    id: 'ssc-cgl',
    name: 'SSC CGL',
    category: 'government',
    description: 'Staff Selection Commission Combined Graduate Level recruitment examination.',
    effectiveFrom: '2026-01-01',
    documents: [
      {
        id: 'photo',
        name: 'Passport Photo',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 45,
          aspectRatio: 3.5 / 4.5,
          minKb: 20,
          maxKb: 50,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Plain white background. Frontal view of full face, both eyes, ears visible.'
        }
      },
      {
        id: 'signature',
        name: 'Signature',
        type: 'signature',
        required: true,
        spec: {
          widthMm: 40,
          heightMm: 20,
          aspectRatio: 4.0 / 2.0,
          minKb: 10,
          maxKb: 20,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Sign inside a 4.0 x 2.0 cm block. Black ink preferred.'
        }
      }
    ]
  },
  {
    id: 'ibps-po',
    name: 'IBPS PO 2026',
    category: 'government',
    description: 'Institute of Banking Personnel Selection Probationary Officer exam.',
    effectiveFrom: '2026-01-01',
    documents: [
      {
        id: 'photo',
        name: 'Passport Photo',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 45,
          aspectRatio: 3.5 / 4.5,
          minKb: 20,
          maxKb: 50,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white', 'light-gray'],
          instructions: 'Clear face, light background, size must be within 20KB-50KB.'
        }
      },
      {
        id: 'signature',
        name: 'Signature',
        type: 'signature',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 15,
          aspectRatio: 3.5 / 1.5,
          minKb: 10,
          maxKb: 20,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Signature in black ink on white paper.'
        }
      }
    ]
  },
  {
    id: 'rrb-ntpc',
    name: 'Railway RRB NTPC',
    category: 'government',
    description: 'Railway Recruitment Board Non-Technical Popular Categories examination.',
    effectiveFrom: '2026-01-01',
    documents: [
      {
        id: 'photo',
        name: 'Passport Photo',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 45,
          aspectRatio: 3.5 / 4.5,
          minKb: 30,
          maxKb: 70,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Light/White background. Ensure no shadow over the face.'
        }
      },
      {
        id: 'signature',
        name: 'Signature',
        type: 'signature',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 15,
          aspectRatio: 3.5 / 1.5,
          minKb: 30,
          maxKb: 70,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Running hand signature. No block letters.'
        }
      }
    ]
  },
  {
    id: 'indian-passport',
    name: 'Indian Passport Photo',
    category: 'government',
    description: 'Standard passport application photo specifications for Indian Passport services.',
    effectiveFrom: '2025-01-01',
    documents: [
      {
        id: 'photo',
        name: 'Passport Photo (2"x2")',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 51,
          heightMm: 51,
          aspectRatio: 1.0,
          minKb: 10,
          maxKb: 5120, // 5MB max
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Size must be 2x2 inches (51x51 mm). Background must be solid white. Face must cover 70-80% of photo.'
        }
      }
    ]
  },
  {
    id: 'us-visa',
    name: 'US Visa Photo',
    category: 'travel',
    description: 'Visa application photograph requirements for the United States Department of State.',
    effectiveFrom: '2025-01-01',
    documents: [
      {
        id: 'photo',
        name: 'Visa Photo (2"x2")',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 51,
          heightMm: 51,
          aspectRatio: 1.0,
          minKb: 10,
          maxKb: 240, // Max 240KB
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Exactly 2x2 inches. Solid white or off-white background. No eyeglasses allowed at all.'
        }
      }
    ]
  },
  {
    id: 'uk-visa',
    name: 'UK Visa Photo',
    category: 'travel',
    description: 'Visa and immigration photograph requirements for the United Kingdom.',
    effectiveFrom: '2025-01-01',
    documents: [
      {
        id: 'photo',
        name: 'Visa Photo',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 45,
          aspectRatio: 3.5 / 4.5,
          minKb: 10,
          maxKb: 1024,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white', 'light-gray'],
          instructions: 'Recent color photo taken against a cream or light grey background.'
        }
      }
    ]
  },
  {
    id: 'generic-uni',
    name: 'Generic University Form',
    category: 'admissions',
    description: 'Standard document specs accepted by most universities in India and abroad.',
    effectiveFrom: '2025-01-01',
    documents: [
      {
        id: 'photo',
        name: 'Passport Photo',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 45,
          aspectRatio: 3.5 / 4.5,
          minKb: 10,
          maxKb: 100,
          formats: ['image/jpeg', 'image/jpg', 'image/png'],
          bgColors: ['any'],
          instructions: 'Recent passport sized photograph with clean light background.'
        }
      },
      {
        id: 'signature',
        name: 'Signature',
        type: 'signature',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 15,
          aspectRatio: 3.5 / 1.5,
          minKb: 5,
          maxKb: 50,
          formats: ['image/jpeg', 'image/jpg', 'image/png'],
          bgColors: ['white'],
          instructions: 'Clear scanned signature in blue or black ink.'
        }
      }
    ]
  },
  {
    id: 'generic-schol',
    name: 'Generic Scholarship Portal',
    category: 'admissions',
    description: 'General specifications for Indian scholarship portals (NSP, etc.)',
    effectiveFrom: '2025-01-01',
    documents: [
      {
        id: 'photo',
        name: 'Scholarship Photo',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 45,
          aspectRatio: 3.5 / 4.5,
          minKb: 10,
          maxKb: 200,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Standard color passport photo under 200KB.'
        }
      },
      {
        id: 'income-cert',
        name: 'Income Certificate',
        type: 'pdf',
        required: true,
        spec: {
          minKb: 50,
          maxKb: 500,
          formats: ['application/pdf'],
          instructions: 'Official Income Certificate issued by competent authority in PDF format under 500KB.'
        }
      }
    ]
  },
  {
    id: 'custom-spec',
    name: 'Custom Studio (DIY)',
    category: 'custom',
    description: 'Configure your own custom crop, dimensions, and compression constraints.',
    effectiveFrom: '2026-01-01',
    documents: [
      {
        id: 'custom-doc',
        name: 'Custom Document',
        type: 'document',
        required: true,
        spec: {
          minKb: 5,
          maxKb: 1000,
          formats: ['image/jpeg', 'image/png', 'application/pdf'],
          bgColors: ['any'],
          instructions: 'Adjust parameters as needed to fit any requirement.'
        }
      }
    ]
  },

  // ── INTERNATIONAL VISA PROFILES ──────────────────────────────────────────

  {
    id: 'schengen-visa',
    name: 'Schengen Visa (EU)',
    category: 'travel',
    description: 'Standard photo specification for Schengen Area visa applications (26 European countries).',
    effectiveFrom: '2023-01-01',
    sourceUrl: 'https://home-affairs.ec.europa.eu/publications/schengen-borders-code_en',
    lastVerifiedDate: '2025-01-01',
    documents: [
      {
        id: 'photo',
        name: 'Biometric Passport Photo',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 45,
          widthPx: 413,
          aspectRatio: 35 / 45,
          minKb: 20,
          maxKb: 2048,
          dpi: 300,
          bgColors: ['white', 'off-white', 'light-gray'],
          formats: ['image/jpeg'],
          instructions: 'Front-facing, neutral expression, eyes open, no glasses. White or off-white plain background. Photo not older than 6 months. Head must occupy 70–80% of image height.'
        }
      }
    ]
  },

  {
    id: 'canada-visitor-visa',
    name: 'Canada Visitor Visa (TRV)',
    category: 'travel',
    description: 'IRCC photo specifications for Canadian Temporary Resident Visa applications.',
    effectiveFrom: '2023-01-01',
    sourceUrl: 'https://www.canada.ca/en/immigration-refugees-citizenship/services/passport/photos.html',
    lastVerifiedDate: '2025-01-01',
    documents: [
      {
        id: 'photo',
        name: 'Photo — IRCC Specification',
        type: 'photo',
        required: true,
        spec: {
          widthPx: 420,
          aspectRatio: 35 / 45,
          minKb: 20,
          maxKb: 2048,
          dpi: 600,
          bgColors: ['white'],
          formats: ['image/jpeg'],
          instructions: 'White plain background only. Taken within last 6 months. Head centered, full face, neutral expression, eyes open. No glasses. Head height must be 31–36mm (70–80% of photo height).'
        }
      }
    ]
  },

  {
    id: 'australia-evisa',
    name: 'Australia eVisa / ETA',
    category: 'travel',
    description: 'Department of Home Affairs photo specifications for Australian visas.',
    effectiveFrom: '2023-01-01',
    sourceUrl: 'https://immi.homeaffairs.gov.au/help-support/meeting-our-requirements/photos',
    lastVerifiedDate: '2025-01-01',
    documents: [
      {
        id: 'photo',
        name: 'Visa Photograph',
        type: 'photo',
        required: true,
        spec: {
          widthPx: 413,
          aspectRatio: 35 / 45,
          minKb: 50,
          maxKb: 2048,
          dpi: 300,
          bgColors: ['white', 'off-white'],
          formats: ['image/jpeg'],
          instructions: 'Plain white or off-white background. Full face, facing directly at camera. Both eyes must be clearly visible and open. No hats or tinted glasses.'
        }
      }
    ]
  },

  {
    id: 'uae-visa',
    name: 'UAE Tourist / Residence Visa',
    category: 'travel',
    description: 'UAE ICP / GDFRA photo requirements for visa and Emirates ID applications.',
    effectiveFrom: '2023-01-01',
    sourceUrl: 'https://icp.gov.ae',
    lastVerifiedDate: '2025-01-01',
    documents: [
      {
        id: 'photo',
        name: 'Passport Photograph',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 45,
          widthPx: 413,
          aspectRatio: 35 / 45,
          minKb: 20,
          maxKb: 1024,
          dpi: 300,
          bgColors: ['white'],
          formats: ['image/jpeg'],
          instructions: 'Solid white background. Recent photo (within last 6 months). Front-facing with neutral expression. No glasses. Women may wear hijab if worn daily, ensuring full face is clearly visible.'
        }
      }
    ]
  },

  {
    id: 'singapore-ep-visa',
    name: 'Singapore EP / Visit Pass',
    category: 'travel',
    description: 'MOM / ICA photo requirements for Singapore Employment Pass and Visit Pass.',
    effectiveFrom: '2023-01-01',
    sourceUrl: 'https://www.ica.gov.sg/apply-renew-replace/renew/ic-renewal-for-sc-and-pr',
    lastVerifiedDate: '2025-01-01',
    documents: [
      {
        id: 'photo',
        name: 'NRIC / Visa Photo',
        type: 'photo',
        required: true,
        spec: {
          widthPx: 400,
          aspectRatio: 400 / 514,
          minKb: 20,
          maxKb: 5120,
          dpi: 300,
          bgColors: ['white'],
          formats: ['image/jpeg'],
          instructions: 'Plain white background. Image must be 400×514 px (3.5×4.5 cm equivalent at 300dpi). Neutral expression, mouth closed, both eyes open. No glasses since 2019 ICA ruling.'
        }
      }
    ]
  },

  {
    id: 'india-passport-renewal',
    name: 'India Passport (Renewal)',
    category: 'government',
    description: 'MEA / Passport Seva online photo specifications for Indian passport applications.',
    effectiveFrom: '2024-01-01',
    sourceUrl: 'https://www.passportindia.gov.in/AppOnlineProject/pdf/PhotoSpecification.pdf',
    lastVerifiedDate: '2025-01-01',
    documents: [
      {
        id: 'photo',
        name: 'Passport Photo (MEA Specification)',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 51,
          heightMm: 51,
          widthPx: 600,
          aspectRatio: 1,
          minKb: 10,
          maxKb: 1500,
          dpi: 300,
          bgColors: ['white'],
          formats: ['image/jpeg'],
          instructions: 'Square format 51×51mm. Solid white background only. No glasses. Head (without hair) must be 25–35mm. Taken within last 6 months. No shadows on face or background.'
        }
      }
    ]
  },
  {
    id: 'mh-fyjc-11th',
    name: 'Maharashtra FYJC (11th) Admission',
    category: 'admissions',
    description: 'Maharashtra First Year Junior College (FYJC) Class 11 centralized admission requirements.',
    effectiveFrom: '2026-05-01',
    sourceUrl: 'https://11thadmission.org.in',
    lastVerifiedDate: '2026-05-01',
    documents: [
      {
        id: 'photo',
        name: 'Passport Photo',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 45,
          widthPx: 350,
          aspectRatio: 3.5 / 4.5,
          minKb: 20,
          maxKb: 50,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white', 'light-gray'],
          instructions: 'Recent color photo with light background. Face occupies 75% of the frame.'
        }
      },
      {
        id: 'signature',
        name: 'Signature Scan',
        type: 'signature',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 15,
          widthPx: 350,
          aspectRatio: 3.5 / 1.5,
          minKb: 10,
          maxKb: 20,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Black ink signature on plain white paper, cropped cleanly.'
        }
      }
    ]
  },
  {
    id: 'sbi-po',
    name: 'SBI & IBPS Bank PO Recruitment',
    category: 'exams',
    description: 'State Bank of India and IBPS Probationary Officer / Management Trainee photo & signature specifications.',
    effectiveFrom: '2026-01-01',
    sourceUrl: 'https://sbi.co.in/careers',
    lastVerifiedDate: '2026-06-01',
    documents: [
      {
        id: 'photo',
        name: 'Passport Photograph',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 45,
          widthPx: 200,
          heightPx: 230,
          aspectRatio: 200 / 230,
          minKb: 20,
          maxKb: 50,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white', 'light-gray'],
          instructions: 'Dimensions 200 x 230 pixels (preferred). Size between 20kb to 50kb. Light background (preferably white). Both ears visible, eyes open.'
        }
      },
      {
        id: 'signature',
        name: 'Signature Scan (Black Ink)',
        type: 'signature',
        required: true,
        spec: {
          widthMm: 140,
          heightMm: 60,
          widthPx: 140,
          heightPx: 60,
          aspectRatio: 140 / 60,
          minKb: 10,
          maxKb: 20,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Dimensions 140 x 60 pixels. Size between 10kb to 20kb. Sign on white paper with black ink pen only. Do NOT sign in capital letters.'
        }
      }
    ]
  },
  {
    id: 'ssc-cgl',
    name: 'SSC CGL Officer Recruitment',
    category: 'exams',
    description: 'Staff Selection Commission Combined Graduate Level photo and signature requirements.',
    effectiveFrom: '2026-01-01',
    sourceUrl: 'https://ssc.gov.in',
    lastVerifiedDate: '2026-05-10',
    documents: [
      {
        id: 'photo',
        name: 'Passport Photo (3.5x4.5cm)',
        type: 'photo',
        required: true,
        spec: {
          widthMm: 35,
          heightMm: 45,
          widthPx: 350,
          heightPx: 450,
          aspectRatio: 3.5 / 4.5,
          minKb: 20,
          maxKb: 50,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Width 3.5 cm, Height 4.5 cm. Size 20kb to 50kb. Plain white background only. Facial features must cover 75% of photo. Mouth closed, eyes visible.'
        }
      },
      {
        id: 'signature',
        name: 'Signature Scan',
        type: 'signature',
        required: true,
        spec: {
          widthMm: 40,
          heightMm: 20,
          widthPx: 140,
          heightPx: 60,
          aspectRatio: 4.0 / 2.0,
          minKb: 10,
          maxKb: 20,
          formats: ['image/jpeg', 'image/jpg'],
          bgColors: ['white'],
          instructions: 'Width 4.0 cm, Height 2.0 cm. Size 10kb to 20kb. Sign on white paper.'
        }
      }
    ]
  }
];

