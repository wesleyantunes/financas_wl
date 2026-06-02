import React, { useState } from 'react';
import { Wallet, Link2, KeyRound, HelpCircle, AlertCircle, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

interface SetupScreenProps {
  onConnect: (url: string, token: string) => Promise<void>;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onConnect }) => {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Por favor, insira a URL do Web App.');
      return;
    }
    if (!token.trim()) {
      setError('Por favor, insira o Token Secreto.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await onConnect(url.trim(), token.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao conectar com o script. Verifique a URL e a Senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '24px 16px',
      background: 'radial-gradient(circle at 50% 30%, hsla(148, 100%, 36%, 0.05), transparent 60%)'
    }}>
      <div className="glass-card" style={{
        width: '100%',
        maxWidth: '480px',
        textAlign: 'center',
        padding: '36px 30px'
      }}>
        {/* Logo and Welcome */}
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--color-primary)', marginBottom: '16px' }}>
          <Wallet size={36} />
        </div>
        <h1 style={{ fontSize: '2rem', marginBottom: '8px', letterSpacing: '-0.5px' }}>
          Finanças<span>Compartilhadas</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '28px' }}>
          Gerencie o orçamento familiar de forma privada e segura usando o Google Sheets como banco de dados.
        </p>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            backgroundColor: 'var(--color-danger-glow)',
            border: '1px solid var(--color-danger)',
            borderRadius: '8px',
            padding: '12px 16px',
            color: 'var(--color-danger)',
            fontSize: '0.9rem',
            textAlign: 'left',
            marginBottom: '20px'
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{error}</span>
          </div>
        )}

        {/* Setup Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="script-url">
              <Link2 size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              URL do Web App do Google Apps Script
            </label>
            <input
              id="script-url"
              type="url"
              className="form-control"
              placeholder="https://script.google.com/macros/s/.../exec"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
              autoComplete="off"
            />
          </div>

          <div className="form-group" style={{ position: 'relative' }}>
            <label className="form-label" htmlFor="secret-token">
              <KeyRound size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
              Senha / Token Secreto
            </label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                id="secret-token"
                type={showToken ? 'text' : 'password'}
                className="form-control"
                placeholder="Insira o token definido no código"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                disabled={loading}
                style={{ paddingRight: '46px' }}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
                disabled={loading}
              >
                {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="shimmer" style={{ width: '16px', height: '16px', borderRadius: '50%', display: 'inline-block' }}></span>
                Conectando...
              </div>
            ) : 'Conectar Planilha'}
          </button>
        </form>

        {/* Tutorial / Help Link */}
        <button
          type="button"
          onClick={() => setShowHelp(!showHelp)}
          style={{
            background: 'transparent',
            border: 'none',
            color: showHelp ? 'var(--color-primary)' : 'var(--text-muted)',
            fontSize: '0.85rem',
            fontWeight: '600',
            cursor: 'pointer',
            marginTop: '24px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <HelpCircle size={16} />
          {showHelp ? 'Ocultar Guia de Configuração' : 'Como obter este link e senha?'}
        </button>

        {/* Tutorial Card */}
        {showHelp && (
          <div className="glass-card" style={{
            marginTop: '16px',
            textAlign: 'left',
            padding: '20px',
            fontSize: '0.85rem',
            lineHeight: '150%',
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-glass)'
          }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)' }}>
              <CheckCircle2 size={16} />
              Configuração Passo a Passo
            </h3>
            
            <ol style={{ paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '8px', color: 'var(--text-main)' }}>
              <li>
                Crie uma planilha vazia no seu <strong>Google Sheets</strong>.
              </li>
              <li>
                No menu superior, vá em <strong>Extensões</strong> ➔ <strong>Apps Script</strong>.
              </li>
              <li>
                Apague todo o código que estiver lá e cole o conteúdo do arquivo de script localizado em 
                <code style={{ background: 'var(--bg-tertiary)', color: 'var(--text-title)', padding: '2px 4px', borderRadius: '4px', display: 'inline-block', marginTop: '4px', fontFamily: 'monospace' }}>
                  scripts/google-apps-script.js
                </code> no repositório do projeto.
              </li>
              <li>
                No topo do código colado, mude o valor de <strong>SECRET_TOKEN</strong> para a sua senha pessoal.
              </li>
              <li>
                Clique no botão <strong>Salvar</strong> (ícone de disquete) no topo do editor de script.
              </li>
              <li>
                Clique em <strong>Implantar</strong> ➔ <strong>Nova Implantação</strong>.
              </li>
              <li>
                Clique na engrenagem ao lado de "Selecionar tipo" e escolha <strong>App da Web</strong>.
              </li>
              <li>
                Configure:
                <ul style={{ paddingLeft: '16px', marginTop: '4px', listStyleType: 'disc' }}>
                  <li><strong>Executar como:</strong> Eu (seu-email@gmail.com)</li>
                  <li><strong>Quem tem acesso:</strong> Qualquer pessoa</li>
                </ul>
              </li>
              <li>
                Clique em <strong>Implantar</strong>, conceda as permissões de acesso da sua conta Google e copie a <strong>URL do App da Web</strong> gerada. Cole-a acima!
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
