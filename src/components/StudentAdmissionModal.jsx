import React, { useState } from 'react';
import { useAdmission } from '../context/AdmissionContext';

const steps = [
  { number: 1, title: 'Personal' },
  { number: 2, title: 'Academic' },
  { number: 3, title: 'Course' },
  { number: 4, title: 'Category' },
  { number: 5, title: 'Accommodation' },
  { number: 6, title: 'Documents' },
  { number: 7, title: 'Fee' },
  { number: 8, title: 'Review' },
];

export default function StudentAdmissionModal({ isOpen, onClose }) {
  const { addStudentApp } = useAdmission();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    // Step 2: Academic
    previousSchool: '',
    board: '',
    yearOfPassing: '',
    marksPercentage: '',
    // Step 3: Course Selection
    courseCategory: '',
    course: '',
    // Step 4: Category (Quota)
    quota: '',
    // Step 5: Accommodation
    accommodation: '',
    roomType: '',
    // Step 6: Documents
    passportPhoto: null,
    aadhaarCard: null,
    marksheet: null,
    transferCertificate: null,
    // Step 7: Application Fee
    paymentMethod: '',
    // Step 8: Review will use all above data
  });

  const [paymentDone, setPaymentDone] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files?.[0];
    setFormData((prev) => ({
      ...prev,
      [fieldName]: file,
    }));
  };

  const handleNext = () => {
    if (currentStep < 8) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handlePayment = () => {
    setPaymentDone(true);
    setTimeout(() => {
      handleNext();
    }, 2000);
  };

  const handleSubmit = () => {
    const studentData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      previousSchool: formData.previousSchool,
      board: formData.board,
      yearOfPassing: formData.yearOfPassing,
      marksPercentage: formData.marksPercentage,
      courseCategory: formData.courseCategory,
      course: formData.course,
      quota: formData.quota,
      accommodation: formData.accommodation,
      roomType: formData.roomType,
      paymentStatus: 'Paid',
    };

    addStudentApp(studentData);
    setFormData({
      name: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      previousSchool: '',
      board: '',
      yearOfPassing: '',
      marksPercentage: '',
      courseCategory: '',
      course: '',
      quota: '',
      accommodation: '',
      roomType: '',
      passportPhoto: null,
      aadhaarCard: null,
      marksheet: null,
      transferCertificate: null,
      paymentMethod: '',
    });
    setPaymentDone(false);
    setCurrentStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-6 relative">
          <h1 className="text-2xl font-bold">Student Admission Form</h1>
          <p className="text-blue-100">Complete all steps to submit your application</p>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-blue-400 p-2 rounded-full"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="text-sm text-gray-600 mb-4">Step {currentStep} of 8</div>
            <div className="flex justify-between items-center">
              {steps.map((step, idx) => (
                <div key={step.number} className="flex items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition ${
                      step.number < currentStep
                        ? 'bg-green-500 text-white'
                        : step.number === currentStep
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                    }`}
                  >
                    {step.number < currentStep ? '✓' : step.number}
                  </div>
                  <div className="text-xs text-center flex-1 mt-2">{step.title}</div>
                  {idx < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-1 transition ${
                        step.number < currentStep ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="min-h-[300px]">
            {currentStep === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Personal Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="Enter full name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="priya.sharma@student.edu"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="9876543210"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Academic Information</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Previous School
                    </label>
                    <input
                      type="text"
                      name="previousSchool"
                      value={formData.previousSchool}
                      onChange={handleInputChange}
                      placeholder="Delhi Public School"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Board
                    </label>
                    <select
                      name="board"
                      value={formData.board}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select</option>
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="State">State</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year of Passing
                    </label>
                    <input
                      type="number"
                      name="yearOfPassing"
                      value={formData.yearOfPassing}
                      onChange={handleInputChange}
                      placeholder="2023"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marks / Percentage
                    </label>
                    <input
                      type="text"
                      name="marksPercentage"
                      value={formData.marksPercentage}
                      onChange={handleInputChange}
                      placeholder="92%"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Course Selection</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course Category *
                    </label>
                    <select
                      name="courseCategory"
                      value={formData.courseCategory}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Arts & Science">Arts & Science</option>
                      <option value="Commerce">Commerce</option>
                      <option value="Management">Management</option>
                      <option value="Diploma">Diploma</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Course *
                    </label>
                    <input
                      type="text"
                      name="course"
                      value={formData.course}
                      onChange={handleInputChange}
                      placeholder="CSE"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Quota Selection</h2>
                <div className="space-y-3">
                  {['Government Quota', 'Management Quota'].map((option) => (
                    <label
                      key={option}
                      className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition"
                      style={{
                        borderColor: formData.quota === option ? '#3b82f6' : '#e5e7eb',
                        backgroundColor:
                          formData.quota === option ? '#eff6ff' : 'transparent',
                      }}
                    >
                      <input
                        type="radio"
                        name="quota"
                        value={option}
                        checked={formData.quota === option}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <span className="ml-3 font-medium text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Accommodation</h2>
                <div className="space-y-3">
                  {['Day Scholar', 'Hostel Required'].map((option) => (
                    <label
                      key={option}
                      className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-blue-50 transition"
                      style={{
                        borderColor: formData.accommodation === option ? '#3b82f6' : '#e5e7eb',
                        backgroundColor:
                          formData.accommodation === option ? '#eff6ff' : 'transparent',
                      }}
                    >
                      <input
                        type="radio"
                        name="accommodation"
                        value={option}
                        checked={formData.accommodation === option}
                        onChange={handleInputChange}
                        className="w-4 h-4"
                      />
                      <span className="ml-3 font-medium text-gray-700">{option}</span>
                    </label>
                  ))}
                </div>
                {formData.accommodation === 'Hostel Required' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Room Type
                    </label>
                    <select
                      name="roomType"
                      value={formData.roomType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select</option>
                      <option value="Single">Single</option>
                      <option value="Double">Double</option>
                      <option value="Triple">Triple</option>
                    </select>
                  </div>
                )}
              </div>
            )}

            {currentStep === 6 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Upload Documents</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Passport Photo
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'passportPhoto')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aadhaar Card
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'aadhaarCard')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Marksheet
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'marksheet')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Transfer Certificate (optional)
                    </label>
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e, 'transferCertificate')}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            )}

            {currentStep === 7 && !paymentDone && (
              <div className="space-y-6">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Application Fee</h3>
                  <div className="bg-white rounded-lg p-4 mb-4 border border-blue-300">
                    <p className="text-4xl font-bold text-blue-600 mb-2">₹500</p>
                    <p className="text-gray-600 text-sm">
                      One-time application processing fee
                    </p>
                  </div>
                  <div className="bg-blue-100 border-l-4 border-blue-500 p-3 rounded">
                    <p className="text-sm text-blue-800">
                      💳 Click "Proceed to Payment" to complete your payment securely
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Method
                  </label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select payment method</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="UPI">UPI</option>
                    <option value="Net Banking">Net Banking</option>
                  </select>
                </div>
              </div>
            )}

            {currentStep === 7 && paymentDone && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-white text-3xl">✓</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">Payment Successful!</h3>
                <p className="text-gray-600 mb-4">
                  Your payment has been processed successfully
                </p>
                <div className="bg-green-50 p-4 rounded-lg mb-4 text-left">
                  <p className="text-sm text-gray-600">
                    <strong>Amount Paid:</strong> ₹500
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Transaction ID:</strong> TXN{new Date().getTime()}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Date & Time:</strong> {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {currentStep === 8 && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Review Your Application</h2>

                <div className="bg-green-50 border-2 border-green-500 rounded-lg p-3 mb-4">
                  <p className="text-green-800 flex items-center">
                    <span className="text-xl mr-2">✓</span>
                    <strong>Payment Status:</strong> Paid
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
                  <div className="border-b pb-2">
                    <p className="text-gray-600">
                      <strong>Name:</strong> {formData.name}
                    </p>
                    <p className="text-gray-600">
                      <strong>Email:</strong> {formData.email}
                    </p>
                    <p className="text-gray-600">
                      <strong>Student ID:</strong> STU{Math.floor(Math.random() * 1000)}
                    </p>
                  </div>
                  <div className="border-b pb-2">
                    <p className="text-gray-600">
                      <strong>Course:</strong> {formData.course} ({formData.courseCategory})
                    </p>
                    <p className="text-gray-600">
                      <strong>Quota:</strong> {formData.quota}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">
                      <strong>Accommodation:</strong> {formData.accommodation}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                  <p>
                    By clicking "Submit Application", you confirm that all information
                    provided is accurate and complete.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8 pt-4 border-t">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className={`px-6 py-2 rounded-lg font-medium transition ${
                currentStep === 1
                  ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
              }`}
            >
              ← Previous
            </button>

            <div className="flex-1" />

            {currentStep < 7 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
              >
                Next →
              </button>
            ) : currentStep === 7 && !paymentDone ? (
              <button
                onClick={handlePayment}
                className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition"
              >
                💳 Proceed to Payment
              </button>
            ) : currentStep === 7 && paymentDone ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition flex items-center gap-2"
              >
                ✓ Submit Application
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
