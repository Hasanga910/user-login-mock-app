import { PASSWORD_RULES } from '@/lib/passwordRules';

/** Live list of the password rules, ticked as each one is met. */
export default function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 text-xs sm:grid-cols-2" aria-label="Password requirements">
      {PASSWORD_RULES.map((rule) => {
        const met = password !== '' && rule.test(password);
        return (
          <li key={rule.id} className={`flex items-center gap-1.5 ${met ? 'text-green-700' : 'text-gray-500'}`}>
            {met ? (
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5 shrink-0 text-green-600">
                <path fillRule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0Z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 shrink-0 text-gray-400">
                <circle cx="10" cy="10" r="6" />
              </svg>
            )}
            <span>
              {rule.label}
              <span className="sr-only">{met ? ' (met)' : ' (not met)'}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
