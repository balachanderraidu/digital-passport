/**
 * Reseed Myhome Bhooja unit types with correct specs from brochure.
 * Removes old 2BHK/2.5BHK placeholders; adds real 3BHK/3.5BHK/4BHK types.
 *
 * Run: node scripts/reseed-bhooja.js
 */
const admin = require('firebase-admin')

if (!admin.apps.length) {
  admin.initializeApp({ projectId: 'digital-passport-peroneira' })
}

const db = admin.firestore()

async function run() {
  const projectRef = db.collection('projects').doc('myhome-bhooja')
  const unitTypesCol = projectRef.collection('unitTypes')

  // Delete old placeholder types that were never correct for Bhooja
  const toDelete = ['2bhk-east', '2bhk-west', '25bhk-east', '25bhk-west']
  for (const id of toDelete) {
    await unitTypesCol.doc(id).delete()
    console.log(`Deleted: ${id}`)
  }

  // Real unit types from Myhome Bhooja brochure
  // Super built-up areas extracted from official brochure
  const unitTypes = [
    {
      id: '3bhk-east',
      label: '3BHK East',
      bedrooms: 3,
      bathrooms: 3,
      area: 2595,
      carpetArea: 0,
      superBuiltUpArea: 2595,
      configuration: 'East-facing',
      floorRange: [3, 45],
      flatNumberPattern: '^[A-Z]?-?\\d{2,4}0[12]$',
      genericDocs: [],
    },
    {
      id: '3bhk-west',
      label: '3BHK West',
      bedrooms: 3,
      bathrooms: 3,
      area: 2595,
      carpetArea: 0,
      superBuiltUpArea: 2595,
      configuration: 'West-facing',
      floorRange: [3, 45],
      flatNumberPattern: '^[A-Z]?-?\\d{2,4}0[34]$',
      genericDocs: [],
    },
    {
      id: '35bhk-east',
      label: '3.5BHK East',
      bedrooms: 3,
      bathrooms: 4,
      area: 2897,
      carpetArea: 0,
      superBuiltUpArea: 2897,
      configuration: 'East-facing',
      floorRange: [3, 45],
      flatNumberPattern: '^[A-Z]?-?\\d{2,4}0[56]$',
      genericDocs: [],
    },
    {
      id: '35bhk-west',
      label: '3.5BHK West',
      bedrooms: 3,
      bathrooms: 4,
      area: 2897,
      carpetArea: 0,
      superBuiltUpArea: 2897,
      configuration: 'West-facing',
      floorRange: [3, 45],
      flatNumberPattern: '^[A-Z]?-?\\d{2,4}0[78]$',
      genericDocs: [],
    },
    {
      id: '4bhk',
      label: '4BHK',
      bedrooms: 4,
      bathrooms: 5,
      area: 3489,
      carpetArea: 0,
      superBuiltUpArea: 3489,
      configuration: 'Corner unit',
      floorRange: [3, 45],
      flatNumberPattern: '^[A-Z]?-?\\d{2,4}(09|10)$',
      genericDocs: [],
    },
  ]

  for (const ut of unitTypes) {
    const { id, ...data } = ut
    await unitTypesCol.doc(id).set(data, { merge: true })
    console.log(`Set: ${data.label} (${data.area} sq ft)`)
  }

  console.log('\nDone! Myhome Bhooja reseeded with correct unit types.')
  process.exit(0)
}

run().catch((err) => {
  console.error('Failed:', err)
  process.exit(1)
})
