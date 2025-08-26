import { useState } from "react";

export function Select({ children, onValueChange }) {
  const [value, setValue] = useState("");
  
  const handleChange = (e) => {
    setValue(e.target.value);
    if (onValueChange) onValueChange(e.target.value);
  };

  return (
    <select
      value={value}
      onChange={handleChange}
      className="border rounded px-2 py-1 w-full"
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children, className }) {
  return <div className={className}>{children}</div>;
}

export function SelectValue({ placeholder }) {
  return <option disabled value="">{placeholder}</option>;
}

export function SelectContent({ children }) {
  return <>{children}</>;
}

export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>;
}
