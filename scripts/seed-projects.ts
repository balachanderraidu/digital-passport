/**
 * Seed script: Populates the /projects Firestore collection with starter data.
 *
 * Usage (from repo root):
 *   npx ts-node -e "require('dotenv').config({path:'.env.local'})" scripts/seed-projects.ts
 *   OR use the Firebase Admin SDK with a service account key:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccount.json npx ts-node scripts/seed-projects.ts
 */

import * as admin from 'firebase-admin'

// Init Firebase Admin — uses GOOGLE_APPLICATION_CREDENTIALS env var
if (!admin.apps.length) {
  admin.initializeApp()
}

const db = admin.firestore()

// ─── Helper: generate searchKeywords array for a project name ─────────────────
// Produces all meaningful substrings so "bhooja" matches "Myhome Bhooja" etc.
function makeKeywords(name: string, developer: string, city: string): string[] {
  const words = `${name} ${developer} ${city}`.toLowerCase().split(/\s+/)
  const keywords = new Set<string>()
  for (const word of words) {
    for (let i = 1; i <= word.length; i++) {
      keywords.add(word.slice(0, i))
    }
    keywords.add(word)
  }
  return Array.from(keywords).filter((k) => k.length >= 2)
}

// ─── Project Data ──────────────────────────────────────────────────────────────

const projects: {
  id: string
  data: Omit<admin.firestore.DocumentData, 'id'>
  unitTypes: { id: string; data: admin.firestore.DocumentData }[]
}[] = [
  {
    id: 'myhome-bhooja',
    data: {
      name: 'Myhome Bhooja',
      city: 'Hyderabad',
      developer: 'Myhome Group',
      blocks: ['G', 'H', 'K', 'L', 'M', 'N', 'P', 'Q'],
      totalUnits: 1416,
      verified: false,
      searchKeywords: makeKeywords('Myhome Bhooja', 'Myhome Group', 'Hyderabad'),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    unitTypes: [
      {
        id: '2bhk-east',
        data: {
          label: '2BHK East',
          bedrooms: 2,
          bathrooms: 2,
          area: 1405,
          configuration: 'East-facing',
          floorRange: [3, 45],
          // Flat numbers ending in 01 or 02 on east side (example pattern)
          flatNumberPattern: '^[A-Z]?\\d{2,4}0[12]$',
          genericDocs: [],
        },
      },
      {
        id: '2bhk-west',
        data: {
          label: '2BHK West',
          bedrooms: 2,
          bathrooms: 2,
          area: 1420,
          configuration: 'West-facing',
          floorRange: [3, 45],
          flatNumberPattern: '^[A-Z]?\\d{2,4}0[34]$',
          genericDocs: [],
        },
      },
      {
        id: '25bhk-east',
        data: {
          label: '2.5BHK East',
          bedrooms: 2,
          bathrooms: 2,
          area: 1625,
          configuration: 'East-facing',
          floorRange: [3, 45],
          flatNumberPattern: '^[A-Z]?\\d{2,4}0[56]$',
          genericDocs: [],
        },
      },
      {
        id: '25bhk-west',
        data: {
          label: '2.5BHK West',
          bedrooms: 2,
          bathrooms: 2,
          area: 1640,
          configuration: 'West-facing',
          floorRange: [3, 45],
          flatNumberPattern: '^[A-Z]?\\d{2,4}0[78]$',
          genericDocs: [],
        },
      },
      {
        id: '3bhk-east',
        data: {
          label: '3BHK East',
          bedrooms: 3,
          bathrooms: 3,
          area: 1850,
          configuration: 'East-facing',
          floorRange: [3, 45],
          // e.g. 3301 (floor 33, unit 01) on east
          flatNumberPattern: '^[A-Z]?\\d{2,4}(0[12]|[12][13])$',
          genericDocs: [],
        },
      },
      {
        id: '3bhk-west',
        data: {
          label: '3BHK West',
          bedrooms: 3,
          bathrooms: 3,
          area: 1865,
          configuration: 'West-facing',
          floorRange: [3, 45],
          flatNumberPattern: '^[A-Z]?\\d{2,4}(0[34]|[12][24])$',
          genericDocs: [],
        },
      },
      {
        id: '35bhk-east',
        data: {
          label: '3.5BHK East',
          bedrooms: 3,
          bathrooms: 4,
          area: 2150,
          configuration: 'East-facing',
          floorRange: [3, 45],
          flatNumberPattern: '^[A-Z]?\\d{2,4}(0[56]|[34][13])$',
          genericDocs: [],
        },
      },
      {
        id: '35bhk-west',
        data: {
          label: '3.5BHK West',
          bedrooms: 3,
          bathrooms: 4,
          area: 2165,
          configuration: 'West-facing',
          floorRange: [3, 45],
          flatNumberPattern: '^[A-Z]?\\d{2,4}(0[78]|[34][24])$',
          genericDocs: [],
        },
      },
      {
        id: '4bhk',
        data: {
          label: '4BHK',
          bedrooms: 4,
          bathrooms: 4,
          area: 2800,
          configuration: 'Corner unit',
          floorRange: [3, 45],
          flatNumberPattern: '^[A-Z]?\\d{2,4}(09|10)$',
          genericDocs: [],
        },
      },
    ],
  },
  {
    id: 'sas-crown',
    data: {
      name: 'SAS Crown',
      city: 'Hyderabad',
      developer: 'SAS Constructions',
      blocks: ['A', 'B', 'C'],
      totalUnits: 600,
      verified: false,
      searchKeywords: makeKeywords('SAS Crown', 'SAS Constructions', 'Hyderabad'),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    unitTypes: [
      {
        id: '2bhk',
        data: {
          label: '2BHK',
          bedrooms: 2,
          bathrooms: 2,
          area: 1250,
          configuration: 'Standard',
          floorRange: [2, 30],
          flatNumberPattern: '',
          genericDocs: [],
        },
      },
      {
        id: '3bhk',
        data: {
          label: '3BHK',
          bedrooms: 3,
          bathrooms: 3,
          area: 1750,
          configuration: 'Standard',
          floorRange: [2, 30],
          flatNumberPattern: '',
          genericDocs: [],
        },
      },
      {
        id: '4bhk',
        data: {
          label: '4BHK',
          bedrooms: 4,
          bathrooms: 4,
          area: 2600,
          configuration: 'Penthouse',
          floorRange: [28, 30],
          flatNumberPattern: '',
          genericDocs: [],
        },
      },
    ],
  },
  {
    id: 'prestige-elysian',
    data: {
      name: 'Prestige Elysian',
      city: 'Bengaluru',
      developer: 'Prestige Group',
      blocks: ['T1', 'T2', 'T3', 'T4'],
      totalUnits: 800,
      verified: false,
      searchKeywords: makeKeywords('Prestige Elysian', 'Prestige Group', 'Bengaluru'),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    unitTypes: [
      {
        id: '2bhk',
        data: {
          label: '2BHK',
          bedrooms: 2,
          bathrooms: 2,
          area: 1350,
          configuration: 'Standard',
          floorRange: [2, 35],
          flatNumberPattern: '',
          genericDocs: [],
        },
      },
      {
        id: '3bhk',
        data: {
          label: '3BHK',
          bedrooms: 3,
          bathrooms: 3,
          area: 1850,
          configuration: 'Standard',
          floorRange: [2, 35],
          flatNumberPattern: '',
          genericDocs: [],
        },
      },
      {
        id: '4bhk-penthouse',
        data: {
          label: '4BHK Penthouse',
          bedrooms: 4,
          bathrooms: 5,
          area: 3200,
          configuration: 'Penthouse',
          floorRange: [33, 35],
          flatNumberPattern: '',
          genericDocs: [],
        },
      },
    ],
  },
  {
    id: 'konkrete-one',
    data: {
      name: 'Konkrete One',
      city: 'Hyderabad',
      developer: 'Konkrete Developers',
      blocks: ['A', 'B'],
      totalUnits: 350,
      verified: false,
      searchKeywords: makeKeywords('Konkrete One', 'Konkrete Developers', 'Hyderabad'),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    unitTypes: [
      {
        id: '3bhk',
        data: {
          label: '3BHK',
          bedrooms: 3,
          bathrooms: 3,
          area: 2000,
          configuration: 'Standard',
          floorRange: [2, 25],
          flatNumberPattern: '',
          genericDocs: [],
        },
      },
      {
        id: '4bhk',
        data: {
          label: '4BHK',
          bedrooms: 4,
          bathrooms: 4,
          area: 3000,
          configuration: 'Luxury',
          floorRange: [20, 25],
          flatNumberPattern: '',
          genericDocs: [],
        },
      },
    ],
  },
]

// ─── Seeding Logic ─────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding projects database...\n')

  // Use a WriteBatch to perform all updates in a single network round-trip.
  // This significantly improves performance compared to awaiting each write individually.
  const batch = db.batch()

  for (const project of projects) {
    const projectRef = db.collection('projects').doc(project.id)
    batch.set(projectRef, project.data, { merge: true })
    console.log(`✅ Project: ${(project.data as { name: string }).name}`)

    for (const ut of project.unitTypes) {
      const utRef = projectRef.collection('unitTypes').doc(ut.id)
      batch.set(utRef, ut.data, { merge: true })
      console.log(`   └─ Unit type: ${(ut.data as { label: string }).label}`)
    }

    console.log('')
  }

  await batch.commit()
  console.log('🎉 Seeding complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err)
  process.exit(1)
})
