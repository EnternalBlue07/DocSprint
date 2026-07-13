import { AdmissionPlaybook } from './types';

export const ADMISSION_PLAYBOOKS: AdmissionPlaybook[] = [
  {
    id: 'mh-fyjc-11th',
    title: 'Maharashtra 11th (FYJC) Admission',
    appliesTo: {
      stage: 'after-10th',
      state: 'Maharashtra',
      board: ['SSC', 'CBSE', 'ICSE']
    },
    officialPortal: {
      name: 'mahafyjcadmissions.in',
      url: 'https://11thadmission.org.in',
      sourceUrl: 'https://11thadmission.org.in/help',
      lastVerifiedDate: '2026-04-01'
    },
    steps: [
      {
        order: 1,
        title: 'Part 1: Basic Registration Form',
        description: 'Create your login credentials, fill in personal details, select your school board, and upload category/reservation documents.',
        timingWindow: 'Typically opens within 2-3 days of Board results declaration. Stays open for a fixed period.',
        actionType: 'online-form',
        documentsNeeded: [
          {
            name: 'Class 10 (SSC) Marksheet',
            docSprintStudio: 'document',
            docSprintProfileId: 'mh-fyjc-11th',
            originalOrPhotocopy: 'both',
            printCopies: 2
          },
          {
            name: 'School Leaving / Transfer Certificate',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'both',
            printCopies: 2
          },
          {
            name: 'Aadhaar Card (identity proof)',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'both',
            printCopies: 1
          },
          {
            name: 'Caste Certificate (if claiming reservation)',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'both',
            printCopies: 2
          }
        ],
        tips: [
          'Verify that your name matches exactly as printed on your Class 10 marksheet.',
          'Ensure your mobile number is active; all CAP notifications will arrive via SMS.',
          'Make sure you obtain a printout of the Part 1 application form and get it verified at a Guidance Centre.'
        ],
        studyGuide: {
          syllabus: [
            'Class 10 SSC/CBSE Board syllabus (for qualifying criteria only).'
          ],
          resources: [
            'Official 11thAdmission CAP booklets.',
            'Regional Guidance Centres helpline lists.'
          ]
        }
      },
      {
        order: 2,
        title: 'Part 2: Option / Preference Form',
        description: 'Select your preferred stream (Science, Commerce, Arts) and rank 1 to 10 junior colleges in order of preference.',
        timingWindow: 'Opens shortly after Part 1 registration. Closes in a strict fixed window.',
        actionType: 'document-upload',
        documentsNeeded: [
          {
            name: 'Verified Part 1 Form Copy',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'photocopy',
            printCopies: 1
          }
        ],
        tips: [
          'Rank your dream colleges at the top, but be realistic based on last year\'s cut-offs.',
          'Crucial: You MUST lock/confirm your Part 2 option form before the deadline, otherwise you will not be considered in the merit rounds.'
        ],
        studyGuide: {
          syllabus: [
            'No exam at this stage. Decision based on stream interests (Science/Commerce/Arts) and cutoff ranks.'
          ],
          resources: [
            'College cut-off search tools on mahafyjcadmissions.in.',
            'Local junior college brochures.'
          ]
        }
      },
      {
        order: 3,
        title: 'Zero Round (Quota Allocations)',
        description: 'A separate allocation cycle held for Management, In-House, and Minority quota seats in junior colleges.',
        timingWindow: 'Runs early, parallel to CAP Round 1 registration.',
        actionType: 'in-person-report',
        documentsNeeded: [
          {
            name: 'Minority/In-House Quota Proof Certificate',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'both',
            printCopies: 2
          }
        ],
        tips: [
          'If you qualify for In-House or Minority quotas, apply in Zero Round for an easiest admission path.',
          'Securing a seat in Zero Round allows you to choose to exit the general CAP rounds.'
        ]
      },
      {
        order: 4,
        title: 'CAP Merit Rounds (Rounds 1, 2, and 3)',
        description: 'General Centralized Admission Process rounds. Seats are allocated strictly based on Class 10 (SSC) merit marks (best-of-five calculation).',
        timingWindow: 'Runs sequentially over 3-4 weeks.',
        actionType: 'wait',
        documentsNeeded: [
          {
            name: 'Allotment Letter printout',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'photocopy',
            printCopies: 2
          }
        ],
        tips: [
          'Check the allotment status on the portal at the end of each round.',
          'If you do not get allotted in Round 1, your preference form carries over to Round 2 automatically.'
        ]
      },
      {
        order: 5,
        title: 'Special Allocation Rounds',
        description: 'For students who did not secure any college during CAP Rounds 1-3, or whose admissions were cancelled/rejected.',
        timingWindow: 'Opens after CAP Round 3 finishes, subject to vacant seats.',
        actionType: 'online-form',
        documentsNeeded: [],
        tips: [
          'Vacant seat matrices are published on the portal before Special Rounds. Choose colleges with high vacancy counts.'
        ]
      },
      {
        order: 6,
        title: 'College Reporting & Seat Confirmation (Freeze/Float)',
        description: 'Report to your allotted college. Choose to "Freeze" the seat if you are satisfied, or "Float" (if allowed/applicable) to wait for subsequent rounds.',
        timingWindow: 'Must report within 2-3 days of receiving allotment.',
        actionType: 'in-person-report',
        documentsNeeded: [
          {
            name: 'Passport Size Photograph',
            docSprintStudio: 'photo',
            docSprintProfileId: 'mh-fyjc-11th',
            originalOrPhotocopy: 'original',
            printCopies: 4
          },
          {
            name: 'Signature Specimen Card',
            docSprintStudio: 'signature',
            docSprintProfileId: 'mh-fyjc-11th',
            originalOrPhotocopy: 'original',
            printCopies: 2
          },
          {
            name: 'SSC Marksheet (Original)',
            originalOrPhotocopy: 'original',
            printCopies: 1
          }
        ],
        tips: [
          'If you get your first-preference college, you MUST confirm admission there. Failing to do so will block you from subsequent general rounds.'
        ]
      },
      {
        order: 7,
        title: 'Document Verification & Fee Payment',
        description: 'Submit your physical files at the college desk, pay the admission fees, and obtain your official fee receipt to lock your admission.',
        timingWindow: 'Completed simultaneously during the College Reporting window.',
        actionType: 'payment',
        documentsNeeded: [
          {
            name: 'Allotment Letter & Part 1+2 Forms',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'both',
            printCopies: 2
          },
          {
            name: 'Fee Receipt / Bank Draft Chalan',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'both',
            printCopies: 2
          }
        ],
        tips: [
          'Keep 3-4 photocopies of all submitted documents at home. Colleges retain your original SSC marksheet and Leaving Certificate for several months.'
        ]
      }
    ],
    commonMistakes: [
      'Forgetting to Lock Part 2 Option Form: If not locked, the system does not process your options for allotment.',
      'Missing the Reporting Window: Allotment letters expire. Missing the 3-day reporting window cancels your seat allocation automatically.',
      'Not carrying original documents: Verification desks will reject candidates who bring only photocopies of the SSC Marksheet or Reservation Certificate.'
    ],
    parentSummary: 'Maharashtra 11th admission CAP process class 10th marks standard best-of-five पर आधारित होता है। पहले Part 1 में नाम and जाति की जानकारी भरी जाती है, फिर Part 2 में 10 पसंदीदा कॉलेजों को चुना जाता है। कॉलेज अलॉट होने पर 3 दिन के भीतर संबंधित कॉलेज में जाकर मूल SSC मार्कशीट and फोटो जमा करके, फीस भरकर एडमिशन पक्का करना अनिवार्य है। ऐसा न करने पर आवंटित सीट रद्द हो जाती है।',
    relatedDocSprintProfiles: ['mh-fyjc-11th'],
    disclaimer: 'Admissions schedule, dates, and online options change yearly. Always verify on mahafyjcadmissions.in.'
  },
  {
    id: 'sbi-po-recruitment',
    title: 'SBI Probationary Officer (PO) Selection Journey',
    appliesTo: {
      stage: 'after-ug',
      state: 'National'
    },
    officialPortal: {
      name: 'sbi.co.in/careers',
      url: 'https://sbi.co.in/web/careers',
      sourceUrl: 'https://sbi.co.in/web/careers/current-openings',
      lastVerifiedDate: '2026-06-01'
    },
    steps: [
      {
        order: 1,
        title: 'Online Application & Document Upload',
        description: 'Register details on the official SBI careers portal. Upload passport photograph, signature (in black ink), left thumb impression, and the handwritten declaration statement.',
        timingWindow: 'Registration is active for 20-25 days from notification date.',
        actionType: 'online-form',
        documentsNeeded: [
          {
            name: 'Passport Photo (20-50kb)',
            docSprintStudio: 'photo',
            docSprintProfileId: 'sbi-po',
            originalOrPhotocopy: 'original',
            printCopies: 1
          },
          {
            name: 'Signature Scan (Black Ink, 10-20kb)',
            docSprintStudio: 'signature',
            docSprintProfileId: 'sbi-po',
            originalOrPhotocopy: 'original',
            printCopies: 1
          },
          {
            name: 'Left Thumb Impression Scan (20-50kb)',
            docSprintStudio: 'signature',
            originalOrPhotocopy: 'original',
            printCopies: 1
          },
          {
            name: 'Handwritten Declaration Scan (50-100kb)',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'original',
            printCopies: 1
          }
        ],
        tips: [
          'Do NOT sign in capital letters; signatures in capital letters will be rejected.',
          'The handwritten declaration must be written in English by you on white paper with a black ink pen only.'
        ],
        studyGuide: {
          syllabus: [
            'Eligibility Criteria: Graduation degree in any discipline from a recognized University.',
            'Age Limit: 21 to 30 years (relaxations apply for OBC/SC/ST categories).'
          ],
          resources: [
            'Official SBI Careers Vacancy PDF Capsule.',
            'IBPS Online Registration Help Guides.'
          ]
        }
      },
      {
        order: 2,
        title: 'Phase I: Preliminary MCQ Examination',
        description: 'A 1-hour computer-based testing containing 100 questions. Shortlisted candidates (approx 10 times the vacancies) move to Phase II.',
        timingWindow: 'Conducted 4-6 weeks after application registration closure.',
        actionType: 'in-person-report',
        documentsNeeded: [
          {
            name: 'Prelims Admit Card (with pasted photo)',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'both',
            printCopies: 2
          },
          {
            name: 'Original Photo Identity Proof (Aadhaar/PAN)',
            originalOrPhotocopy: 'original',
            printCopies: 1
          },
          {
            name: 'Photocopy of Identity Proof',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'photocopy',
            printCopies: 2
          }
        ],
        tips: [
          'Bring an extra copy of the photo pasted on your admit card; center officers collect the signed ID photocopy.'
        ],
        studyGuide: {
          syllabus: [
            'English Language: 30 Questions (Grammar, Cloze Test, Reading Comprehension).',
            'Quantitative Aptitude: 35 Questions (Simplification, Number Series, Data Interpretation, Arithmetic).',
            'Reasoning Ability: 35 Questions (Puzzles, Seating Arrangement, Syllogism, Blood Relations, Coding-Decoding).'
          ],
          resources: [
            'Books: Quantitative Aptitude by R.S. Aggarwal, Verbal & Non-Verbal Reasoning by R.S. Aggarwal.',
            'Online Platforms: BankersAdda, Oliveboard, Meritshine YouTube channel (excellent free concept playlists).',
            'Practice Mocks: Attempt at least 15-20 full-length mock tests before the actual Prelims exam.'
          ]
        }
      },
      {
        order: 3,
        title: 'Phase II: Main Objective + Descriptive Exam',
        description: 'A 3-hour objective test (200 marks) followed by a 30-minute computer-typed descriptive English test (50 marks).',
        timingWindow: 'Conducted 3-4 weeks after Prelims results.',
        actionType: 'wait',
        documentsNeeded: [
          {
            name: 'Mains Admit Card & Prelims Admit Card (stamped)',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'both',
            printCopies: 2
          }
        ],
        tips: [
          'Ensure you retain your Prelims Admit Card stamped by the exam center; it is collected at the Mains exam center!'
        ],
        studyGuide: {
          syllabus: [
            'Reasoning & Computer Aptitude: 40 Qs (High-level analytical puzzles, flowcharts).',
            'Data Analysis & Interpretation: 30 Qs (Tabular/Line graphs, Caselets, Probability, Radar charts).',
            'General/Economy/Banking Awareness: 50 Qs (Current financial updates, economy, monetary policy, schemes).',
            'English Language: 35 Qs (Advanced reading, vocabulary).',
            'Descriptive Test: Computer keyboard typing of 1 Letter and 1 Essay (Letter to Editor/Manager, current socioeconomic topics).'
          ],
          resources: [
            'Banking Awareness: CA Kapil Kathpal YouTube lectures, AffairsCloud monthly current affairs PDF capsules.',
            'Descriptive English: Read The Hindu Editorial daily. Practice typing directly in Notepad/Online writing tools to improve speed.',
            'Mock Tests: Practice Mains Mock tests on PracticeMock or Testbook platforms.'
          ]
        }
      },
      {
        order: 4,
        title: 'Phase III: Psychometric Test & Interview',
        description: 'Shortlisted candidates report to local SBI offices for psychometric evaluation (personality mapping), group exercises, and personal interview.',
        timingWindow: 'Scheduled 4 weeks after Mains results.',
        actionType: 'in-person-report',
        documentsNeeded: [
          {
            name: 'Interview Call Letter',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'photocopy',
            printCopies: 2
          },
          {
            name: 'Original Graduation Degree & Marksheets',
            originalOrPhotocopy: 'original',
            printCopies: 1
          },
          {
            name: 'Caste / OBC-NCL / EWS Certificate (if applicable)',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'both',
            printCopies: 3
          }
        ],
        tips: [
          'OBC-NCL certificate must be issued within the current financial year and must clearly show the non-creamy layer status.'
        ],
        studyGuide: {
          syllabus: [
            'Interview Topics: Personal background, career goals, knowledge of SBI history/products, current economic events, basic banking principles (Repo rate, inflation, NPA, digital banking).'
          ],
          resources: [
            'Free Online Resources: Anil Aggarwal banking interview playlists on YouTube.',
            'SBI Annual Reports and RBI official websites FAQ pages.'
          ]
        }
      },
      {
        order: 5,
        title: 'Document Verification & Pre-Employment Medicals',
        description: 'Final selected officers report to designated circles for document verification, biological verification, and medical tests at SBI-empanelled hospitals.',
        timingWindow: 'Runs over 2 weeks after final merit list.',
        actionType: 'payment',
        documentsNeeded: [
          {
            name: 'Medical Fitness Certificate from Board',
            originalOrPhotocopy: 'original',
            printCopies: 1
          },
          {
            name: 'Character Certificates (from 2 Gazetted Officers)',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'original',
            printCopies: 2
          }
        ],
        tips: [
          'Ensure character certificates are not signed by immediate family members.'
        ]
      }
    ],
    commonMistakes: [
      'Signing in CAPITAL LETTERS during registration: Leads to automatic profile rejection.',
      'OBC-NCL certificate date mismatch: Certs older than 1 year or not in central format are rejected, forcing general category evaluation.',
      'Losing Prelims Admit Card: You will not be allowed to enter the Mains examination without the stamped Prelims Admit Card.'
    ],
    parentSummary: 'SBI Probationary Officer (PO) भर्ती में ग्रेजुएट्स भाग लेते हैं। परीक्षा 3 स्तरों पर होती है: प्रीलिम्स, मेन्स, and इंटरव्यू। डाक्यूमेंट्स में पासपोर्ट फोटो, काली स्याही के हस्ताक्षर and बाएं अंगूठे का निशान अपलोड करना होता है। परीक्षा उत्तीर्ण करने के बाद सर्कल मुख्यालय में जाकर स्नातक की मूल डिग्री, चरित्र प्रमाण पत्र and मेडिकल रिपोर्ट जमा करना अनिवार्य है।',
    relatedDocSprintProfiles: ['sbi-po'],
    disclaimer: 'Recruitment guidelines are subject to change by SBI Central Recruitment Board. Verify on sbi.co.in/careers.'
  },
  {
    id: 'ibps-po-recruitment',
    title: 'IBPS Common Banking PO (CRP) Admission Cycle',
    appliesTo: {
      stage: 'after-ug',
      state: 'National'
    },
    officialPortal: {
      name: 'ibps.in',
      url: 'https://www.ibps.in',
      sourceUrl: 'https://www.ibps.in/common-recruitment-process-po-mt/',
      lastVerifiedDate: '2026-05-15'
    },
    steps: [
      {
        order: 1,
        title: 'Common Registration & Bank Preference Selection',
        description: 'Register under the Common Recruitment Process (CRP) and rank participating public sector banks (e.g. Bank of Baroda, PNB) in preference order.',
        timingWindow: 'Active in August/September annually.',
        actionType: 'online-form',
        documentsNeeded: [
          {
            name: 'Passport Photo (20-50kb)',
            docSprintStudio: 'photo',
            docSprintProfileId: 'sbi-po',
            originalOrPhotocopy: 'original',
            printCopies: 1
          },
          {
            name: 'Signature Scan (Black Ink, 10-20kb)',
            docSprintStudio: 'signature',
            docSprintProfileId: 'sbi-po',
            originalOrPhotocopy: 'original',
            printCopies: 1
          }
        ],
        tips: [
          'Select bank preferences carefully; allotments are final and based on your rank.'
        ],
        studyGuide: {
          syllabus: [
            'Eligibility: Graduation degree from a recognized university. Nationality: Indian.'
          ],
          resources: [
            'IBPS CRP official notification booklets.'
          ]
        }
      },
      {
        order: 2,
        title: 'CRP Preliminary & Mains Examinations',
        description: 'Attempt the objective Prelims, followed by the Mains MCQ + Descriptive testing at designated exam centers.',
        timingWindow: 'Prelims in October; Mains in November.',
        actionType: 'wait',
        documentsNeeded: [],
        tips: [
          'Save a copy of your application printout; you will need it during the final interview rounds.'
        ],
        studyGuide: {
          syllabus: [
            'Prelims: Quant (35 Qs), Reasoning (35 Qs), English (30 Qs). Total 100 marks, 1-hour time.',
            'Mains: Reasoning & Computer Aptitude (60 marks), General/Economy/Banking Awareness (40 marks), English (40 marks), Data Analysis (60 marks) + Descriptive Essay/Letter writing (25 marks).'
          ],
          resources: [
            'Quantitative Aptitude for Competitive Exams by R.S. Aggarwal, Adda247 free daily banking quiz capsules.',
            'Descriptive Test practice templates.'
          ]
        }
      },
      {
        order: 3,
        title: 'Common Interview Round',
        description: 'Shortlisted candidates are interviewed by a panel of senior bankers at local designated nodal banks.',
        timingWindow: 'Held in January/February.',
        actionType: 'in-person-report',
        documentsNeeded: [
          {
            name: 'Printed Application Form (CRP)',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'photocopy',
            printCopies: 2
          },
          {
            name: 'Interview Call Letter & Degree Marksheets',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'both',
            printCopies: 2
          }
        ],
        tips: [
          'Verify that the graduation completion date in your certificate is before the CRP application registration deadline.'
        ],
        studyGuide: {
          syllabus: [
            'Interview Structure: Focuses on current banking schemes (Jan Dhan Yojana, PM JJBY, APY), banking terminologies (NPA, CRR, SLR, KYC, Money Laundering), and basic financial accounting.'
          ],
          resources: [
            'Websites: AffairsCloud current affairs portal, BankersAdda free Interview prep PDF notes.'
          ]
        }
      },
      {
        order: 4,
        title: 'Provisional Allotment & Bank Document Verification',
        description: 'Provisional allocation to a participating bank is announced. Report to the allocated bank headquarters for final document checks and onboarding.',
        timingWindow: 'Provisional allotment on 1st April; bank reporting within 30-45 days.',
        actionType: 'payment',
        documentsNeeded: [
          {
            name: 'Local Domicile / Residence Proof',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'both',
            printCopies: 2
          },
          {
            name: 'Character Certificate (from College / Employer)',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'original',
            printCopies: 2
          }
        ],
        tips: [
          'Keep your original certificates handy. Banks retain your graduation degree and marksheet certificates for verifying authenticity.'
        ]
      }
    ],
    commonMistakes: [
      'Discrepancy in date of graduation result declaration: If the result date is after the registration deadline, your candidature is cancelled.',
      'Failing to submit the printed CRP Application Form during the interview: Leads to rejection on the spot.'
    ],
    parentSummary: 'IBPS CRP PO के माध्यम से देश के 11 सरकारी बैंकों में भर्ती होती है। इसके तहत एक ही फॉर्म में बैंकों की प्राथमिकता चुनी जाती है। परीक्षा के बाद इंटरव्यू होता है। 1 अप्रैल को अलॉटमेंट आने पर आवंटित बैंक के मुख्यालय में जाकर मूल ग्रेजुएशन दस्तावेज and पुलिस सत्यापन जमा करना होता है।',
    relatedDocSprintProfiles: ['sbi-po'],
    disclaimer: 'Admissions and recruitment processes depend on IBPS annual schedules. Confirm on ibps.in.'
  },
  {
    id: 'rbi-grade-b',
    title: 'RBI Grade B Officer Recruitment Roadmap',
    appliesTo: {
      stage: 'after-ug',
      state: 'National'
    },
    officialPortal: {
      name: 'rbi.org.in',
      url: 'https://www.rbi.org.in',
      sourceUrl: 'https://opportunities.rbi.org.in/scripts/vacancies.aspx',
      lastVerifiedDate: '2026-05-01'
    },
    steps: [
      {
        order: 1,
        title: 'Phase I: Online Objective Examination',
        description: 'Log in, complete application and appear for Phase I online exam covering General Awareness, Quantitative Aptitude, Reasoning, and English.',
        timingWindow: 'Conducted 4 weeks after registration.',
        actionType: 'online-form',
        documentsNeeded: [],
        tips: [
          'General Awareness covers 80/200 marks. Focus heavily on current banking and economic updates.'
        ],
        studyGuide: {
          syllabus: [
            'General Awareness (80 Marks): Focus on banking news, schemes, RBI reports, national international news.',
            'Reasoning (60 Marks): Coding, seating arrangements, machine input-output, syllogisms.',
            'English (30 Marks): Reading comprehension, fillers, error detection.',
            'Quantitative Aptitude (30 Marks): Data interpretation, number series, quadratic equations.'
          ],
          resources: [
            'Current Affairs: AffairsCloud Daily and Weekly Current Affairs PDF.',
            'Mrunal Patel Economics Video lectures on YouTube (excellent foundation for banking economy).'
          ]
        }
      },
      {
        order: 2,
        title: 'Phase II: Online Descriptive + Objective Exam',
        description: 'Shortlisted candidates sit for Phase II consisting of three papers: Economic & Social Issues (ESI), English Writing Skills, and Finance & Management (FM).',
        timingWindow: 'Held 3 weeks after Phase I results.',
        actionType: 'wait',
        documentsNeeded: [],
        tips: [
          'Descriptive answers require typing on a keyboard. Practice typing speed beforehand.'
        ],
        studyGuide: {
          syllabus: [
            'Paper I - Economic & Social Issues (ESI): Growth and development, economic reforms, globalization, social structure.',
            'Paper II - English (Writing Skills): Essay, Précis writing, Comprehension.',
            'Paper III - Finance & Management (FM): Financial system, financial markets, general management theory, leadership, organizational behavior.'
          ],
          resources: [
            'Free Channels: Edutap, Anuj Jindal free YouTube concept series.',
            'Recommended Books: Indian Economy by Ramesh Singh, Finance & Management by Prasanna Chandra, RBI Bulletin Monthly reports (must-read sections).'
          ]
        }
      },
      {
        order: 3,
        title: 'Detailed Bio-Data & Interview Round',
        description: 'Report to RBI headquarters (usually Mumbai, Delhi, Chennai, or Kolkata) for the final interview. Submit a detailed bio-data form beforehand.',
        timingWindow: 'Scheduled 5 weeks after Phase II results.',
        actionType: 'in-person-report',
        documentsNeeded: [
          {
            name: 'RBI Bio-Data Form (Central Format)',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'both',
            printCopies: 5
          },
          {
            name: 'Original Proof of Age & Graduation Marksheets',
            originalOrPhotocopy: 'original',
            printCopies: 1
          }
        ],
        tips: [
          'Print 5 copies of the Bio-Data Form; the interview panel members retain individual copies for review.'
        ],
        studyGuide: {
          syllabus: [
            'Interview Topics: Dynamic macroeconomics, fiscal and monetary policies, banking sector regulations (Basel norms, IBC), current national events.'
          ],
          resources: [
            'RBI FAQs page (opportunities.rbi.org.in), LiveMint / Business Standard newspapers.'
          ]
        }
      }
    ],
    commonMistakes: [
      'Typing errors or false information in the Bio-Data form: Any mismatch during physical verification results in immediate cancellation.',
      'Missing the minimum 60% graduation marks requirement (50% for SC/ST).'
    ],
    parentSummary: 'भारतीय रिजर्व बैंक (RBI) ग्रेड बी अधिकारी भर्ती देश की सबसे प्रतिष्ठित बैंक परीक्षा है। इसमें लिखित परीक्षा के दो चरण and मुंबई में फाइनल इंटरव्यू होता है। इंटरव्यू के पहले 5 कॉपियों में विस्तृत बायो-डेटा फॉर्म भरकर जमा करना होता है।',
    relatedDocSprintProfiles: ['sbi-po'],
    disclaimer: 'Reserve Bank of India Services Board rules apply. Confirm on opportunities.rbi.org.in.'
  },
  {
    id: 'ssc-cgl-cycle',
    title: 'SSC CGL Central Government Recruitment',
    appliesTo: {
      stage: 'after-ug',
      state: 'National'
    },
    officialPortal: {
      name: 'ssc.gov.in',
      url: 'https://ssc.gov.in',
      sourceUrl: 'https://ssc.gov.in/portal/help',
      lastVerifiedDate: '2026-05-10'
    },
    steps: [
      {
        order: 1,
        title: 'One-Time Registration (OTR) & Application',
        description: 'Register on the SSC portal. Capture a live photo using the webcam/app and upload your signature.',
        timingWindow: 'Opens for 30 days after vacancy announcement.',
        actionType: 'online-form',
        documentsNeeded: [
          {
            name: 'Live Webcam Photo',
            docSprintStudio: 'photo',
            docSprintProfileId: 'ssc-cgl',
            originalOrPhotocopy: 'original',
            printCopies: 1
          },
          {
            name: 'Signature Scan (10-20kb)',
            docSprintStudio: 'signature',
            docSprintProfileId: 'ssc-cgl',
            originalOrPhotocopy: 'original',
            printCopies: 1
          }
        ],
        tips: [
          'Ensure the live photo is taken against a white background, without caps, spectacles/glasses, and with both ears visible.',
          'Do NOT upload a cropped photo of a photo; use a live webcam capture as mandated by SSC new OTR rules.'
        ],
        studyGuide: {
          syllabus: [
            'Eligibility: Bachelor\'s degree in any discipline. Candidate must be an Indian Citizen.'
          ],
          resources: [
            'SSC OTR registration manuals and help articles on ssc.gov.in.'
          ]
        }
      },
      {
        order: 2,
        title: 'Tier I & Tier II Examinations',
        description: 'Appear for the Computer Based Exams (Tier I qualifying; Tier II deciding merit scores).',
        timingWindow: 'Tier I held in Sept/Oct; Tier II in Dec/Jan.',
        actionType: 'wait',
        documentsNeeded: [],
        tips: [
          'Practice typing tests (DEST) and computer knowledge tests. Qualifying these is mandatory for all posts.'
        ],
        studyGuide: {
          syllabus: [
            'Tier I (Qualifying): Reasoning (25 Qs), General Awareness (25 Qs), Quantitative Aptitude (25 Qs), English Comprehension (25 Qs). 1 hour, total 200 marks.',
            'Tier II (Score Deciding): Section I (Maths & Reasoning - 60 Qs, 180 Marks), Section II (English & General Awareness - 70 Qs, 210 Marks), Section III (Computer Knowledge - 20 Qs, qualifying only) + Typing test (DEST - 2000 key depressions in 15 minutes, qualifying only).'
          ],
          resources: [
            'Maths: Abhinay Maths YouTube channel, Rakesh Yadav class notes.',
            'English: Neetu Singh Volume 1 Grammar book, SP Bakshi Objective English.',
            'General Awareness: Lucent\'s General Knowledge book, RBE YouTube channels for trend analysis and study guides.',
            'Mock Tests: Textbook platform, Oliveboard (essential for computer knowledge section).'
          ]
        }
      },
      {
        order: 3,
        title: 'Post Preference Locking & Physical Standards',
        description: 'Submit your online preference form for post codes (e.g. ASO CSS, Inspector Excise). Report for physical metrics if applying for uniform posts.',
        timingWindow: 'Active for 4-5 days after Tier II results.',
        actionType: 'in-person-report',
        documentsNeeded: [
          {
            name: 'Post Preference Printout sheet',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'photocopy',
            printCopies: 2
          }
        ],
        tips: [
          'Uniform posts (Excise Inspector, CBI Sub-Inspector) require minimum height and physical chest expansion checks.'
        ]
      }
    ],
    commonMistakes: [
      'Spectacles/glasses in live photo: Leads to direct rejection of the SSC application without correction window allocation.',
      'Not locking post preferences: If you miss the post-preference window, no post will be allotted even if you score top marks.'
    ],
    parentSummary: 'SSC CGL परीक्षा से केंद्र सरकार के मंत्रालयों में इंस्पेक्टर and सेक्शन ऑफिसर (ASO) के पद मिलते हैं। नए नियमों के अनुसार फॉर्म भरते समय लाइव वेबकैम से बिना चश्मे के फोटो खींचनी होती है। टियर-2 परीक्षा के बाद पोस्ट प्रेफरेंस ऑनलाइन भरना होता है। पुलिस विभाग and यूनिफॉर्म पदों के लिए फिजिकल टेस्ट होता है।',
    relatedDocSprintProfiles: ['ssc-cgl'],
    disclaimer: 'Staff Selection Commission guidelines apply. Check ssc.gov.in.'
  },
  {
    id: 'upsc-cse-cycle',
    title: 'UPSC Civil Services Examination (IAS/IPS)',
    appliesTo: {
      stage: 'after-ug',
      state: 'National'
    },
    officialPortal: {
      name: 'upsc.gov.in',
      url: 'https://www.upsc.gov.in',
      sourceUrl: 'https://upsconline.nic.in',
      lastVerifiedDate: '2026-02-15'
    },
    steps: [
      {
        order: 1,
        title: 'OTR Registration & Prelims Application',
        description: 'Complete OTR on UPSC portal and upload your photo and signature. Photo must be taken within 10 days of application launch and show candidate name and date of photo.',
        timingWindow: 'Opens in February annually for 20 days.',
        actionType: 'online-form',
        documentsNeeded: [
          {
            name: 'Passport Photo (with Name & Date, 20-300kb)',
            docSprintStudio: 'photo',
            originalOrPhotocopy: 'original',
            printCopies: 2
          },
          {
            name: 'Signature Scan (20-300kb)',
            docSprintStudio: 'signature',
            originalOrPhotocopy: 'original',
            printCopies: 1
          }
        ],
        tips: [
          'Photo must have your name and date of photo printed at the bottom. The background must be light-coloured.'
        ],
        studyGuide: {
          syllabus: [
            'Eligibility: Candidate must hold a degree of any of the Universities incorporated by an Act of the Central or State Legislature in India.'
          ],
          resources: [
            'UPSC Online OTR Help Manuals.'
          ]
        }
      },
      {
        order: 2,
        title: 'Civil Services Prelims Exam',
        description: 'Appear for General Studies I and CSAT (qualifying) at designated offline offline test centers.',
        timingWindow: 'Held in late May or June.',
        actionType: 'wait',
        documentsNeeded: [],
        tips: [
          'Bring a black ballpoint pen to fill the OMR sheets.'
        ],
        studyGuide: {
          syllabus: [
            'Paper I (GS) - 200 Marks: Indian Polity, Indian Economy, Geography, History, Art & Culture, Environment, General Science, Current Affairs.',
            'Paper II (CSAT) - 200 Marks (33% Qualifying): Mental Ability, Logical Reasoning, Comprehension.'
          ],
          resources: [
            'Polity: Indian Polity by M. Laxmikanth.',
            'Economics: Mrunal Patel economics video playlists on YouTube.',
            'History: Brief History of Modern India by Rajiv Ahir (Spectrum Publications).',
            'Environment: PMF IAS or Shankar IAS book.',
            'Daily updates: Insights on India, IASbaba free daily quiz capsule portals.'
          ]
        }
      },
      {
        order: 3,
        title: 'Mains Detailed Application Form (DAF-I) & Exam',
        description: 'Shortlisted candidates submit DAF-I containing detail of reservation, family background, and academic history, then sit for 9 subjective papers.',
        timingWindow: 'DAF-I in July; Mains exam in September.',
        actionType: 'document-upload',
        documentsNeeded: [
          {
            name: 'Class 10 Certificate (DOB Proof)',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'both',
            printCopies: 2
          },
          {
            name: 'Graduation Degree & Caste Certificate',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'both',
            printCopies: 2
          }
        ],
        tips: [
          'Upload documents in Central PDF format under 2MB. Use PDF Toolkit to scale down.'
        ],
        studyGuide: {
          syllabus: [
            'Paper A & B (Qualifying Languages): English + Indian Language (300 Marks each).',
            'Paper I (Essay): 250 Marks.',
            'Paper II (GS I): History, Geography, Society.',
            'Paper III (GS II): Governance, Constitution, Polity, IR.',
            'Paper IV (GS III): Tech, Economic Dev, Biodiversity, Security, Disaster Management.',
            'Paper V (GS IV): Ethics, Integrity, Aptitude.',
            'Paper VI & VII: Optional Subject Papers (Paper I & II, 250 marks each).'
          ],
          resources: [
            'Free Monthly Magazines: Vision IAS free monthly current affairs booklets.',
            'Free YouTube lectures: Sleepy Classes IAS playlists (covers GS syllabus systematically for free).'
          ]
        }
      },
      {
        order: 4,
        title: 'DAF-II Submission & Personality Test (Interview)',
        description: 'Submit DAF-II detailing hobby, achievement, extra-curriculars, and service cadre preferences (e.g. IAS home cadre). Report to Dholpur House, New Delhi for interview.',
        timingWindow: 'Held from Jan to April.',
        actionType: 'in-person-report',
        documentsNeeded: [
          {
            name: 'DAF-I & DAF-II printed forms',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'both',
            printCopies: 6
          },
          {
            name: 'Interview Call Letter',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'photocopy',
            printCopies: 2
          }
        ],
        tips: [
          'Bring 2 sets of self-attested photocopies of all academic, age, and reservation certificates to the verification desk.'
        ]
      }
    ],
    commonMistakes: [
      'Uploading photo without name and date printed: Leads to rejection of the Prelims application.',
      'Caste certificate issued after the application closing date: UPSC rejects reservation benefits and evaluates candidate under general category.'
    ],
    parentSummary: 'UPSC सिविल सेवा (IAS/IPS) परीक्षा में शामिल होने के लिए OTR पर रजिस्टर करना होता है। फोटो पर उम्मीदवार का नाम and फोटो खींचने की तारीख प्रिंट होनी चाहिए। मुख्य परीक्षा के समय DAF-1 फॉर्म and इंटरव्यू के पहले DAF-2 फॉर्म ऑनलाइन भरना होता है। इंटरव्यू के दिन ढोलपुर हाउस (दिल्ली) में डाक्यूमेंट्स का भौतिक सत्यापन होता है।',
    relatedDocSprintProfiles: [],
    disclaimer: 'Union Public Service Commission notifications apply. Check upsc.gov.in.'
  },
  {
    id: 'student-passport',
    title: 'Student Passport Application Process',
    appliesTo: {
      stage: 'cross-cutting',
      state: 'National'
    },
    officialPortal: {
      name: 'passportindia.gov.in',
      url: 'https://www.passportindia.gov.in',
      sourceUrl: 'https://www.passportindia.gov.in/AppOnlineProject/welcomeLink',
      lastVerifiedDate: '2026-02-10'
    },
    steps: [
      {
        order: 1,
        title: 'Online Registration & Application Form 1 Submission',
        description: 'Register on the Passport Seva online portal. Fill in personal details, current/permanent address history of past 1 year, and details of two references.',
        timingWindow: 'Year-round online registration.',
        actionType: 'online-form',
        documentsNeeded: [],
        tips: [
          'Choose "Non-ECR" category if you have passed Class 10 or higher. This exempts you from emigration checks.'
        ],
        studyGuide: {
          syllabus: [
            'Eligibility: Any Indian citizen. Minors (under 18) require parent consent letters.',
            'Address Proof Criteria: Aadhaar, Electricity Bill, Water Bill, or Active Bank Passbook with photo.'
          ],
          resources: [
            'Official Passport India Document Advisor tool link.'
          ]
        }
      },
      {
        order: 2,
        title: 'Fee Payment & PSK Slot Booking',
        description: 'Pay the application fee of ₹1500 online (via SBI netbanking/card) and select a date & slot at your nearest Passport Seva Kendra (PSK) or Post Office PSK (POPSK).',
        timingWindow: 'Completed immediately after online form submission.',
        actionType: 'payment',
        documentsNeeded: [
          {
            name: 'Online Payment Receipt Printout',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'photocopy',
            printCopies: 2
          }
        ],
        tips: [
          'If you miss the appointment, you can reschedule up to 3 times within 12 months of payment.'
        ]
      },
      {
        order: 3,
        title: 'Physical PSK Visit & Document Verification',
        description: 'Report physically to the PSK center at your slot time. Pass through Counter A (biometrics & photo capture), Counter B (document verification by officers), and Counter C (granting officer approval).',
        timingWindow: 'Takes 2-3 hours on the day of appointment.',
        actionType: 'in-person-report',
        documentsNeeded: [
          {
            name: 'Aadhaar Card (Original)',
            originalOrPhotocopy: 'original',
            printCopies: 1
          },
          {
            name: 'Class 10 Passing Certificate (Non-ECR proof)',
            originalOrPhotocopy: 'original',
            printCopies: 1
          },
          {
            name: 'College ID Card & Bonafide Letter (Student proof)',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'both',
            printCopies: 2
          }
        ],
        tips: [
          'Students staying away from home can apply from their college city by providing college bonafide letters and hostel address proofs.'
        ]
      },
      {
        order: 4,
        title: 'Police Verification & Delivery',
        description: 'Local police station officers visit your residence or call you to verify your local stay and check for criminal records. Once cleared, the passport is printed and dispatched.',
        timingWindow: 'Completed within 10-15 days after PSK clearance.',
        actionType: 'wait',
        documentsNeeded: [
          {
            name: 'Verification Witness statements (from 2 neighbors)',
            originalOrPhotocopy: 'original',
            printCopies: 1
          }
        ],
        tips: [
          'Keep your neighbor references ready to sign the verification statement if visited by police officers.'
        ]
      }
    ],
    commonMistakes: [
      'Incorrect spelling of parents names or birth place: Ensure names match your Class 10 certificate exactly.',
      'Failing to disclose address history of the past 1 year: If you stayed in 2 different cities, you must list both addresses.'
    ],
    parentSummary: 'पासपोर्ट बनवाने के लिए पहले सरकारी वेबसाइट पर ₹1500 फीस भरकर PSK का अपॉइंटमेंट बुक किया जाता है। नियत दिन केंद्र पर जाकर बायोमेट्रिक्स and दस्तावेजों का सत्यापन करवाना होता है। छात्रों को कॉलेज का बोनाफाइड लेटर ले जाना फायदेमंद होता है। इसके बाद पुलिस वेरिफिकेशन होता है and डाक से पासपोर्ट घर आ जाता है।',
    relatedDocSprintProfiles: ['india-passport-renewal'],
    disclaimer: 'Passport processing follows Ministry of External Affairs regulations. Verify on passportindia.gov.in.'
  },
  {
    id: 'driving-license',
    title: 'Driving License (DL) Application Journey',
    appliesTo: {
      stage: 'cross-cutting',
      state: 'National'
    },
    officialPortal: {
      name: 'sarathi.parivahan.gov.in',
      url: 'https://sarathi.parivahan.gov.in',
      sourceUrl: 'https://parivahan.gov.in/parivahan//en/content/driving-licence-0',
      lastVerifiedDate: '2026-04-10'
    },
    steps: [
      {
        order: 1,
        title: 'Learner\'s License (LL) Online Application',
        description: 'Apply online on the Sarathi portal. Upload age and address proofs, pay the learner\'s license fee (approx ₹150-₹300), and schedule the LL test.',
        timingWindow: 'Active year-round.',
        actionType: 'online-form',
        documentsNeeded: [
          {
            name: 'Aadhaar Card or Birth Certificate (Age Proof)',
            originalOrPhotocopy: 'both',
            printCopies: 1
          },
          {
            name: 'Physical Fitness Declaration Form 1',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'original',
            printCopies: 1
          }
        ],
        tips: [
          'Choose Aadhaar-based authentication (e-KYC) to attempt the LL test online from home without visiting the RTO office.'
        ],
        studyGuide: {
          syllabus: [
            'Eligibility: Minimum 16 years for gearless two-wheeler up to 50cc; 18 years for geared vehicles and cars.',
            'LL Test Pattern: 15-20 MCQs on road signs, traffic regulations, and driver duties. Passing score is 60%.'
          ],
          resources: [
            'Official RTO Road Signs PDF manual.',
            'Sarathi portal free LL Mock Test practice quizzes.'
          ]
        }
      },
      {
        order: 2,
        title: 'Online LL MCQ Exam & Getting LL',
        description: 'Attempt the LL test online or at RTO. Upon passing, download your Learner\'s License copy from the Sarathi dashboard.',
        timingWindow: 'LL is issued immediately upon passing. Valid for 6 months.',
        actionType: 'wait',
        documentsNeeded: [
          {
            name: 'Learner\'s License Printout copy',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'photocopy',
            printCopies: 2
          }
        ],
        tips: [
          'You can apply for a Permanent DL only after completing 30 days from the date of LL issuance.'
        ]
      },
      {
        order: 3,
        title: 'Permanent DL Application & Test Booking',
        description: 'Apply online for a Permanent DL on the Sarathi portal, pay the DL test fee (approx ₹700-₹1000), and book a driving track test slot at RTO.',
        timingWindow: 'Apply after 30 days and before 180 days of LL issue.',
        actionType: 'payment',
        documentsNeeded: [
          {
            name: 'Valid Learner\'s License copy',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'both',
            printCopies: 1
          }
        ],
        tips: [
          'Practice driving inside test tracks (usually "8" shape for 2-wheelers and "H" or parallel parking for 4-wheelers).'
        ]
      },
      {
        order: 4,
        title: 'RTO Track Driving Test & Approval',
        description: 'Report to the RTO track with your vehicle, Learner\'s License, and call letter. Drive on the track under officer supervision.',
        timingWindow: 'Completed on the booked appointment day.',
        actionType: 'in-person-report',
        documentsNeeded: [
          {
            name: 'Driving Test Slot Booking slip',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'photocopy',
            printCopies: 2
          },
          {
            name: 'Vehicle RC & Valid Insurance certificates',
            originalOrPhotocopy: 'original',
            printCopies: 1
          }
        ],
        tips: [
          'Ensure the vehicle has a valid PUCC (Pollution Under Control) certificate and proper "L" board sticker.'
        ]
      }
    ],
    commonMistakes: [
      'Missing the 180-day expiry window of Learner\'s License: You will have to re-apply for LL and take the MCQ test again.',
      'Failing to show proper hand signals or safety helmet/seatbelt during the track test, leading to instant failure.'
    ],
    parentSummary: 'ड्राइविंग लाइसेंस (DL) के लिए पहले ऑनलाइन आवेदन कर ₹150 फीस भरकर लर्नर लाइसेंस (LL) टेस्ट पास करना होता है। इसके 30 दिन बाद स्थायी DL के लिए आवेदन कर RTO ट्रैक टेस्ट बुक किया जाता है। RTO ट्रैक पर गाड़ी चलाकर पास होने पर स्थायी लाइसेंस डाक से घर भेज दिया जाता है।',
    relatedDocSprintProfiles: [],
    disclaimer: 'RTO regulations and DL track layouts vary across states. Confirm on sarathi.parivahan.gov.in.'
  },
  {
    id: 'pan-card',
    title: 'Instant PAN Card (e-PAN & Physical) Application',
    appliesTo: {
      stage: 'cross-cutting',
      state: 'National'
    },
    officialPortal: {
      name: 'tin-nsdl.com',
      url: 'https://www.tin-nsdl.com',
      sourceUrl: 'https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html',
      lastVerifiedDate: '2026-03-01'
    },
    steps: [
      {
        order: 1,
        title: 'Form 49A Online Submission & e-KYC',
        description: 'Fill Form 49A online choosing "Individual" and "Aadhaar e-KYC" mode to link details automatically without sending physical files.',
        timingWindow: 'Year-round application.',
        actionType: 'online-form',
        documentsNeeded: [
          {
            name: 'Aadhaar Card (linked with mobile number)',
            originalOrPhotocopy: 'original',
            printCopies: 1
          }
        ],
        tips: [
          'Your mobile number must be linked with Aadhaar to receive the e-Sign OTP.'
        ]
      },
      {
        order: 2,
        title: 'Fee Payment & OTP Verification',
        description: 'Pay ₹107 online for a physical PAN Card + e-PAN, or ₹66 for e-PAN only. Enter the OTP sent to your Aadhaar-linked mobile.',
        timingWindow: 'Completed during registration.',
        actionType: 'payment',
        documentsNeeded: [],
        tips: [
          'Verify that your name, date of birth, and gender in Aadhaar are correct before starting.'
        ]
      },
      {
        order: 3,
        title: 'Instant e-PAN Download & Delivery',
        description: 'Upon OTP validation, the Income Tax department generates your PAN number. Download the password-protected e-PAN PDF.',
        timingWindow: 'Issued within 10 minutes to 2 hours of payment.',
        actionType: 'wait',
        documentsNeeded: [],
        tips: [
          'The password to open your e-PAN PDF is your Date of Birth in DDMMYYYY format.'
        ]
      }
    ],
    commonMistakes: [
      'Mismatch in Aadhaar details: If Aadhaar name spelling differs from your school boards, get Aadhaar corrected first.',
      'Mobile number not linked: You cannot use instant e-KYC without Aadhaar OTP authentication.'
    ],
    parentSummary: 'पैन कार्ड (PAN) बनवाने के लिए आधार कार्ड से जुड़े मोबाइल नंबर पर OTP द्वारा ऑनलाइन वेरिफिकेशन किया जाता है। आवेदन के कुछ घंटों के भीतर e-PAN PDF डाउनलोड के लिए तैयार हो जाता है और फिजिकल कार्ड 10-15 दिनों में डाक से घर आ जाता है।',
    relatedDocSprintProfiles: [],
    disclaimer: 'Income Tax Department rules apply. Check tin-nsdl.com.'
  },
  {
    id: 'mh-cet-engineering',
    title: 'Maharashtra Engineering (B.E/B.Tech) CAP Admission',
    appliesTo: {
      stage: 'after-12th',
      state: 'Maharashtra',
      board: ['HSC', 'CBSE']
    },
    officialPortal: {
      name: 'cetcell.mahacet.org',
      url: 'https://cetcell.mahacet.org',
      sourceUrl: 'https://cetcell.mahacet.org/help',
      lastVerifiedDate: '2026-05-15'
    },
    steps: [
      {
        order: 1,
        title: 'MHT-CET Result & Score Card Download',
        description: 'MHT-CET results are declared. Log in to download your scorecard. Verify percentile scores for PCM (Physics, Chemistry, Math).',
        timingWindow: 'Declared within 3-4 weeks of exam conclusion.',
        actionType: 'online-form',
        documentsNeeded: [
          {
            name: 'MHT-CET Score Card',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'both',
            printCopies: 3
          }
        ],
        tips: [
          'Ensure the score card prints clearly with your roll number and category visible.'
        ]
      },
      {
        order: 2,
        title: 'CAP Registration & Document Upload',
        description: 'Create profile on the CAP portal. Enter CET scores, Class 12 board marks, and upload required verification documents.',
        timingWindow: 'Opens 5-7 days after results; stays active for 10-12 days.',
        actionType: 'document-upload',
        documentsNeeded: [
          {
            name: 'MHT-CET Score Card & Admit Card',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'both',
            printCopies: 2
          },
          {
            name: 'Class 12 (HSC) Marksheet',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'both',
            printCopies: 3
          },
          {
            name: 'Domicile Certificate of Maharashtra',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'both',
            printCopies: 2
          }
        ],
        tips: [
          'Upload documents in clear PDF format between 50KB to 300KB. Use PDF Toolkit to scale down files if needed.'
        ]
      },
      {
        order: 3,
        title: 'E-Scrutiny or Physical Document Verification',
        description: 'Choose E-Scrutiny (online verification by officers) or report physically to a Facilitation Centre (FC) for document stamp verification.',
        timingWindow: 'Runs parallel to CAP registration + 2 days.',
        actionType: 'in-person-report',
        documentsNeeded: [
          {
            name: 'Original set of uploaded certificates',
            originalOrPhotocopy: 'original',
            printCopies: 1
          },
          {
            name: 'FC Verified Acknowledgment Receipt',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'both',
            printCopies: 2
          }
        ],
        tips: [
          'If you choose E-Scrutiny, check the portal daily for any verification query/grievance raised by the scrutiny officer.'
        ]
      },
      {
        order: 4,
        title: 'CAP Choice Filling & Option Locking',
        description: 'Submit your college and stream preferences (e.g. COEP Computer Science, VJTI IT) on the portal.',
        timingWindow: 'Active for 3-4 days after final merit list.',
        actionType: 'online-form',
        documentsNeeded: [],
        tips: [
          'You can enter up to 300 choices. List dream choices first, followed by realistic backups.',
          'Crucial: You must lock your preferences. Unconfirmed option forms are automatically discarded.'
        ]
      },
      {
        order: 5,
        title: 'Seat Allocation & Reporting (Freeze/Float)',
        description: 'Check allocation status. If seat is allotted, select "Freeze" to accept or "Auto-Freeze" (if 1st preference) or "Float/Betterment" to wait for next rounds.',
        timingWindow: 'Active for 3 days from allocation release.',
        actionType: 'payment',
        documentsNeeded: [
          {
            name: 'Allotment Letter printout',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'both',
            printCopies: 2
          }
        ],
        tips: [
          'Pay the Seat Acceptance Fee of ₹1000 online to remain in the CAP process.'
        ]
      }
    ],
    commonMistakes: [
      'Not paying the seat acceptance fee: You will be kicked out of CAP and not considered for any subsequent rounds.',
      'Failing to verify documents at FC: If your documents are not verified, you will not receive a merit rank.'
    ],
    parentSummary: 'महाराष्ट्र इंजीनियरिंग एडमिशन (B.E/B.Tech) में MHT-CET रिजल्ट के बाद CAP पोर्टल पर रजिस्टर करना होता है। इसमें 12वीं की मार्कशीट, डोमिसाइल and स्कोरकार्ड अपलोड करके FC सेंटर से वेरिफाई करवाना होता है। इसके बाद कॉलेज चॉइस लॉक की जाती है। पहली पसंद का कॉलेज मिलने पर ऑटो-फ्रीज हो जाता है, वरना आप ₹1000 भरकर फ्लोट (बेहतर कॉलेज के लिए प्रयास) कर सकते हैं।',
    relatedDocSprintProfiles: ['mah-cet'],
    disclaimer: 'Maharashtra DTE/CET Cell schedules shift often. Verify on cetcell.mahacet.org.'
  },
  {
    id: 'josaa-iit',
    title: 'IIT/NIT JoSAA & CSAB Admission Journey',
    appliesTo: {
      stage: 'after-12th',
      state: 'National',
      board: ['CBSE', 'ICSE', 'HSC']
    },
    officialPortal: {
      name: 'josaa.nic.in',
      url: 'https://josaa.nic.in',
      sourceUrl: 'https://josaa.nic.in/help',
      lastVerifiedDate: '2026-05-01'
    },
    steps: [
      {
        order: 1,
        title: 'JEE Advanced Results & JoSAA Registration',
        description: 'Log in to JoSAA portal using JEE Main/Advanced credentials. Confirm your basic academic and contact information.',
        timingWindow: 'Starts 1-2 days after JEE Advanced results declaration.',
        actionType: 'online-form',
        documentsNeeded: [],
        tips: [
          'No registration fee is charged during registration and choice filling.'
        ]
      },
      {
        order: 2,
        title: 'Choice Filling & Lock Preferences',
        description: 'Choose branches across 23 IITs, 31 NITs, 26 IIITs and other GFTIs. Fill as many choices as you wish in order of preference.',
        timingWindow: 'Stays open for 10 days; choice locking occurs on the final day.',
        actionType: 'online-form',
        documentsNeeded: [],
        tips: [
          'Analyze cut-off trends of previous years. Lock choices before the timer ends, or they will be auto-locked.'
        ]
      },
      {
        order: 3,
        title: 'Mock Seat Allocations',
        description: 'JoSAA runs mock allocations to show you what college you might get based on current preferences of all candidates.',
        timingWindow: 'Released twice during the choice filling period.',
        actionType: 'wait',
        documentsNeeded: [],
        tips: [
          'Use mock results to rearrange and optimize your choice rankings before final locking.'
        ]
      },
      {
        order: 4,
        title: 'Seat Allotment & Online Reporting',
        description: 'If allocated a seat, accept it by uploading documents online, paying the seat acceptance fee, and responding to queries.',
        timingWindow: 'Active for 3-4 days after each round (6 rounds total).',
        actionType: 'document-upload',
        documentsNeeded: [
          {
            name: 'Class 10 Certificate (Date of Birth proof)',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'both',
            printCopies: 2
          },
          {
            name: 'Class 12 Marksheet & Passing Certificate',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'both',
            printCopies: 3
          },
          {
            name: 'Medical Certificate (in JoSAA Format)',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'original',
            printCopies: 1
          }
        ],
        tips: [
          'Download the medical certificate format from JoSAA website, get it signed by a registered practitioner, and scan cleanly.'
        ]
      }
    ],
    commonMistakes: [
      'Uploading blurred documents: Leads to query generation. Failure to respond to the query within 24 hours cancels allotment.',
      'Forgetting to withdraw: If you want to exit to take state CET admissions, do it before the final round or your seat acceptance fee is forfeited.'
    ],
    parentSummary: 'JoSAA प्रक्रिया से IIT, NIT and IIIT में प्रवेश मिलता है। JEE Advanced रिजल्ट के बाद पोर्टल पर कॉलेज and ब्रांच की चॉइस लॉक करनी होती है। सीट अलॉट होने पर ऑनलाइन रिपोर्टिंग करनी होती है, जिसमें मेडिकल सर्टिफिकेट, 10वीं-12वीं की मार्कशीट अपलोड करनी होती है and सीट एक्सेप्टेंस फीस ऑनलाइन भरनी होती है।',
    relatedDocSprintProfiles: ['jee-main'],
    disclaimer: 'IIT/NIT admissions follow strict JoSAA deadlines. Cross-check on josaa.nic.in.'
  },
  {
    id: 'generic-fallback',
    title: 'General Admission / Recruitment Process',
    appliesTo: {
      stage: 'cross-cutting'
    },
    officialPortal: {
      name: 'State Education Portal',
      url: 'https://india.gov.in/topics/education',
      sourceUrl: 'https://india.gov.in',
      lastVerifiedDate: '2026-01-01'
    },
    steps: [
      {
        order: 1,
        title: 'Online Application & Profile Creation',
        description: 'Register on the designated portal, enter academic scores, and upload identity/address verification documents.',
        timingWindow: 'Typically opens within a week of board/university results declaration.',
        actionType: 'online-form',
        documentsNeeded: [
          {
            name: 'Recent Passport Photograph',
            docSprintStudio: 'photo',
            originalOrPhotocopy: 'original',
            printCopies: 2
          },
          {
            name: 'Candidate Signature Scan',
            docSprintStudio: 'signature',
            originalOrPhotocopy: 'original',
            printCopies: 1
          },
          {
            name: 'Prior Marksheet / Certificate scan',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'both',
            printCopies: 2
          }
        ],
        tips: [
          'Verify target file sizes and formats (JPG/PDF) before uploading. Use DocSprint to compress files into target limits.'
        ]
      },
      {
        order: 2,
        title: 'Choice Filling & Lock Preferences',
        description: 'Choose your desired courses/colleges/posts and lock your choices in descending order of priority.',
        timingWindow: 'Opens immediately after registration closes; active for 4-5 days.',
        actionType: 'online-form',
        documentsNeeded: [],
        tips: [
          'Check previous cut-offs to optimize your choice list. Make sure to lock choices; unlocked preferences may not register.'
        ]
      },
      {
        order: 3,
        title: 'Merit List Publication & Seat Allotment',
        description: 'The central system releases merit lists. Candidates check portal dashboards for allotments.',
        timingWindow: 'Announced 7-10 days after choice locking.',
        actionType: 'wait',
        documentsNeeded: [
          {
            name: 'Allotment Letter / Call Letter',
            docSprintStudio: 'pdf',
            originalOrPhotocopy: 'photocopy',
            printCopies: 2
          }
        ],
        tips: [
          'Keep your login details ready. Download and print the allotment letter immediately upon release.'
        ]
      },
      {
        order: 4,
        title: 'Campus Verification & Fee Submission',
        description: 'Report physically to the college/office, present original certificates for verification, and pay admission/joining fees.',
        timingWindow: 'Must be completed within a strict 3-4 day confirmation window.',
        actionType: 'in-person-report',
        documentsNeeded: [
          {
            name: 'Original Marksheets & Certificates',
            originalOrPhotocopy: 'original',
            printCopies: 1
          },
          {
            name: 'Photocopy Sets of All Documents',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'photocopy',
            printCopies: 3
          },
          {
            name: 'Fee Draft / Transaction Receipt',
            docSprintStudio: 'document',
            originalOrPhotocopy: 'both',
            printCopies: 2
          }
        ],
        tips: [
          'Always keep digital copies of all files in your device. Never hand over originals without collecting a receipt.'
        ]
      }
    ],
    commonMistakes: [
      'Missing the seat acceptance window: Leads to automatic cancellation of the seat.',
      'Incorrect document dimensions or formats during portal upload, resulting in rejection.'
    ],
    parentSummary: 'सामान्य एडमिशन प्रक्रिया में पहले ऑनलाइन फॉर्म भरकर दस्तावेज अपलोड करने होते हैं, फिर कॉलेज and कोर्स की पसंद लॉक करनी होती है। मेरिट लिस्ट आने पर अलॉटेड कॉलेज में जाकर डाक्यूमेंट्स वेरिफाई करवाने होते हैं and नियत तिथि के भीतर फीस जमा कर एडमिशन कंफर्म करना होता है। सभी दस्तावेजों की एक्स्ट्रा फोटोकॉपी अपने पास रखें।',
    relatedDocSprintProfiles: [],
    disclaimer: 'Admission rules and schedules are subject to local authorities. Always cross-verify on official state portals.'
  }
];
