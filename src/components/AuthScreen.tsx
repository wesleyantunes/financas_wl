import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { Wallet, Mail, Lock, AlertCircle, CheckCircle2, ArrowRight, UserPlus, LogIn } from 'lucide-react';

interface AuthScreenProps {
  onSuccess?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha email e senha.');
      return;
    }

    if (isSignUp) {
      if (password.length < 6) {
        setError('A senha deve ter pelo menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('As senhas não coincidem.');
        return;
      }

      setLoading(true);
      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password: password.trim(),
        });

        if (signUpError) throw signUpError;

        if (data.session) {
          setSuccessMessage('Conta criada e conectada com sucesso!');
        } else {
          setSuccessMessage('Conta criada! Se a confirmação de email estiver ativa, confirme o link enviado.');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao cadastrar.');
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(true);
      try {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (signInError) throw signInError;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao realizar login.';
        if (msg.includes('Invalid login credentials')) {
          setError('Email ou senha incorretos.');
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + window.location.pathname,
        },
      });
      if (googleError) throw googleError;
    } catch (err) {
      setError(
        err instanceof Error && err.message.includes('provider is not enabled')
          ? 'O login com Google ainda não foi ativado no painel do Supabase. Use Email e Senha abaixo!'
          : (err instanceof Error ? err.message : 'Erro ao iniciar login com Google.')
      );
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px 16px',
      background: 'radial-gradient(circle at 50% 30%, hsla(148, 100%, 36%, 0.08), transparent 70%)'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '440px',
        textAlign: 'center',
        padding: '36px 28px'
      }}>
        {/* Logo */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          color: 'var(--color-primary)',
          marginBottom: '12px'
        }}>
          <Wallet size={38} />
        </div>
        <h1 style={{ fontSize: '2rem', marginBottom: '6px', letterSpacing: '-0.5px' }}>
          Finanças<span> WL</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px' }}>
          Gestão financeira do casal sincronizada na nuvem
        </p>

        {/* Botão Google Login */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-glass)',
            color: 'var(--text-title)',
            padding: '12px 16px',
            borderRadius: '8px',
            fontSize: '0.95rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            marginBottom: '20px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary)';
            e.currentTarget.style.boxShadow = '0 0 12px var(--color-primary-glow)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--border-glass)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* Google Icon SVG */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          Entrar com o Google
        </button>

        {/* Divisor */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-glass)' }} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            ou email e senha
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-glass)' }} />
        </div>

        {/* Mensagens de Sucesso ou Erro */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--color-danger-glow)',
            border: '1px solid var(--color-danger)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: 'var(--color-danger)',
            fontSize: '0.85rem',
            textAlign: 'left',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--color-primary-glow)',
            border: '1px solid var(--color-primary)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: 'var(--color-primary)',
            fontSize: '0.85rem',
            textAlign: 'left',
            marginBottom: '16px'
          }}>
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Formulário Email / Senha */}
        <form onSubmit={handleEmailAuth} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} /> Email
            </label>
            <input
              type="email"
              className="form-control"
              placeholder="seu-email@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} /> Senha
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>

          {isSignUp && (
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} /> Confirmar Senha
              </label>
              <input
                type="password"
                className="form-control"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="btn animate-glow"
            disabled={loading}
            style={{
              width: '100%',
              backgroundColor: 'var(--color-primary)',
              color: 'hsl(140, 10%, 4%)',
              fontWeight: '700',
              marginTop: '8px'
            }}
          >
            {loading ? (
              'Carregando...'
            ) : isSignUp ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} /> Criar Conta
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <LogIn size={18} /> Entrar
              </span>
            )}
          </button>
        </form>

        {/* Alternador Entrar / Criar Conta */}
        <div style={{ marginTop: '20px' }}>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setSuccessMessage('');
            }}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-primary)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
          >
            {isSignUp ? (
              <>Já tem uma conta? <strong style={{ color: 'var(--color-primary)' }}>Entrar</strong></>
            ) : (
              <>Não tem uma conta ainda? <strong style={{ color: 'var(--color-primary)' }}>Cadastre-se <ArrowRight size={14} /></strong></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

