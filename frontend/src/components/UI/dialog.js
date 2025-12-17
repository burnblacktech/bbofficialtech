import React from 'react';

// Dialog Components
export const Dialog = ({ children, open, onOpenChange, ...props }) => (
  <div className={`fixed inset-0 z-50 ${open ? 'block' : 'hidden'}`} {...props}>
    <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange?.(false)} />
    <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-elevation-3 max-w-md w-full mx-4">
      {children}
    </div>
  </div>
);

export const DialogTrigger = ({ children, asChild = false, ...props }) => (
  <div {...props}>
    {children}
  </div>
);

export const DialogContent = ({ children, className = '', ...props }) => (
  <div className={`p-6 ${className}`} {...props}>
    {children}
  </div>
);

export const DialogHeader = ({ children, className = '', ...props }) => (
  <div className={`mb-4 ${className}`} {...props}>
    {children}
  </div>
);

export const DialogTitle = ({ children, className = '', ...props }) => (
  <h2 className={`text-lg font-semibold text-slate-900 ${className}`} {...props}>
    {children}
  </h2>
);
