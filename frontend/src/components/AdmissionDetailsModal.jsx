import React from 'react';

const BADGE_STYLES = {
  Approved: 'bg-green-100 text-green-800',
  Rejected: 'bg-red-100 text-red-800',
  Pending: 'bg-orange-100 text-orange-800',
};

const SECTION_CARD = 'rounded-2xl border border-gray-200 bg-gray-50/80 p-4';

function displayValue(value) {
  if (value === null || value === undefined) {
    return 'Not Provided';
  }
  if (typeof value === 'string' && value.trim() === '') {
    return 'Not Provided';
  }
  if (typeof value === 'number' && (!Number.isFinite(value) || value === 0)) {
    return 'Not Provided';
  }
  return value;
}

function Field({ label, value, accent = false }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`text-sm font-semibold ${accent ? 'text-blue-700' : 'text-gray-900'}`}>
        {displayValue(value)}
      </p>
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
        <span className="material-symbols-outlined text-[20px]">{icon}</span>
      </div>
      <div>
        <h3 className="text-base font-bold text-gray-900">{title}</h3>
        {subtitle ? <p className="text-sm text-gray-500">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export default function AdmissionDetailsModal({ isOpen, onClose, application }) {
  if (!isOpen || !application) return null;

  const isStudent = application.type === 'student';
  const name = application.fullName || application.name;
  const rollNumber = application.rollNumber || application.roll_number || application.roll;
  const guardianName = application.guardianName || application.guardian_name || application.guardian;
  const guardianPhone = application.guardianPhone || application.guardian_phone;
  const guardianRelationship = application.guardianRelationship || application.guardian_relationship || application.relationship;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="border-b border-gray-200 bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">
                {isStudent ? 'Student Details' : 'Faculty Details'}
              </p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">{displayValue(name)}</h2>
            </div>
            <button onClick={onClose} className="rounded-full p-2 text-gray-500 transition hover:bg-white hover:text-gray-900" aria-label="Close modal">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-4 py-1 text-sm font-semibold ${BADGE_STYLES[application.status] || BADGE_STYLES.Pending}`}>
              Status: {displayValue(application.status)}
            </span>
            {isStudent && rollNumber ? (
              <span className="rounded-full bg-slate-900 px-4 py-1 text-sm font-semibold text-white">
                Roll No: {rollNumber}
              </span>
            ) : null}
          </div>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-2">
          <div className="space-y-5">
            <section className={SECTION_CARD}>
              <SectionTitle icon="person" title="Personal Information" subtitle="Identity and contact details" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full Name" value={name} accent />
                <Field label="Email" value={application.email} />
                <Field label="Phone" value={application.phone} />
                <Field label="Date of Birth" value={application.dateOfBirth || application.dob} />
                <Field label="Gender" value={application.gender} />
                {isStudent ? <Field label="Blood Group" value={application.bloodGroup} /> : null}
              </div>
            </section>

            {isStudent ? (
              <section className={SECTION_CARD}>
                <SectionTitle icon="family_restroom" title="Guardian Information" subtitle="Parent or guardian contact details" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Guardian Name" value={guardianName} accent />
                  <Field label="Guardian Phone" value={guardianPhone} />
                  <Field label="Relationship" value={guardianRelationship} />
                  <Field label="Mother's Name" value={application.motherName} />
                </div>
              </section>
            ) : null}

            {isStudent && Array.isArray(application.skills) && application.skills.length > 0 ? (
              <section className={SECTION_CARD}>
                <SectionTitle icon="workspace_premium" title="Technical Skills" subtitle="Capabilities recorded on the profile" />
                <div className="flex flex-wrap gap-2">
                  {application.skills.map((skill, index) => (
                    <span key={index} className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                      {skill}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <div className="space-y-5">
            {isStudent ? (
              <section className={SECTION_CARD}>
                <SectionTitle icon="school" title="Academic Details" subtitle="Enrollment and performance information" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Course" value={application.course} accent />
                  <Field label="Semester" value={application.semester} />
                  <Field label="Roll Number" value={rollNumber} />
                  <Field label="CGPA" value={application.cgpa} />
                  <Field label="Previous School" value={application.previousSchool} />
                  <Field label="Year of Passing" value={application.yearOfPassing} />
                </div>
              </section>
            ) : (
              <section className={SECTION_CARD}>
                <SectionTitle icon="badge" title="Professional Details" subtitle="Role and profile information" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Role" value={application.role} accent />
                  <Field label="Department" value={application.department} />
                  <Field label="Qualification" value={application.qualification} />
                  <Field label="Experience" value={application.experience ? `${application.experience} years` : ''} />
                  <Field label="Specialization" value={application.specialization} />
                </div>
              </section>
            )}

            {isStudent ? (
              <section className={SECTION_CARD}>
                <SectionTitle icon="location_on" title="Address" subtitle="Residential details" />
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="sm:col-span-2 lg:col-span-4">
                    <Field label="Address Line" value={application.address} accent />
                  </div>
                  <Field label="City" value={application.city} />
                  <Field label="State" value={application.state} />
                  <Field label="Pincode" value={application.pincode} />
                </div>
              </section>
            ) : null}

            <section className={SECTION_CARD}>
              <SectionTitle icon="info" title="System Information" subtitle="Record metadata" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="ID" value={application.id} accent />
                <Field label="Created Date" value={application.createdDate || application.created_at || new Date().toISOString().split('T')[0]} />
              </div>
            </section>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button onClick={onClose} className="rounded-xl bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
