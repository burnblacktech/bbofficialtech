import React from 'react';

const Select = ({ children, className = '', ...props }) => {
  const baseClasses = 'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';
  const classes = `${baseClasses} ${className}`;

  return (
    <select className={classes} {...props}>
      {children}
    </select>
  );
};

export default Select;
