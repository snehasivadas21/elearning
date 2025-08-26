// frontend/src/components/ui/Input.jsx
export function Input({ className, ...props }) {
  return <input className={`border rounded p-2 w-full ${className || ""}`} {...props} />;
}
