import React from 'react';
import { generalInstructions, industryInstructions } from '../data/instructionsData';

const Instructions = () => {
  // Retrieve user from localStorage (or adapt if using context/Redux)
  const user = JSON.parse(localStorage.getItem('user'));
  const industry = user?.industry;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">General Instructions</h2>
      <ul className="space-y-2 mb-6">
        {generalInstructions.map((inst, idx) => (
          <li key={idx} className="text-gray-700">{inst}</li>
        ))}
      </ul>
      <h2 className="text-2xl font-bold mb-4">Industry-Specific Instructions</h2>
      {industry ? (
        <>
          <div className="mb-4">
            <strong className="text-blue-600">Industry:</strong> {industry}
          </div>
          <ul className="space-y-2">
            {(industryInstructions[industry] || []).map((inst, idx) => (
              <li key={idx} className="text-gray-700">{inst}</li>
            ))}
          </ul>
        </>
      ) : (
        <div className="text-red-600 p-4 bg-red-50 border border-red-200 rounded-lg">
          No industry information found. Please update your profile.
        </div>
      )}
    </div>
  );
};

export default Instructions;
