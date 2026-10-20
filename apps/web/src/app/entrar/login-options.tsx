import { EmailLogin } from './email-login';
import { OAuthButtons } from './oauth-buttons';
import { PasswordForm } from './password-form';

/** Google, Apple, e-mail com confirmação e (escondido) senha das contas demo/admin. */
export function LoginOptions({ next }: { next: string }) {
  return (
    <div className="stack">
      <div className="card stack">
        <OAuthButtons next={next} />
        <p className="muted" style={{ textAlign: 'center', margin: 0 }}>
          ou
        </p>
        <EmailLogin next={next} />
      </div>
      <details>
        <summary className="muted">Acesso de demonstração ou administração</summary>
        <div className="card stack" style={{ marginTop: 12 }}>
          <PasswordForm next={next} />
        </div>
      </details>
    </div>
  );
}
