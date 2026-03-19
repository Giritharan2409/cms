// ─── Dummy Student Data (Empty for Live DB) ─────────────────────────────────────────
export const students = [];

export function getStudentStats() {
  const total = students.length;
  const active = students.filter(s => s.status === 'Active').length;
  const avgAttendance = total > 0 ? Math.round(students.reduce((sum, s) => sum + s.attendancePct, 0) / total) : 0;
  const feeDefaulters = students.filter(s => s.feeStatus !== 'Paid').length;
  return { total, active, avgAttendance, feeDefaulters };
}

export function getStudentById(id) {
  return students.find(s => s.id === id) || null;
}

export const departments = ['All', 'Computer Science', 'Mechanical', 'Electronics', 'Civil'];
export const years = ['All', '1st Year', '2nd Year', '3rd Year', '4th Year'];
