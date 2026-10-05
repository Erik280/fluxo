import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { MessageCircle, Kanban, Settings, LogOut, Zap, Megaphone, FolderOpen, Keyboard, Menu, X } from 'lucide-react';
import './DashboardLayout.css';
import ThemeToggle from './ThemeToggle';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeView: 'chat' | 'kanban' | 'settings' | 'media' | 'flows' | 'campaigns' | 'quick-replies';
  onViewChange: (view: 'chat' | 'kanban' | 'settings' | 'media' | 'flows' | 'campaigns' | 'quick-replies') => void;
}

export default function DashboardLayout({ children, activeView, onViewChange }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  useEffect(() => {
    const handleOpenMenu = () => setIsMobileMenuOpen(true);
    window.addEventListener('open-mobile-menu', handleOpenMenu);
    return () => window.removeEventListener('open-mobile-menu', handleOpenMenu);
  }, []);

  // Compute real innerHeight for mobile viewports (--vh)
  useEffect(() => {
    const updateVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    updateVh();
    window.addEventListener('resize', updateVh);
    window.addEventListener('orientationchange', updateVh);
    return () => {
      window.removeEventListener('resize', updateVh);
      window.removeEventListener('orientationchange', updateVh);
    };
  }, []);

  useEffect(() => {
    // Check auth
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/');
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    let messageSub: any = null;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      const { data: userData } = await supabase
        .from('users')
        .select('company_id, name, avatar_url')
        .eq('auth_id', session.user.id)
        .single();
        
      if (userData) {
        if (userData.avatar_url) setUserAvatar(userData.avatar_url);
        if (userData.name) setUserName(userData.name);
      }
        
      if (userData?.company_id) {
        const audio = new Audio('/sound/notification.mp3');
        
        messageSub = supabase
          .channel(`global-messages-${userData.company_id}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'messages', 
            filter: `company_id=eq.${userData.company_id}` 
          }, (payload) => {
            if (payload.new && payload.new.direction === 'in') {
              audio.play().catch(e => console.warn('Notificação de áudio bloqueada (Autoplay Policy):', e));
            }
          })
          .subscribe();
      }
    };

    setupRealtime();

    return () => {
      if (messageSub) {
        supabase.removeChannel(messageSub);
      }
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleViewChange = (view: 'chat' | 'kanban' | 'settings' | 'media' | 'flows' | 'campaigns' | 'quick-replies') => {
    onViewChange(view);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="dashboard-root">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button 
          className="mobile-menu-btn" 
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>
        <div className="mobile-logo" onClick={() => handleViewChange('settings')} style={{ cursor: 'pointer' }} title={userName || 'Meu Perfil'}>
          <div className="avatar-wrapper mobile-avatar-ring">
            <img 
              src={userAvatar || '/user-avatar.jpg'} 
              alt={userName || 'Avatar'} 
              className="user-top-avatar"
              onError={(e) => {
                // Fallback para o avatar gerado caso o link do banco falhe
                (e.target as HTMLImageElement).src = '/user-avatar.jpg';
              }}
            />
          </div>
        </div>
      </header>

      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="mobile-backdrop" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        {/* Mobile Close Button */}
        <button 
          className="mobile-close-btn" 
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Fechar menu"
        >
          <X size={24} />
        </button>

        <div className="sidebar-logo">
          <div 
            className="logo-ring avatar-wrapper" 
            onClick={() => handleViewChange('settings')} 
            style={{ cursor: 'pointer' }}
            title={userName ? `Logado como: ${userName}` : 'Meu Perfil'}
          >
            <img 
              src={userAvatar || '/user-avatar.jpg'} 
              alt={userName || 'Avatar'} 
              className="user-top-avatar"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/user-avatar.jpg';
              }}
            />
          </div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-btn ${activeView === 'chat' ? 'active' : ''}`}
            onClick={() => handleViewChange('chat')}
            title="Chat"
          >
            <MessageCircle size={22} />
          </button>
          <button 
            className={`nav-btn ${activeView === 'kanban' ? 'active' : ''}`}
            onClick={() => handleViewChange('kanban')}
            title="Kanban"
          >
            <Kanban size={22} />
          </button>
          <button 
            className={`nav-btn ${activeView === 'flows' ? 'active' : ''}`}
            onClick={() => handleViewChange('flows')}
            title="Construtor de Fluxos"
          >
            <Zap size={22} />
          </button>
          <button 
            className={`nav-btn ${activeView === 'campaigns' ? 'active' : ''}`}
            onClick={() => handleViewChange('campaigns')}
            title="Campanhas"
          >
            <Megaphone size={22} />
          </button>
          <button 
            className={`nav-btn ${activeView === 'media' ? 'active' : ''}`}
            onClick={() => handleViewChange('media')}
            title="Biblioteca de Mídia"
          >
            <FolderOpen size={22} />
          </button>
          <button 
            className={`nav-btn ${activeView === 'quick-replies' ? 'active' : ''}`}
            onClick={() => handleViewChange('quick-replies')}
            title="Respostas Rápidas"
          >
            <Keyboard size={22} />
          </button>
          <button 
            className={`nav-btn ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => handleViewChange('settings')}
            title="Configurações"
          >
            <Settings size={22} />
          </button>
        </nav>

        <div className="sidebar-footer">
          <ThemeToggle className="nav-btn" />
          <button className="nav-btn logout-btn" onClick={handleLogout} title="Sair">
            <LogOut size={22} />
          </button>
        </div>
      </aside>

      <main className="dashboard-content">
        {children}
      </main>
    </div>
  );
}
