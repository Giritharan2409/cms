import React, { useState } from 'react';
import { useAdmission } from '../context/AdmissionContext';
import StudentAdmissionModal from './StudentAdmissionModal';
import FacultyAdmissionModal from './FacultyAdmissionModal';

export default function AddMemberModal({ isOpen, onClose, type = 'student' }) {
  const [selectedType, setSelectedType] = useState(type);
  const [showForm, setShowForm] = useState(false);

  if (!isOpen) return null;

  if (showForm) {
    if (selectedType === 'student') {
      return (
        <StudentAdmissionModal
          isOpen={true}
          onClose={() => {
            setShowForm(false);
            onClose();
          }}
        />
      );
    } else {
      return (
        <FacultyAdmissionModal
          isOpen={true}
          onClose={() => {
            setShowForm(false);
            onClose();
          }}
        />
      );
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 shadow-xl">
        <h2 className="text-2xl font-bold text-center mb-8">Add New Member</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {[
            {
              type: 'student',
              title: 'Add Student',
              icon: 'person',
              desc: 'Enroll a new student in the system',
              steps: '8 Steps',
            },
            {
              type: 'faculty',
              title: 'Add Faculty',
              icon: 'school',
              desc: 'Add a new faculty member',
              steps: '7 Steps',
            },
          ].map((option) => (
            <button
              key={option.type}
              onClick={() => {
                setSelectedType(option.type);
                setShowForm(true);
              }}
              className={`p-6 border-2 rounded-lg transition cursor-pointer ${
                selectedType === option.type
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <span className="material-symbols-outlined text-4xl text-blue-500 block mb-4">
                {option.icon}
              </span>
              <h3 className="font-bold text-lg mb-2">{option.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{option.desc}</p>
              <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full">
                {option.steps}
              </span>
            </button>
          ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
