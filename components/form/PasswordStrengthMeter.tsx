import { STRENGTH_LEVELS, type StrengthLevel, type StrengthResult } from '@/lib/passwordStrength';

const COLORS: Record<StrengthLevel, { bar: string; text: string }> = {
  weak: { bar: 'bg-red-500', text: 'text-red-600' },
  fair: { bar: 'bg-orange-500', text: 'text-orange-600' },
  good: { bar: 'bg-lime-500', text: 'text-lime-700' },
  strong: { bar: 'bg-green-600', text: 'text-green-700' },
};

/** Four-segment strength bar. Hidden while the password is empty. */
export default function PasswordStrengthMeter({ password, result }: { password: string; result: StrengthResult | null }) {
  if (!password) return null;

  const level = result ? STRENGTH_LEVELS[result.level] : null;
  const colors = result ? COLORS[result.level] : null;
  const step = level?.step ?? 0;
  const label = level?.label ?? 'Checking…';

  return (
    <div className="mt-2">
      <div className="flex items-center gap-3">
        <div
          role="meter"
          aria-valuemin={0}
          aria-valuemax={4}
          aria-valuenow={step}
          aria-valuetext={label}
          aria-label={`Password strength: ${label}`}
          className="flex flex-1 gap-1"
        >
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div
                className={`h-full rounded-full transition-all duration-300 ease-out ${i <= step ? `w-full ${colors?.bar}` : 'w-0'}`}
                style={{ transitionDelay: i <= step ? `${(i - 1) * 60}ms` : '0ms' }}
              />
            </div>
          ))}
        </div>
        <span aria-hidden="true" className={`w-14 text-right text-xs font-medium ${colors?.text ?? 'text-gray-500'}`}>
          {label}
        </span>
      </div>
      {result?.feedback && <p className="mt-1 text-xs text-gray-500">{result.feedback}</p>}
    </div>
  );
}
