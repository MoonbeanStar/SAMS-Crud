const Student = require('../models/Student'); // Assuming you have a Student model defined

// Student registration function
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    // Implement input validation and error handling here

    // Check if a student with the same email already exists
    const existingStudent = await Student.findOne({ email });
    if (existingStudent) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Create a new student account
    const student = new Student({ name, email, password });
    await student.save();

    res.status(201).json({ message: 'Student registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
};

// Student login function
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // Implement input validation and error handling here

    // Find the student by email
    const student = await Student.findOne({ email });
    if (!student) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Validate password
    const isPasswordValid = await student.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    res.status(200).json({ message: 'Student logged in successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
};
