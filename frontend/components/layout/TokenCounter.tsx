"use client";

import React, { useState } from 'react';
import { ChevronDown, Coins, CreditCard, Fuel } from 'lucide-react';

// Utility function to format numbers consistently for hydration
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export const TokenCounter: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState(2450); // Mock balance
  const [isLowBalance, setIsLowBalance] = useState(balance < 500);

  const handlePurchase = (tokenPackage: { tokens: number; price: number }) => {
    // TODO: Implement Stripe purchase flow
    console.log('Purchase:', tokenPackage);
    setBalance(balance + tokenPackage.tokens);
    setIsOpen(false);
  };

  const tokenPackages = [
    { tokens: 1000, price: 10, popular: false },
    { tokens: 5000, price: 40, popular: true },
    { tokens: 10000, price: 75, popular: false },
    { tokens: 25000, price: 150, popular: false },
  ];

  return (
    <div className="relative">
      {/* Token Counter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
          isLowBalance 
            ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' 
            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <div className="flex items-center space-x-2">
          {isLowBalance && <Fuel className="w-4 h-4 text-amber-600" />}
          <Coins className="w-4 h-4" />
          <span className="font-medium">{formatNumber(balance)}</span>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Token Balance</h3>
              <div className="flex items-center space-x-2">
                <Coins className="w-5 h-5 text-gray-400" />
                <span className="text-xl font-bold text-gray-900">{formatNumber(balance)}</span>
              </div>
            </div>

            {/* Low Balance Warning */}
            {isLowBalance && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Fuel className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800">Running low on tokens</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Top up to keep digging into your investigations.
                </p>
              </div>
            )}

            {/* Token Usage Info */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Total purchased:</span>
                  <span className="font-medium">15,000</span>
                </div>
                <div className="flex justify-between">
                  <span>Total used:</span>
                  <span className="font-medium">12,550</span>
                </div>
                <div className="flex justify-between">
                  <span>Remaining:</span>
                  <span className="font-medium text-gray-900">{formatNumber(balance)}</span>
                </div>
              </div>
            </div>

            {/* Purchase Options */}
            <div className="space-y-2 mb-4">
              <h4 className="text-sm font-medium text-gray-900">Buy more tokens</h4>
              {tokenPackages.map((pkg) => (
                <button
                  key={pkg.tokens}
                  onClick={() => handlePurchase(pkg)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                    pkg.popular
                      ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Coins className="w-4 h-4 text-gray-400" />
                    <div className="text-left">
                      <div className="font-medium text-gray-900">
                        {formatNumber(pkg.tokens)} tokens
                      </div>
                      <div className="text-sm text-gray-500">
                        ${pkg.price} • ${(pkg.price / (pkg.tokens / 1000)).toFixed(2)}/1k tokens
                      </div>
                    </div>
                  </div>
                  {pkg.popular && (
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      Popular
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Payment Info */}
            <div className="pt-3 border-t border-gray-200">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <CreditCard className="w-4 h-4" />
                <span>Secure payment with Stripe</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                No subscription required. Pay only for what you use.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}; 