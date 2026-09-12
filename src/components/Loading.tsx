import { Flame } from 'lucide-react';

export function Loading() {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="relative">
        <Flame className="w-12 h-12 text-primary-500 animate-pulse" />
      </div>
      <p className="text-secondary-400 mt-4 text-sm">Chargement...</p>
    </div>
  );
}

export function EmptyState({ title, message }: { title: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mb-4">
        <Flame className="w-8 h-8 text-secondary-300" />
      </div>
      <h3 className="font-semibold text-secondary-700 text-lg">{title}</h3>
      {message && <p className="text-secondary-400 text-sm mt-1 max-w-sm">{message}</p>}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-error-50 rounded-full flex items-center justify-center mb-4">
        <span className="text-error-500 text-2xl">!</span>
      </div>
      <h3 className="font-semibold text-secondary-700 text-lg">Une erreur est survenue</h3>
      <p className="text-secondary-400 text-sm mt-1">{message}</p>
    </div>
  );
}
