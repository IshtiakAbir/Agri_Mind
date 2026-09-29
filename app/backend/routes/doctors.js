/**
 * =============================================================================
 * Module: Doctor Directory & Appointment Booking Routes
 * Component: /app/backend/routes/doctors.js
 * Description: Search/filter poultry veterinarians by district, specialty,
 *              and availability. Create, list, update, and cancel appointments.
 *              Uses SYNTHETIC seed data (see isSynthetic flag on doctor records).
 * =============================================================================
 */

'use strict';

const express = require('express');
const router = express.Router();
const { SEED_DOCTORS, ALL_DISTRICTS } = require('../seeds/doctorSeedData');

// In-memory appointment store
const appointments = new Map();
let appointmentCounter = 3;

// Seed initial realistic appointments so Admin Panel and User can see appointments immediately
appointments.set('appt_000001', {
  _id: 'appt_000001',
  farmerId: '65fc20a1b900000000000001',
  farmerName: 'Mohammad Rahman',
  farmerMobile: '01712345678',
  farmerPhone: '01712345678',
  doctorId: 'doc_0001',
  doctorName: 'Dr. Abdul Rahman',
  doctorDistrict: 'Dhaka',
  doctorSpecialty: 'Poultry Medicine & Surgery',
  type: 'farm_visit',
  status: 'pending',
  scheduledAt: new Date(Date.now() + 86400000 * 2).toISOString(),
  preferredDateWindow: 'Morning 10am - 12pm',
  farmAddress: 'Green Valley Agro, Joydebpur, Gazipur',
  meetingLink: null,
  fee: 800,
  notes: 'Shed 1 broilers showing mild respiratory rales and sneezing.',
  createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  updatedAt: new Date(Date.now() - 3600000 * 12).toISOString()
});

appointments.set('appt_000002', {
  _id: 'appt_000002',
  farmerId: 'guest',
  farmerName: 'Rafiqul Islam',
  farmerMobile: '01733221100',
  farmerPhone: '01733221100',
  doctorId: 'doc_0002',
  doctorName: 'Dr. Fatima Hossain',
  doctorDistrict: 'Gazipur',
  doctorSpecialty: 'Avian Pathology',
  type: 'video',
  status: 'confirmed',
  scheduledAt: new Date(Date.now() + 86400000).toISOString(),
  preferredDateWindow: null,
  farmAddress: null,
  meetingLink: 'https://meet.agrimind.app/vet-consult-000002',
  fee: 350,
  notes: 'Need expert review of post-mortem liver lesions in layer flock.',
  createdAt: new Date(Date.now() - 3600000 * 36).toISOString(),
  updatedAt: new Date(Date.now() - 3600000 * 4).toISOString()
});

// ─── GET /api/doctors ─────────────────────────────────────────────────────────
// Search/filter doctors. Query params: district, specialty, search, page, limit
router.get('/', (req, res) => {
  try {
    const { district, specialty, search, page = 1, limit = 20, includeInactive } = req.query;
    let filtered = [...SEED_DOCTORS];

    // Filter out deactivated doctors for public search
    if (includeInactive !== 'true') {
      filtered = filtered.filter(d => d.active !== false && d.isActive !== false);
    }

    if (district) {
      filtered = filtered.filter(d =>
        d.district.toLowerCase() === district.toLowerCase()
      );
    }

    if (specialty) {
      filtered = filtered.filter(d =>
        d.specialty.toLowerCase().includes(specialty.toLowerCase())
      );
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.district.toLowerCase().includes(q) ||
        d.specialty.toLowerCase().includes(q)
      );
    }

    const total = filtered.length;
    const start = (parseInt(page) - 1) * parseInt(limit);
    const paginated = filtered.slice(start, start + parseInt(limit));

    return res.json({
      success: true,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      doctors: paginated,
      districts: ALL_DISTRICTS
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/doctors/districts ───────────────────────────────────────────────
// Return all 64 districts for the search UI dropdown
router.get('/districts', (req, res) => {
  return res.json({ success: true, districts: ALL_DISTRICTS });
});

// ─── GET /api/doctors/:id ─────────────────────────────────────────────────────
// Get a single doctor's profile
router.get('/:id', (req, res) => {
  const doctor = SEED_DOCTORS.find(d => d._id === req.params.id);
  if (!doctor) {
    return res.status(404).json({ success: false, error: 'Doctor not found.' });
  }
  return res.json({ success: true, doctor });
});

// ─── POST /api/doctors/appointments ───────────────────────────────────────────
// Book an appointment (video or farm_visit)
router.post('/appointments', (req, res) => {
  try {
    const {
      doctorId,
      farmerId,
      farmerName,
      farmerMobile,
      farmerPhone,
      batchId,
      type,         // 'video' | 'farm_visit'
      scheduledAt,
      farmAddress,  // Required for farm_visit
      preferredDateWindow, // Optional for farm_visit
      notes,
      diagnosisId   // Optional: attach a recent diagnosis
    } = req.body;

    if (!doctorId || !type) {
      return res.status(400).json({
        success: false,
        error: 'doctorId and type (video or farm_visit) are required.'
      });
    }

    if (!['video', 'farm_visit'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: 'type must be "video" or "farm_visit".'
      });
    }

    if (type === 'farm_visit' && !farmAddress) {
      return res.status(400).json({
        success: false,
        error: 'farmAddress is required for farm visit appointments.'
      });
    }

    const doctor = SEED_DOCTORS.find(d => d._id === doctorId);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found.' });
    }

    const appointment = {
      _id: `appt_${String(appointmentCounter++).padStart(6, '0')}`,
      farmerId: farmerId || 'guest',
      farmerName: (farmerName || 'Local Farmer').trim(),
      farmerMobile: (farmerMobile || farmerPhone || '01700000000').trim(),
      farmerPhone: (farmerPhone || farmerMobile || '01700000000').trim(),
      doctorId,
      doctorName: doctor.name,
      doctorDistrict: doctor.district,
      doctorSpecialty: doctor.specialty,
      batchId: batchId || null,
      type,
      status: 'pending',   // pending | confirmed | completed | cancelled
      scheduledAt: scheduledAt || new Date(Date.now() + 86400000).toISOString(),
      preferredDateWindow: type === 'farm_visit' ? (preferredDateWindow || null) : null,
      farmAddress: type === 'farm_visit' ? farmAddress : null,
      meetingLink: type === 'video' ? `https://meet.agrimind.app/vet-consult-${Date.now().toString().slice(-6)}` : null,
      fee: type === 'video' ? doctor.consultationFee.video : doctor.consultationFee.farmVisit,
      notes: notes || '',
      diagnosisId: diagnosisId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    appointments.set(appointment._id, appointment);

    return res.status(201).json({ success: true, appointment });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── GET /api/doctors/appointments/my ─────────────────────────────────────────
// List a farmer's appointments
router.get('/appointments/my', (req, res) => {
  try {
    const { farmerId, status } = req.query;
    let result = [];

    for (const appt of appointments.values()) {
      if (farmerId && appt.farmerId !== farmerId) continue;
      if (status && appt.status !== status) continue;
      result.push(appt);
    }

    // If no farmerId filter, return all (for demo)
    if (!farmerId) {
      result = [...appointments.values()];
    }

    result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.json({ success: true, count: result.length, appointments: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── PATCH /api/doctors/appointments/:id ──────────────────────────────────────
// Update appointment status or attach diagnosis
router.patch('/appointments/:id', (req, res) => {
  try {
    const appt = appointments.get(req.params.id);
    if (!appt) {
      return res.status(404).json({ success: false, error: 'Appointment not found.' });
    }

    const { status, notes, diagnosisId } = req.body;

    if (status) {
      if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
        return res.status(400).json({ success: false, error: 'Invalid status.' });
      }
      appt.status = status;
    }

    if (notes !== undefined) appt.notes = notes;
    if (diagnosisId !== undefined) appt.diagnosisId = diagnosisId;
    appt.updatedAt = new Date().toISOString();

    appointments.set(appt._id, appt);

    return res.json({ success: true, appointment: appt });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// ─── DELETE /api/doctors/appointments/:id ─────────────────────────────────────
// Cancel an appointment
router.delete('/appointments/:id', (req, res) => {
  try {
    const appt = appointments.get(req.params.id);
    if (!appt) {
      return res.status(404).json({ success: false, error: 'Appointment not found.' });
    }

    appt.status = 'cancelled';
    appt.updatedAt = new Date().toISOString();
    appointments.set(appt._id, appt);

    return res.json({ success: true, message: 'Appointment cancelled.', appointment: appt });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.SEED_DOCTORS = SEED_DOCTORS;
router.appointments = appointments;

module.exports = router;
