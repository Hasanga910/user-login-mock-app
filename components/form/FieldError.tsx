/** A field's error message, linked to its input via aria-describedby={`${name}-error`}. */
export default function FieldError({ name, error }: { name: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={`${name}-error`} className="field-error" role="alert">
      {error}
    </p>
  );
}
