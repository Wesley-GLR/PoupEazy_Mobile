import { useEffect, useState } from 'react';

import { useAuth } from '@/auth/auth-context';
import { getErrorMessage } from '@/utils/format';

export function useEmailVerification(email: string, initialCooldownSeconds = 0) {
  const { resendVerification } = useAuth();
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(Date.now);
  const [resendAvailableAt, setResendAvailableAt] = useState(() => Date.now() + initialCooldownSeconds * 1000);
  const remainingSeconds = Math.max(0, Math.ceil((resendAvailableAt - now) / 1000));

  useEffect(() => {
    if (resendAvailableAt <= Date.now()) return;
    const timer = setInterval(() => {
      const currentTime = Date.now();
      setNow(currentTime);
      if (currentTime >= resendAvailableAt) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendAvailableAt]);

  async function resendEmail() {
    if (resending || remainingSeconds) return;
    setResending(true);
    setMessage(null);
    setError(null);
    try {
      if (!email) throw new Error('Não foi possível identificar seu e-mail. Atualize a página e tente novamente.');
      await resendVerification(email);
      setMessage('Se houver um cadastro pendente para este e-mail, enviaremos um novo link de confirmação.');
      const requestedAt = Date.now();
      setNow(requestedAt);
      setResendAvailableAt(requestedAt + 60_000);
    } catch (failure) {
      setError(getErrorMessage(failure, 'Não foi possível solicitar outro link. Tente novamente.'));
    } finally {
      setResending(false);
    }
  }

  return { resending, message, error, remainingSeconds, resendEmail };
}
