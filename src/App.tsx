import { useState, useEffect } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { ExpenseForm } from './components/ExpenseForm';
import { testConnection, initializeSpreadsheet } from './services/api';
import { Wallet, LogOut, PlusCircle, LayoutDashboard, Calendar } from 'lucide-react';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [appUrl, setAppUrl] = useState<string>('');
  const [secretToken, setSecretToken] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<'Wesley' | 'Luana'>('Wesley');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new-expense' | 'recurring'>('dashboard');

  // Load credentials from localStorage
  useEffect(() => {
    const savedUrl = localStorage.getItem('finance_app_url');
    const savedToken = localStorage.getItem('finance_secret_token');
    const savedUser = localStorage.getItem('finance_active_user');

    if (savedUrl && savedToken) {
      setAppUrl(savedUrl);
      setSecretToken(savedToken);
      setIsAuthenticated(true);
    }
    if (savedUser === 'Wesley' || savedUser === 'Luana') {
      setCurrentUser(savedUser);
    }
  }, []);

  const handleConnect = async (url: string, token: string) => {
    // 1. Testa a conexão (Ping)
    await testConnection(url, token);
    
    // 2. Garante a inicialização das abas na planilha
    await initializeSpreadsheet(url, token);
    
    // 3. Salva no localStorage em caso de sucesso
    localStorage.setItem('finance_app_url', url);
    localStorage.setItem('finance_secret_token', token);
    localStorage.setItem('finance_active_user', currentUser);
    
    setAppUrl(url);
    setSecretToken(token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('finance_app_url');
    localStorage.removeItem('finance_secret_token');
    setIsAuthenticated(false);
    setAppUrl('');
    setSecretToken('');
  };

  const handleUserToggle = (user: 'Wesley' | 'Luana') => {
    setCurrentUser(user);
    localStorage.setItem('finance_active_user', user);
  };

  if (!isAuthenticated) {
    return <SetupScreen onConnect={handleConnect} />;
  }

  return (
    <div id="root">
      {/* Header */}
      <header>
        <div className="nav-container">
          <div className="logo-text">
            <Wallet size={24} />
            <span>Finanças</span>Compartilhadas
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* User Toggle Switch */}
            <div style={{
              display: 'inline-flex',
              background: 'var(--bg-primary)',
              borderRadius: '20px',
              padding: '2px',
              border: '1px solid var(--border-glass)'
            }}>
              <button 
                onClick={() => handleUserToggle('Wesley')}
                style={{
                  background: currentUser === 'Wesley' ? 'var(--color-primary)' : 'transparent',
                  color: currentUser === 'Wesley' ? 'hsl(140, 10%, 4%)' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '18px',
                  padding: '6px 14px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Wesley
              </button>
              <button 
                onClick={() => handleUserToggle('Luana')}
                style={{
                  background: currentUser === 'Luana' ? 'var(--color-primary)' : 'transparent',
                  color: currentUser === 'Luana' ? 'hsl(140, 10%, 4%)' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '18px',
                  padding: '6px 14px',
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                Luana
              </button>
            </div>

            {/* Logout Button */}
            <button 
              onClick={handleLogout}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
              title="Sair"
            >
              <LogOut size={18} />
              <span className="hidden-mobile" style={{ fontSize: '0.85rem' }}>Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'dashboard' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <LayoutDashboard size={48} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
            <h2>Painel Principal</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Gráficos e estatísticas consolidadas da planilha.</p>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '24px' }} data-token={secretToken ? 'configured' : 'none'}>
              Conectado ao script: <span style={{ fontFamily: 'monospace', color: 'var(--color-primary)' }}>{appUrl ? `${appUrl.substring(0, 35)}...` : ''}</span>
            </div>
          </div>
        )}

        {activeTab === 'new-expense' && (
          <ExpenseForm 
            url={appUrl} 
            token={secretToken} 
            currentUser={currentUser} 
          />
        )}

        {activeTab === 'recurring' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Calendar size={48} style={{ color: 'var(--color-primary)', marginBottom: '16px' }} />
            <h2>Despesas Recorrentes</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Planejamento mensal e contas a pagar.</p>
          </div>
        )}
      </main>

      {/* Bottom Mobile-first Navigation */}
      <div style={{
        position: 'sticky',
        bottom: 0,
        width: '100%',
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-glass)',
        padding: '10px 0',
        zIndex: 100
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          maxWidth: '600px',
          margin: '0 auto',
          padding: '0 16px'
        }}>
          <button 
            onClick={() => setActiveTab('dashboard')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'dashboard' ? 'var(--color-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: activeTab === 'dashboard' ? '600' : '400',
              transition: 'color 0.2s ease'
            }}
          >
            <LayoutDashboard size={20} />
            Dashboard
          </button>

          <button 
            onClick={() => setActiveTab('new-expense')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'new-expense' ? 'var(--color-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: activeTab === 'new-expense' ? '600' : '400',
              transition: 'color 0.2s ease'
            }}
          >
            <PlusCircle size={20} />
            Lançar
          </button>

          <button 
            onClick={() => setActiveTab('recurring')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'recurring' ? 'var(--color-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: activeTab === 'recurring' ? '600' : '400',
              transition: 'color 0.2s ease'
            }}
          >
            <Calendar size={20} />
            Recorrentes
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
