import { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './services/supabase';
import { AuthScreen } from './components/AuthScreen';
import { ExpenseForm } from './components/ExpenseForm';
import { RecurringPanel } from './components/RecurringPanel';
import { Dashboard } from './components/Dashboard';
import { HistoryPanel } from './components/HistoryPanel';
import { CardInvoicePanel } from './components/CardInvoicePanel';
import { Wallet, LogOut, PlusCircle, LayoutDashboard, Calendar, History, CreditCard } from 'lucide-react';

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [currentUser, setCurrentUser] = useState<'Wesley' | 'Luana'>(() => {
    const savedUser = localStorage.getItem('finance_active_user');
    return (savedUser === 'Wesley' || savedUser === 'Luana') ? savedUser : 'Wesley';
  });
  const [activeTab, setActiveTab] = useState<'dashboard' | 'new-expense' | 'cards' | 'recurring' | 'history'>('dashboard');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingSession(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoadingSession(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const handleUserToggle = (user: 'Wesley' | 'Luana') => {
    setCurrentUser(user);
    localStorage.setItem('finance_active_user', user);
  };

  if (loadingSession) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: '16px',
        color: 'var(--color-primary)'
      }}>
        <Wallet size={40} className="animate-glow" />
        <span style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>Carregando finanças...</span>
      </div>
    );
  }

  if (!session) {
    return <AuthScreen />;
  }

  return (
    <div id="root">
      {/* Header */}
      <header>
        <div className="nav-container">
          <div className="logo-text">
            <Wallet size={24} />
            <span>Finanças</span> WL
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
          <Dashboard
            url=""
            token=""
          />
        )}

        {activeTab === 'new-expense' && (
          <ExpenseForm
            url=""
            token=""
            currentUser={currentUser}
          />
        )}

        {activeTab === 'cards' && (
          <CardInvoicePanel
            url=""
            token=""
            currentUser={currentUser}
          />
        )}

        {activeTab === 'recurring' && (
          <RecurringPanel
            url=""
            token=""
            currentUser={currentUser}
          />
        )}

        {activeTab === 'history' && (
          <HistoryPanel
            url=""
            token=""
            currentUser={currentUser}
          />
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
            onClick={() => setActiveTab('cards')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'cards' ? 'var(--color-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: activeTab === 'cards' ? '600' : '400',
              transition: 'color 0.2s ease'
            }}
          >
            <CreditCard size={20} />
            Cartões
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

          <button
            onClick={() => setActiveTab('history')}
            style={{
              background: 'transparent',
              border: 'none',
              color: activeTab === 'history' ? 'var(--color-primary)' : 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.75rem',
              fontWeight: activeTab === 'history' ? '600' : '400',
              transition: 'color 0.2s ease'
            }}
          >
            <History size={20} />
            Histórico
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
