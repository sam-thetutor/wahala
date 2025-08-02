import React from 'react';
import { Network, Globe } from 'lucide-react';

interface ChainOption {
  id: number;
  name: string;
  shortName: string;
  icon: string;
  color: string;
}

interface ChainSelectorProps {
  value: number;
  onChange: (chainId: number) => void;
  className?: string;
  disabled?: boolean;
}

const CHAIN_OPTIONS: ChainOption[] = [
  {
    id: 42220,
    name: 'Celo Mainnet',
    shortName: 'Celo',
    icon: '🌾',
    color: 'bg-green-500',
  },
  {
    id: 44787,
    name: 'Celo Alfajores',
    shortName: 'Alfajores',
    icon: '🧪',
    color: 'bg-yellow-500',
  },
];

export const ChainSelector: React.FC<ChainSelectorProps> = ({
  value,
  onChange,
  className = '',
  disabled = false,
}) => {
  const selectedChain = CHAIN_OPTIONS.find(chain => chain.id === value);

  return (
    <div className={`space-y-2 ${className}`}>
      <label className="block font-handwriting text-sm font-medium text-gray-700 mb-2">
        🌐 Network
      </label>
      
      <div className="grid grid-cols-2 gap-3">
        {CHAIN_OPTIONS.map((chain) => (
          <button
            key={chain.id}
            onClick={() => onChange(chain.id)}
            disabled={disabled}
            className={`relative p-4 rounded-lg border-2 transition-all duration-200 font-handwriting ${
              value === chain.id
                ? 'border-purple-500 bg-purple-50 shadow-md scale-105'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          >
            {/* Selection indicator */}
            {value === chain.id && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${chain.color} flex items-center justify-center text-white text-lg`}>
                {chain.icon}
              </div>
              
              <div className="text-left">
                <h4 className="font-handwriting font-bold text-gray-900">
                  {chain.shortName}
                </h4>
                <p className="font-handwriting text-xs text-gray-500">
                  {chain.name}
                </p>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected chain info */}
      {selectedChain && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-500" />
            <div>
              <p className="font-handwriting text-sm font-medium text-blue-800">
                Selected: {selectedChain.name}
              </p>
              <p className="font-handwriting text-xs text-blue-600">
                Chain ID: {selectedChain.id}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 