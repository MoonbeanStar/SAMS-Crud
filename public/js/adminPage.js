    // Password validation and strength check
		document.getElementById('teacherPass').addEventListener('input', function () {
			const passwordInput = document.getElementById('teacherPass');
			const password = passwordInput.value;
			const passwordStrengthMessage = document.getElementById('passwordStrengthMessage');

			// Regex patterns for password strength requirements
			const lowercaseRegex = /[a-z]/;
			const uppercaseRegex = /[A-Z]/;
			const numberRegex = /[0-9]/;
			const specialCharRegex = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/;

			// Check password strength based on the defined requirements
			if (password.length < 8 || !lowercaseRegex.test(password) || !uppercaseRegex.test(password) || !numberRegex.test(password) || !specialCharRegex.test(password)) {
				passwordStrengthMessage.textContent = 'Weak password: Password must be at least 8 characters long and contain lowercase, uppercase, number, and special character.';
			} else {
				passwordStrengthMessage.textContent = ''; // Clear the password strength message if the password meets the requirements
			}
		});	

        // Add an event listener to the modal to fetch sections when it is shown
        document.getElementById('addTeacherModal').addEventListener('show.bs.modal', async function () {
          const response = await fetch('/api/sections');
          const data = await response.json();
      
          const sectionSelect = document.getElementById('teacherSection');
          sectionSelect.innerHTML = ''; // Clear existing options
      
          // Add options for each section
          data.sections.forEach((section) => {
            const option = document.createElement('option');
            option.value = section.name;
            option.textContent = section.name;
            sectionSelect.appendChild(option);
          });
        });
      
        // Function to handle the form submission and update the teacher list
        function addTeacher() {
        const form = document.getElementById('addTeacherForm');
        const formData = new FormData(form);
        const xhr = new XMLHttpRequest();

        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.responseText);
                const teachers = response.teachers;
                updateTeacherList(teachers);
                $('#addTeacherModal').modal('hide');
            } else {
                console.error('Failed to register teacher');
            }
            }
        };

        xhr.open(form.method, '/api/teacher/update', true); // Updated URL
        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        xhr.send(new URLSearchParams(formData).toString());
        }

          // Function to fetch and populate teacher data
        async function fetchTeachers() {
            try {
            const response = await fetch('/api/teachers');
            const { teachers } = await response.json();

            const teacherTableBody = document.getElementById('teacherTableBody');
            teacherTableBody.innerHTML = ''; // Clear existing table rows

            teachers.forEach((teacher) => {
                const row = document.createElement('tr');

                // Create table cells and populate with teacher data
                const nameCell = document.createElement('td');
                nameCell.textContent = teacher.name;
                row.appendChild(nameCell);

                const emailCell = document.createElement('td');
                emailCell.textContent = teacher.email;
                row.appendChild(emailCell);

                const departmentCell = document.createElement('td');
                departmentCell.textContent = teacher.department;
                row.appendChild(departmentCell);

                const sectionCell = document.createElement('td');
                sectionCell.textContent = teacher.section;
                row.appendChild(sectionCell);

                const actionCell = document.createElement('td');
                const editButton = document.createElement('button');
                editButton.classList.add('edit-button', 'btn', 'btn-primary');
                editButton.textContent = 'Edit';
                editButton.addEventListener('click', () => openEditModal(teacher));
                actionCell.appendChild(editButton);

                const deleteButton = document.createElement('button');
                deleteButton.classList.add('delete-button', 'btn', 'btn-danger');
                deleteButton.textContent = 'Delete';
                deleteButton.addEventListener('click', () => deleteRecord(teacher));
                actionCell.appendChild(deleteButton);

                row.appendChild(actionCell);

                teacherTableBody.appendChild(row);
            });
            } catch (error) {
            console.error('Failed to fetch teachers:', error);
            }
        }

        // Fetch and populate teacher data when the teacher tab is shown
        document.getElementById('teacher-tab').addEventListener('shown.bs.tab', fetchTeachers);

        // Add an event listener to the addTeacherForm
        document.getElementById('addTeacherForm').addEventListener('submit', async (event) => {
            event.preventDefault(); // Prevent form submission

            // Make a POST request to register the teacher
            const response = await fetch('/api/teacher/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                name: document.getElementById('teacherName').value,
                email: document.getElementById('teacherEmail').value,
                password: document.getElementById('teacherPass').value,
                department: document.getElementById('teacherDepartment').value,
                section: document.getElementById('teacherSection').value,
            }),
            });

            // Check if the request was successful
            if (response.ok) {
            const data = await response.json();
            const { message, teachers, redirect } = data;

            // Redirect to the specified URL
            window.location.href = redirect;
            } else {
            // Show an error message
            alert('Failed to register teacher');
            }
        });

        function openEditModal(teacher) {
        // Get the editTeacherModal and its form elements
        const editTeacherModal = document.getElementById('editTeacherModal');
        const editTeacherForm = document.getElementById('editTeacherForm');
        const editTeacherName = document.getElementById('editTeacherName');
        const editTeacherEmail = document.getElementById('editTeacherEmail');
        const editTeacherDepartment = document.getElementById('editTeacherDepartment');
        const editTeacherSection = document.getElementById('editTeacherSection');

        // Set the teacher's data in the form inputs
        editTeacherName.value = teacher.name;
        editTeacherEmail.value = teacher.email;
        editTeacherDepartment.value = teacher.department;

        // Fetch sections and populate the select element
        fetch('/api/sections')
            .then(response => response.json())
            .then(data => {
            editTeacherSection.innerHTML = ''; // Clear existing options

            // Add options for each section
            data.sections.forEach(section => {
                const option = document.createElement('option');
                option.value = section.name;
                option.textContent = section.name;

                // Set the selected option based on the teacher's section
                if (section.id === teacher.section) {
                option.selected = true;
                }

                editTeacherSection.appendChild(option);
            });
            })
            .catch(error => {
            console.error('Failed to fetch sections:', error);
            });

        // Show the editTeacherModal
        const bootstrapModal = new bootstrap.Modal(editTeacherModal);
        bootstrapModal.show();
        }

        // Function to delete a record
        function deleteRecord(teacher) {
        // Display a confirmation dialog before deleting the record
        const confirmation = confirm(`Are you sure you want to delete the teacher record for ${teacher.name}?`);

        if (confirmation) {
            // Assuming you have an API endpoint for deleting a teacher record, you can use fetch to send a DELETE request
            fetch(`/api/teacher/delete?email=${encodeURIComponent(teacher.email)}`, {
            method: 'DELETE',
            })
            .then((response) => {
                if (response.ok) {
                // If the deletion is successful, refresh the page
                location.reload();
                } else {
                console.error('Failed to delete teacher record');
                }
            })
            .catch((error) => {
                console.error('Failed to delete teacher record:', error);
            });
        }
        }

        // Function to fetch and display the student list
        function fetchStudents() {
          // Make an AJAX request to the server
          fetch('/api/students')
            .then((response) => response.json())
            .then((data) => {
              // Clear the table body
              const studentTableBody = document.getElementById('studentTableBody');
              studentTableBody.innerHTML = '';

              // Iterate over the student data and create table rows
              data.students.forEach((student) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                  <td>${student.username}</td>
                  <td>${student.phoneNumber}</td>
                  <td>${student.email}</td>
                  <td>${student.department}</td>
                  <td>${student.yearLevel}</td>
                  <td>${student.studentSection}</td>
                  <td>${student.birthday}</td>
                `;

                const actionCell = document.createElement('td');
                const studentEditButton = document.createElement('button');
                studentEditButton.classList.add('edit-button', 'btn', 'btn-primary');
                studentEditButton.textContent = 'Edit';
                studentEditButton.addEventListener('click', () => openStudentEditModal(student));
                actionCell.appendChild(studentEditButton);

                const deleteStudentButton = document.createElement('button');
                deleteStudentButton.classList.add('delete-button', 'btn', 'btn-danger');
                deleteStudentButton.textContent = 'Delete';
                deleteStudentButton.addEventListener('click', () => deleteStudentRec(student));
                actionCell.appendChild(deleteStudentButton);

                actionCell.appendChild(studentEditButton);
                actionCell.appendChild(deleteStudentButton);

                row.appendChild(actionCell);

                studentTableBody.appendChild(row);
              });

            })
            .catch((error) => {
              console.error('Failed to fetch students:', error);
            });
        }

        // Call the fetchStudents function when the student tab is shown
        document.getElementById('student-tab').addEventListener('shown.bs.tab', fetchStudents);

        // Call the fetchStudents function initially to load the student list
        fetchStudents();

        // Function to open the edit modal and populate with student data
      function openStudentEditModal(student) {
        const editStudentModal = document.getElementById('editStudentModal');
        const editStudentForm = document.getElementById('editStudentForm');

        // Populate the form fields with student data
        document.getElementById('editStudentName').value = student.username;
        document.getElementById('editStudentPhone').value = student.phoneNumber;
        document.getElementById('editStudentEmail').value = student.email;
        document.getElementById('editStudentDepartment').value = student.department;
        document.getElementById('editStudentYearLevel').value = student.yearLevel;
        document.getElementById('editStudentBirthday').value = student.birthday;

        // Fetch sections and populate the select element
        fetch('/api/sections')
            .then(response => response.json())
            .then(data => {
            editStudentSection.innerHTML = ''; // Clear existing options

            // Add options for each section
            data.sections.forEach(section => {
                const option = document.createElement('option');
                option.value = section.name;
                option.textContent = section.name;

                // Set the selected option based on the student's section
                if (section.id === student.section) {
                option.selected = true;
                }

                editStudentSection.appendChild(option);
            });
            })
            .catch(error => {
            console.error('Failed to fetch sections:', error);
            });

        // Show the modal
        const modal = new bootstrap.Modal(editStudentModal);
        modal.show();
      }
      
      // Function to delete a record
      function deleteStudentRec(student) {
        // Display a confirmation dialog before deleting the record
        const confirmation = confirm(`Are you sure you want to delete the student record for ${student.username}?`);

        if (confirmation) {
            // Assuming you have an API endpoint for deleting a teacher record, you can use fetch to send a DELETE request
            fetch(`/api/student/delete?email=${encodeURIComponent(student.email)}`, {
            method: 'DELETE',
            })
            .then((response) => {
                if (response.ok) {
                // If the deletion is successful, refresh the page
                location.reload();
                } else {
                console.error('Failed to delete student record');
                }
            })
            .catch((error) => {
                console.error('Failed to delete student record:', error);
            });
        }
        }

        async function fetchAttendanceRecords() {
          try {
            const response = await fetch('/api/attendance-record');
            const data = await response.json();

            const attendanceTableBody = document.getElementById('attendanceTableBody');
            attendanceTableBody.innerHTML = ''; // Clear existing table rows

            data.forEach((record) => {
              const row = document.createElement('tr');

              const nameCell = document.createElement('td');
              nameCell.textContent = record.username;
              row.appendChild(nameCell);

              const dateCell = document.createElement('td');
              dateCell.textContent = record.date;
              row.appendChild(dateCell);

              const emailCell = document.createElement('td');
              emailCell.textContent = record.email;
              row.appendChild(emailCell);

              const phoneCell = document.createElement('td');
              phoneCell.textContent = record.phoneNumber;
              row.appendChild(phoneCell);

              const sectionCell = document.createElement('td');
              sectionCell.textContent = record.section;
              row.appendChild(sectionCell);

              const statusCell = document.createElement('td');
              statusCell.textContent = record.action;
              row.appendChild(statusCell);

              attendanceTableBody.appendChild(row);
            });
          } catch (error) {
            console.error('Failed to fetch attendance records:', error);
          }
        }

        fetchAttendanceRecords();

         // Add event listener to the logout tab button
        document.getElementById('logout-tab').addEventListener('click', function() {
          // Show confirmation dialog
          if (confirm('Are you sure you want to log out?')) {
            // If user confirms, redirect to the admin login page
            window.location.href = 'adminLogin.html'; // Replace with the actual URL of the admin login page
          }
        });

      // Function to handle student search
      function searchStudents() {
        const searchInput = document.getElementById('studentSearchInput');
        const searchText = searchInput.value.toLowerCase();
        const studentTableBody = document.getElementById('studentTableBody');
        const rows = studentTableBody.getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
          const name = rows[i].cells[0].textContent.toLowerCase();

          if (name.includes(searchText)) {
            rows[i].style.display = '';
          } else {
            rows[i].style.display = 'none';
          }
        }
      }

      // Add an event listener to the search button
      document.getElementById('studentSearchButton').addEventListener('click', searchStudents);

      function searchTeacher() {
        const searchInput = document.getElementById('teacherSearchInput');
        const searchText = searchInput.value.toLowerCase();
        const studentTableBody = document.getElementById('teacherTableBody');
        const rows = studentTableBody.getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
          const name = rows[i].cells[0].textContent.toLowerCase();

          if (name.includes(searchText)) {
            rows[i].style.display = '';
          } else {
            rows[i].style.display = 'none';
          }
        }
      }

      // Add an event listener to the search button
      document.getElementById('teacherSearchButton').addEventListener('click', searchTeacher);

      function searchAttendance() {
        const searchInput = document.getElementById('attendanceSearchInput');
        const searchText = searchInput.value.toLowerCase();
        const studentTableBody = document.getElementById('attendanceTableBody');
        const rows = studentTableBody.getElementsByTagName('tr');

        for (let i = 0; i < rows.length; i++) {
          const name = rows[i].cells[0].textContent.toLowerCase();

          if (name.includes(searchText)) {
            rows[i].style.display = '';
          } else {
            rows[i].style.display = 'none';
          }
        }
      }

      // Add an event listener to the search button
      document.getElementById('attendanceSearchButton').addEventListener('click', searchAttendance);
