/** Error message shown inside a form (successes are shown as notifications instead). */
const FormError = ({ message }: { message: string | null }) =>
  message && (
    <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
      {message}
    </p>
  );

export default FormError;
