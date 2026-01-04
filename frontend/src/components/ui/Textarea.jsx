export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={`border rounded p-2 w-full ${className || ""}`}
      {...props}
    />
  );
}
