import React from 'react';

// Tabs Components
export const Tabs = ({ children, defaultValue, value, onValueChange, className = '', ...props }) => (
  <div className={`w-full ${className}`} {...props}>
    {children}
  </div>
);

export const TabsList = ({ children, className = '', ...props }) => (
  <div className={`inline-flex h-10 items-center justify-center rounded-xl bg-slate-100 p-1 text-slate-500 ${className}`} {...props}>
    {children}
  </div>
);

export const TabsTrigger = ({ children, value, className = '', ...props }) => (
  <button
    className={`inline-flex items-center justify-center whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-white data-[state=active]:text-gray-950 data-[state=active]:shadow-elevation-1 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export const TabsContent = ({ children, value, className = '', ...props }) => (
  <div className={`mt-2 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 ${className}`} {...props}>
    {children}
  </div>
);
