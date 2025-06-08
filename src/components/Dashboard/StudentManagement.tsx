import { useEffect, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';

interface Student {
  student_id: string;
  student_name: string;
  subject_name: string;
  fee: number;
  paid: number;
}

export default function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [month, setMonth] = useState<string>(new Date().toISOString().slice(5, 7));
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [fee, setFee] = useState('');
  const [studentId, setStudentId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [assignMonth, setAssignMonth] = useState(month);
  const [assignYear, setAssignYear] = useState(year);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch students with subjects and payment status
  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const res = await fetch(`/api/students/students?month=${month}&year=${year}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication required. Please log in.');
        }
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setStudents(data);
      } else {
        console.warn('API returned unexpected data format:', data);
        setStudents([]);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch students');
      setStudents([]); // Ensure students is always an array
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [month, year]);

  // Add student
  const handleAddStudent = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const res = await fetch('/api/students/students', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ name })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      setMessage('Student added!');
      setName('');
      fetchStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add student');
    }
  };

  // Add subject
  const handleAddSubject = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const res = await fetch('/api/students/subjects', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ name: subject, fee: Number(fee) })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      setMessage('Subject added!');
      setSubject('');
      setFee('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add subject');
    }
  };

  // Assign subject to student
  const handleAssign = async () => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const res = await fetch('/api/students/assign', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ studentId, subjectId, month: assignMonth, year: assignYear })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      setMessage('Subject assigned!');
      fetchStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign subject');
    }
  };

  // Mark fee as paid
  const handleMarkPaid = async (studentId: string, subjectId: string) => {
    try {
      setError('');
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please log in.');
      }

      const res = await fetch('/api/students/pay', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ studentId, subjectId, month, year })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      setMessage('Fee marked as paid!');
      fetchStudents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark as paid');
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-bold mb-4">Student Management</h2>
      
      {/* Loading state */}
      {loading && (
        <div className="mb-4 text-blue-600">Loading students...</div>
      )}
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error: </strong>{error}
          <button 
            onClick={fetchStudents}
            className="ml-2 underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Success message */}
      {message && <div className="mb-2 text-green-600">{message}</div>}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <h3 className="font-semibold mb-2">Add Student</h3>
          <Input label="Name" value={name} onChange={setName} />
          <Button onClick={handleAddStudent} className="mt-2">Add Student</Button>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Add Subject</h3>
          <Input label="Subject" value={subject} onChange={setSubject} />
          <Input label="Fee" value={fee} onChange={setFee} type="number" />
          <Button onClick={handleAddSubject} className="mt-2">Add Subject</Button>
        </div>
        <div>
          <h3 className="font-semibold mb-2">Assign Subject</h3>
          <Input label="Student ID" value={studentId} onChange={setStudentId} />
          <Input label="Subject ID" value={subjectId} onChange={setSubjectId} />
          <Input label="Month" value={assignMonth} onChange={setAssignMonth} />
          <Input label="Year" value={String(assignYear)} onChange={v => setAssignYear(Number(v))} />
          <Button onClick={handleAssign} className="mt-2">Assign</Button>
        </div>
      </div>
      
      <div className="mb-4">
        <label className="mr-2">Month:</label>
        <Input label="Month" value={month} onChange={setMonth} className="inline w-20" />
        <label className="ml-4 mr-2">Year:</label>
        <Input label="Year" value={String(year)} onChange={v => setYear(Number(v))} className="inline w-28" />
      </div>
      
      <table className="w-full border mt-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-2">Student</th>
            <th className="p-2">Subject</th>
            <th className="p-2">Fee</th>
            <th className="p-2">Paid</th>
            <th className="p-2">Action</th>
          </tr>
        </thead>
        <tbody>
          {students.length === 0 && !loading && !error ? (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                No students found for {month}/{year}
              </td>
            </tr>
          ) : (
            students.map((s, i) => (
              <tr key={i} className="border-t">
                <td className="p-2">{s.student_name}</td>
                <td className="p-2">{s.subject_name}</td>
                <td className="p-2">₹{s.fee}</td>
                <td className="p-2">{s.paid ? 'Yes' : 'No'}</td>
                <td className="p-2">
                  {!s.paid && (
                    <Button size="sm" onClick={() => handleMarkPaid(s.student_id, s.subject_name)}>
                      Mark Paid
                    </Button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </Card>
  );
}