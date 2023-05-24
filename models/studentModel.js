const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  yearLevel: {
    type: String,
    required: true,
  },
  birthday: {
    type: Date,
    required: true,
  },
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;