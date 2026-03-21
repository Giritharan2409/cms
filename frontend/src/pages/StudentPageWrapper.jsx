import { getUserSession } from '../auth/sessionController';
import StudentsPage from './StudentsPage';
import FacultyStudentsPage from './FacultyStudentsPage';

export default function StudentPageWrapper() {
  const session = getUserSession();
  const role = session?.role || 'student';

  if (role === 'faculty') {
    return <FacultyStudentsPage />;
  }

  return <StudentsPage />;
}
