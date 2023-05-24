const Admin = require('../models/Admin'); // Assuming you have an Admin model defined

// Admin login function
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Implement input validation and error handling here

    // Find the admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Validate password
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Admin logged in successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};
