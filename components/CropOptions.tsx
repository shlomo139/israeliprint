
import React from 'react';
import { CropOption } from '../types';
import { CROP_OPTIONS } from '../constants';

interface CropOptionsProps {
  selectedOption: CropOption;
  onChange: (option: CropOption) => void;
}

// This component is currently bypassed in favor of direct implementation in ProductModal
// but kept for potential future re-use.
const CropOptions: React.FC<CropOptionsProps> = ({ selectedOption, onChange }) => {
  return (
    <div className="space-y-4">
      {CROP_OPTIONS.map((option) => (
        <label
          key={option.id}
          className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
            selectedOption === option.id
              ? 'bg-yisraeli-yellow/10 border-yisraeli-yellow shadow-sm'
              : 'bg-gray-50 border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="crop-option"
            value={option.id}
            checked={selectedOption === option.id}
            onChange={() => onChange(option.id)}
            className="mt-1 h-4 w-4 text-yisraeli-blue border-gray-300 focus:ring-yisraeli-blue"
          />
          <div className="mr-4 flex-1">
            <span className="font-semibold text-gray-900">{option.title}</span>
            <p className="text-sm text-gray-600">{option.description}</p>
          </div>
        </label>
      ))}
    </div>
  );
};

export default CropOptions;
