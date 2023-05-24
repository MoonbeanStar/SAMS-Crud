const express = require('express');
const app = express();

const bcrypt = require('bcryptjs');
const validator = require('validator');

const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');
const path = require('path');

const prisma = new PrismaClient();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

// Basic server configuration
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});


// Create admin collection and insert initial data
async function createAdminCollection() {
  try {
    // Check if admin collection already has data
    const adminData = await prisma.admin.findMany();
    if (adminData.length === 0) {
      // Insert initial admin data
      await prisma.admin.create({
        data: {
          username: 'admin',
          password: 'admin123',
        },
      });
    }

    console.log('Admin collection and initial data created successfully.');
  } catch (error) {
    console.error('Failed to create admin collection:', error);
  }
}

// Create admin collection on server start
createAdminCollection().catch((error) => {
  console.error('Failed to create admin collection:', error);
});


// Student registration endpoint
app.post('/api/student/register', async (req, res) => {
  const { username, phoneNumber, email, password, department, studentSection, yearLevel, birthday, userType } = req.body;

  try {
    // Validate input fields
    if (!username || !phoneNumber || !email || !password || !department || !studentSection || !yearLevel || !birthday || !userType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    // Check if a user with the same email already exists
    const existingStudent = await prisma.student.findUnique({
      where: {
        email: email,
      },
    });

    if (existingStudent) {
      return res.status(400).json({ message: 'A user with the same email already exists' });
    }

    // Check if a user with the same phone number already exists
    const existingStudentPhoneNumber = await prisma.student.findUnique({
      where: {
        phoneNumber: phoneNumber,
      },
    });

    if (existingStudentPhoneNumber) {
      return res.status(400).json({ message: 'A user with the same phone number already exists' });
    }    

    // Encrypt the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newStudent = await prisma.student.create({
      data: {
        username: username,
        phoneNumber: phoneNumber,
        email: email,
        password: hashedPassword, // Store the hashed password in the database
        department: department,
        yearLevel: yearLevel,
        studentSection: studentSection,
        birthday: new Date(birthday).toISOString(),
        userType: userType,
      },
    });

    // Student registration successful
    res.status(200).json({ message: 'Student registered successfully', redirect: '/' });
  } catch (error) {
    console.error('Failed to register student:', error);
    res.status(500).json({ message: 'Failed to register student' });
  }
});

// Student Login Endpoint
app.post('/api/student/login', async (req, res) => {
  const { email, password, loginAs } = req.body;

  try {
    // Validate input fields
    if (!email || !password || !loginAs) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    // Find the student in the database using the provided email
    const student = await prisma.student.findUnique({
      where: {
        email: email,
      },
    });

    if (!student) {
      // Student not found or invalid credentials
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare the provided password with the hashed password
    const isPasswordMatch = await bcrypt.compare(password, student.password);
    if (!isPasswordMatch) {
      // Invalid password
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Retrieve the attendance records for the student
    const attendanceRecords = await prisma.attendance.findMany({
      where: { email: student.email },
    });


    // Student found, login successful
    const redirectURL = `/StudentPage.html?id=${encodeURIComponent(student.id)}`;
    res.status(200).json({ message: 'Login successful', redirect: redirectURL , attendanceRecords});
  } catch (error) {
    console.error(error);
    // Handle the error and send an appropriate response
    res.status(500).json({ error: 'An error occurred' });
  }
});


// Student profile endpoint
app.get('/api/student/profile', async (req, res) => {
  const { id } = req.query;

  try {
    // Find the student in the database using the provided ID
    const student = await prisma.student.findUnique({
      where: {
        id: id,
      },
    });

    if (!student) {
      // Student not found
      res.status(404).json({ error: 'Student not found' });
    } else {
      // // Student found, return the profile information
      // res.status(200).json({ student });

      // Retrieve the attendance records for the student
      const attendanceRecords = await prisma.attendance.findMany({
        where: { email: student.email },
      });

      // Student found, return the profile information along with attendance records
      res.status(200).json({ student, attendanceRecords });
    }
  } catch (error) {
    console.error(error);
    // Handle the error and send an appropriate response
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Update student profile endpoint
app.put('/api/student/profile', async (req, res) => {
  const { id, profileData } = req.body;

  try {
    // Update the student profile in the database
    const updatedStudent = await prisma.student.update({
      where: {
        id: id,
      },
      data: profileData,
    });

    // Profile update successful
    res.status(200).json({
      message: 'Profile updated successfully',
      student: updatedStudent, // Include the updated student in the response
    });
  } catch (error) {
    console.error('Failed to update profile:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Serve the admin login page when accessing '/admin'
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'adminlogin.html'));
});


// Handle admin login
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  // Find the admin with the provided username
  prisma.admin
    .findFirst({
      where: {
        username: username,
      },
    })
    .then((admin) => {
      // Check if an admin with the provided username exists
      if (admin) {
        // Compare the password with the stored password
        if (admin.password === password) {
          // Send the adminPage.html file as the response
          res.sendFile(path.join(__dirname, 'public', 'adminPage.html'));
        } else {
          res.status(401).json({ message: 'Invalid credentials' });
        }
      } else {
        res.status(401).json({ message: 'Admin not found' });
      }
    })
    .catch((error) => {
      console.error(error);
      res.status(500).json({ message: 'Internal server error' });
    });
});

// Get all sections endpoint
app.get('/api/sections', async (req, res) => {
  try {
    const sections = await prisma.section.findMany();
    res.status(200).json({ sections });
  } catch (error) {
    console.error('Failed to fetch sections:', error);
    res.status(500).json({ message: 'Failed to fetch sections' });
  }
});

// Teacher registration endpoint
app.post('/api/teacher/register', async (req, res) => {
  const { name, email, password, department, section , subject} = req.body;

  try {
    // Validate input fields
    if (!name || !email || !password || !department || !section || !subject) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    // Encrypt the password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newTeacher = await prisma.teacher.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword, // Store the hashed password in the database
        department: department,
        section: section,
        subject: subject,
      },
    });

    // Teacher registration successful
    res.status(200).json({ message: 'Teacher registered successfully', redirect: '/adminPage.html' });
  } catch (error) {
    console.error('Failed to register teacher:', error);
    res.status(500).json({ message: 'Failed to register teacher' });
  }
});

// Get all teachers endpoint
app.get('/api/teachers', async (req, res) => {
  try {
    const teachers = await prisma.teacher.findMany();
    res.status(200).json({ teachers });
  } catch (error) {
    console.error('Failed to fetch teachers:', error);
    res.status(500).json({ message: 'Failed to fetch teachers' });
  }
});

// Update teacher endpoint
app.post('/api/teacher/update', async (req, res) => {
  const { email, name, department, section } = req.body;

  try {
    // Update the teacher record in the database
    const updatedTeacher = await prisma.teacher.update({
      where: { email: email },
      data: {
        name,
        department,
        section,
      },
    });

    res.redirect('/adminPage.html');
  } catch (error) {
    console.error('Failed to update teacher:', error);
    res.status(500).json({ error: 'Failed to update teacher' });
  }
});

// delete teacher record endpoint
app.delete('/api/teacher/delete', async (req, res) => {
  try {
    const { email } = req.query;

    // Find the teacher record based on the email
    const teacher = await prisma.teacher.findUnique({
      where: {
        email,
      },
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Teacher record not found' });
    }

    // Delete the teacher record
    await prisma.teacher.delete({
      where: {
        email,
      },
    });

    res.sendStatus(200);
  } catch (error) {
    console.error('Failed to delete teacher record:', error);
    res.sendStatus(500);
  }
});

// Get all students endpoint
app.get('/api/students', async (req, res) => {
  try {
    const students = await prisma.student.findMany();
    res.status(200).json({ students });
  } catch (error) {
    console.error('Failed to fetch students:', error);
    res.status(500).json({ message: 'Failed to fetch students' });
  }
});

// Update student endpoint
app.post('/api/student/update', async (req, res) => {
  const { email, username, phoneNumber, department, yearLevel, studentSection, birthday } = req.body;

  try {
    // Update the student record in the database
    const updatedStudent = await prisma.student.update({
      where: { email: email },
      data: {
        username,
        phoneNumber,
        department,
        yearLevel,
        birthday,
        studentSection,
      },
    });

    res.redirect('/adminPage.html');
  } catch (error) {
    console.error('Failed to update teacher:', error);
    res.status(500).json({ error: 'Failed to update Student' });
  }
});

// delete student record endpoint
app.delete('/api/student/delete', async (req, res) => {
  try {
    const { email } = req.query;

    // Find the student record based on the email
    const student = await prisma.student.findUnique({
      where: {
        email,
      },
    });

    if (!student) {
      return res.status(404).json({ error: 'Student record not found' });
    }

    // Delete the teacher record
    await prisma.student.delete({
      where: {
        email,
      },
    });

    res.sendStatus(200);
  } catch (error) {
    console.error('Failed to delete student record:', error);
    res.sendStatus(500);
  }
});

// Teacher login endpoint
app.post('/api/teacher/login', async (req, res) => {
  const { email, password, loginAs } = req.body;

  try {
    // Validate input fields
    if (!email || !password || !loginAs) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    // Find the teacher in the database
    const teacher = await prisma.teacher.findUnique({ where: { email } });
    if (!teacher) {
      // Teacher not found or invalid credentials
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare the provided password with the hashed password
    const isPasswordMatch = await bcrypt.compare(password, teacher.password);
    if (!isPasswordMatch) {
      // Invalid password
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Teacher found, login successful
    const redirectURL = `/TeacherPage.html?id=${encodeURIComponent(teacher.id)}`;
    res.status(200).json({ message: 'Login successful', redirect: redirectURL, teacherId: teacher.id });
  } catch (error) {
    console.error(error);
    // Handle the error and send an appropriate response
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Get students by teacher section endpoint
app.get('/api/teacher/students', async (req, res) => {
  const { teacherId } = req.query;

  try {
    // Find the teacher in the database
    const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
    if (!teacher) {
      // Teacher not found
      return res.status(404).json({ error: 'Teacher not found' });
    }

    // Find the students with the same section as the teacher
    const students = await prisma.student.findMany({ where: { studentSection: teacher.section } });

    // Return the students
    res.status(200).json({ students, teacher });
  } catch (error) {
    console.error(error);
    // Handle the error and send an appropriate response
    res.status(500).json({ error: 'An error occurred' });
  }
});

// Check if attendance for a specific date exists
app.get('/api/attendance/:date', async (req, res) => {
  const { date } = req.params;

  try {
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        date,
      },
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance for this date already exists' });
    }

    res.status(200).json({ message: 'Attendance does not exist for this date' });
  } catch (error) {
    console.error('Failed to check attendance:', error);
    res.status(500).json({ message: 'Failed to check attendance' });
  }
});

// Attendance endpoint
app.post('/api/attendance', async (req, res) => {
  const attendanceData = req.body;

  try {
    // Validate input data
    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      return res.status(400).json({ message: 'Invalid attendance data' });
    }

    // Check if attendance for the given date already exists
    const currentDate = new Date().toISOString().split('T')[0]; // Get the current date in "yyyy-mm-dd" format
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        date: currentDate,
      },
    });

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance for today has already been taken' });
    }

    // Save attendance in the database
    await prisma.attendance.createMany({
      data: attendanceData,
    });

    res.status(200).json({ message: 'Attendance saved successfully' });
  } catch (error) {
    console.error('Failed to save attendance:', error);
    res.status(500).json({ message: 'Failed to save attendance' });
  }
});

// Fetch attendance records endpoint
app.get('/api/attendance-record', async (req, res) => {
  try {
    const attendanceRecords = await prisma.attendance.findMany();
    res.status(200).json(attendanceRecords);
  } catch (error) {
    console.error('Failed to fetch attendance records:', error);
    res.status(500).json({ message: 'Failed to fetch attendance records' });
  }
});

// POST endpoint for adding a department
app.post('/api/department/add', async (req, res) => {
  try {
    const { departmentName } = req.body;

    // Check if the department already exists
    const existingDepartment = await prisma.departments.findUnique({
      where: { name: departmentName },
    });

    if (existingDepartment) {
      return res.status(400).json({ error: 'Department already exists' });
    }

    // Create the department in the database
    const newDepartment = await prisma.departments.create({
      data: { name: departmentName },
    });

    res.status(200);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while adding the department' });
  }
});

// Endpoint for departments
app.get('/api/departments', async (req, res) => {
  try {
    const departments = await prisma.departments.findMany();
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/section/add', async (req, res) => {
  const { departmentSelect, sectionName } = req.body;

  try {
    const createdSection = await prisma.section.create({
      data: {
        name: sectionName,
        department: departmentSelect,
      },
    });

    res.status(200);
  } catch (error) {
    console.error('Error creating section:', error);
    res.status(500).json({ success: false, error: 'Failed to create section' });
  }
});

app.post('/api/check-section-department', async (req, res) => {
  const { section, department } = req.body;

  try {
    // Retrieve the section from the database based on the provided ID
    const sectionFromDB = await prisma.section.findUnique({
      where: { id: section },
    });

    // Check if the section exists and the department matches
    const isValid =
      sectionFromDB !== null && sectionFromDB.department === department;

    res.json({ isValid });
  } catch (error) {
    console.error('Failed to check section and department:', error);
    res.status(500).json({ error: 'Failed to check section and department' });
  }
});

app.post('/api/subject/add', async (req, res) => {
  const { name, section, department } = req.body;

  try {
    // Save the subject in the database
    const subject = await prisma.subjects.create({
      data: {
        name,
        section,
        department,
      },
    });

    res.json(subject);
  } catch (error) {
    console.error('Failed to save subject:', error);
    res.status(500).json({ error: 'Failed to save subject' });
  }
});

//Subjects endpoint
app.get('/api/subjects', async (req, res) => {
  try {
    const subjects = await prisma.subjects.findMany();
    res.json(subjects);
  } catch (error) {
    console.error('Failed to fetch subjects:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});


// Close the Prisma client when the server is shut down
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});