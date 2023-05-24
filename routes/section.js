// section.js

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// POST /api/section/add
router.post('/api/section/add', async (req, res) => {
  const { departmentSelect, sectionName } = req.body;

  try {
    const createdSection = await prisma.section.create({
      data: {
        name: sectionName,
        department: departmentSelect,
      },
    });

    res.status(200).json({ success: true, section: createdSection });
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ success: false, error: 'Failed to create section' });
  }
});

module.exports = router;
