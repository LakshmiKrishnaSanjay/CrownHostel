import React from 'react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-3 text-center text-sm text-gray-600">
      © {new Date().getFullYear()} Crown Hostel. All rights reserved.
      <span className="text-gray-400 ml-2">— AdsPro | <span className="italic">LKS</span></span>
    </footer>
  );
}

