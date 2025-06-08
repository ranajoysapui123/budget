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

  // Fetch students with subjects and payment status
  const fetchStudents = async () => {
    const res = await fetch(`/api/students/students/subjects?month=${month}&year=${year}`);
    const data = await res.json();
    setStudents(data);
  };

  useEffect(() => {
    fetchStudents();
  }, [month, year]);

  // Add student
  const handleAddStudent = async () => {
    const res = await fetch('/api/students/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (res.ok) {
      setMessage('Student added!');
      setName('');
      fetchStudents();
    }
  };

  // Add subject
  const handleAddSubject = async () => {
    const res = await fetch('/api/students/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: subject, fee: Number(fee) })
    });
    if (res.ok) {
      setMessage('Subject added!');
      setSubject('');
      setFee('');
    }
  };

  // Assign subject to student
  const handleAssign = async () => {
    const res = await fetch('/api/students/assign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, subjectId, month: assignMonth, year: assignYear })
    });
    if (res.ok) {
      setMessage('Subject assigned!');
      fetchStudents();
    }
  };

  // Mark fee as paid
  const handleMarkPaid = async (studentId: string, subjectId: string) => {
    const res = await fetch('/api/students/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, subjectId, month, year })
    });
    if (res.ok) {
      setMessage('Fee marked as paid!');
      fetchStudents();
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-bold mb-4">Student Management</h2>
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
          {students.map((s, i) => (
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
          ))}
        </tbody>
      </table>
    </Card>
  );
}
