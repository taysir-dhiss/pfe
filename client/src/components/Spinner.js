// Spinner — centered loading indicator
export default function Spinner() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );
}
