/**
 * =============================================================================
 * Module: Doctor Directory Seed Data (SYNTHETIC / PLACEHOLDER)
 * Component: /app/backend/seeds/doctorSeedData.js
 * Description: Synthetic seed dataset of poultry veterinarians covering all
 *              64 districts of Bangladesh. This data is PLACEHOLDER only —
 *              do NOT use real doctor names, license numbers, or contact info.
 *              Replace with real data before production deployment.
 * =============================================================================
 */

'use strict';

// All 64 districts of Bangladesh
const ALL_DISTRICTS = [
  'Bagerhat', 'Bandarban', 'Barguna', 'Barishal', 'Bhola',
  'Bogura', 'Brahmanbaria', 'Chandpur', 'Chapainawabganj', 'Chattogram',
  'Chuadanga', 'Comilla', 'Cox\'s Bazar', 'Dhaka', 'Dinajpur',
  'Faridpur', 'Feni', 'Gaibandha', 'Gazipur', 'Gopalganj',
  'Habiganj', 'Jamalpur', 'Jashore', 'Jhalokati', 'Jhenaidah',
  'Joypurhat', 'Khagrachari', 'Khulna', 'Kishoreganj', 'Kurigram',
  'Kushtia', 'Lakshmipur', 'Lalmonirhat', 'Madaripur', 'Magura',
  'Manikganj', 'Meherpur', 'Moulvibazar', 'Munshiganj', 'Mymensingh',
  'Naogaon', 'Narail', 'Narayanganj', 'Narsingdi', 'Natore',
  'Nawabganj', 'Netrokona', 'Nilphamari', 'Noakhali', 'Pabna',
  'Panchagarh', 'Patuakhali', 'Pirojpur', 'Rajbari', 'Rajshahi',
  'Rangamati', 'Rangpur', 'Satkhira', 'Shariatpur', 'Sherpur',
  'Sirajganj', 'Sunamganj', 'Sylhet', 'Tangail'
];

const SPECIALTIES = [
  'Poultry Medicine & Surgery',
  'Avian Pathology',
  'Poultry Nutrition & Feed Management',
  'Epidemiology & Biosecurity',
  'Poultry Reproduction & Hatchery',
  'General Veterinary Medicine',
  'Avian Immunology & Vaccination',
  'Poultry Farm Management Consulting'
];

const FIRST_NAMES = [
  'Dr. Abdul', 'Dr. Mohammad', 'Dr. Fatima', 'Dr. Rashida', 'Dr. Kamal',
  'Dr. Nasreen', 'Dr. Habibur', 'Dr. Shamima', 'Dr. Rafiq', 'Dr. Ayesha',
  'Dr. Zahid', 'Dr. Sultana', 'Dr. Imran', 'Dr. Nusrat', 'Dr. Tariq',
  'Dr. Rehana', 'Dr. Sajid', 'Dr. Dilara', 'Dr. Mamun', 'Dr. Salma'
];

const LAST_NAMES = [
  'Rahman', 'Hossain', 'Akter', 'Khan', 'Begum', 'Islam', 'Ahmed',
  'Chowdhury', 'Ali', 'Miah', 'Uddin', 'Sultana', 'Khatun', 'Sarkar',
  'Siddiqui', 'Haque', 'Karim', 'Alam', 'Jahan', 'Bibi'
];

const LANGUAGES_OPTIONS = [
  ['Bengali', 'English'],
  ['Bengali'],
  ['Bengali', 'English', 'Hindi'],
  ['Bengali', 'English'],
  ['Bengali', 'Sylheti'],
  ['Bengali', 'Chittagonian', 'English']
];

// Deterministic pseudo-random for reproducibility
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function generateDoctors() {
  const doctors = [];
  let doctorId = 1;

  // Generate 2-3 doctors per district (ensuring all 64 districts are covered)
  for (let i = 0; i < ALL_DISTRICTS.length; i++) {
    const district = ALL_DISTRICTS[i];
    const doctorsInDistrict = (i % 3 === 0) ? 3 : 2; // Some districts get 3

    for (let j = 0; j < doctorsInDistrict; j++) {
      const seed = i * 100 + j;
      const firstName = FIRST_NAMES[(i * 3 + j * 7 + seed) % FIRST_NAMES.length];
      const lastName = LAST_NAMES[(i * 5 + j * 11 + seed + 3) % LAST_NAMES.length];
      const specialty = SPECIALTIES[(seed + 3) % SPECIALTIES.length];
      const yearsExp = 3 + Math.floor(seededRandom(seed * 17) * 25);
      const rating = (3.5 + seededRandom(seed * 31) * 1.5).toFixed(1);
      const videoFee = 300 + Math.floor(seededRandom(seed * 41) * 700);
      const visitFee = videoFee + 200 + Math.floor(seededRandom(seed * 53) * 500);
      const langs = LANGUAGES_OPTIONS[(seed + 2) % LANGUAGES_OPTIONS.length];

      // Simple weekly availability schedule
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const availableDays = daysOfWeek.filter((_, idx) => {
        // Each doctor is available 4-6 days/week
        return seededRandom(seed * 67 + idx) > 0.3;
      });
      const slots = availableDays.map(day => ({
        day,
        startTime: seededRandom(seed * 71 + daysOfWeek.indexOf(day)) > 0.5 ? '09:00' : '10:00',
        endTime: seededRandom(seed * 73 + daysOfWeek.indexOf(day)) > 0.5 ? '17:00' : '18:00'
      }));

      doctors.push({
        _id: `doc_${String(doctorId).padStart(4, '0')}`,
        name: `${firstName} ${lastName}`,
        district,
        specialty,
        qualification: 'DVM (Doctor of Veterinary Medicine)',
        yearsOfExperience: yearsExp,
        consultationFee: {
          video: videoFee,
          farmVisit: visitFee
        },
        languages: langs,
        rating: parseFloat(rating),
        totalReviews: 10 + Math.floor(seededRandom(seed * 89) * 200),
        photoUrl: null, // Placeholder — no real photos
        availability: slots,
        isSynthetic: true, // ⚠️ SYNTHETIC DATA FLAG — replace before production
        createdAt: new Date().toISOString()
      });

      doctorId++;
    }
  }

  return doctors;
}

const SEED_DOCTORS = generateDoctors();

module.exports = { SEED_DOCTORS, ALL_DISTRICTS };
