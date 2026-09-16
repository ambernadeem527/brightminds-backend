const express = require('express');
const router = express.Router();

// Match Endpoint Mapping: GET /api/tutors
router.get('/', (req, res) => {
    // True domain objects matching real operational target metrics for the platform
    const mockTutors = [
        { id: 1, name: "Sarah Khan", specialty: "9th-10th Grade Physics", ratePerHour: 35.00 },
        { id: 2, name: "Ali Raza", specialty: "6th-8th Grade General Mathematics", ratePerHour: 25.00 }
    ];
    res.status(200).json({
        success: true,
        count: mockTutors.length,
        data: mockTutors
    });
});

module.exports = router;
