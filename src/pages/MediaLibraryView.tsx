import { useState, useEffect, useRef, useMemo } from 'react';
import { supabase, API_BASE_URL } from '../supabaseClient';
import { Search, Trash2, FolderOpen, Image, Video, Music, File, X } from 'lucide-react';
import CustomConfirmModal, { type ConfirmModalConfig } from '../components/CustomConfirmModal';
import './MediaLibraryView.css';

interface MediaItem {
  id: string;
  name: string;
  media_type: string;
  url: string;
  created_at: string;
}

export default function MediaLibraryView() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image' | 'video' | 'audio'>('all');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [confirmModalConfig, setConfirmModalConfig] = useState<ConfirmModalConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    
    const { data: userData } = await supabase
      .from('users')
      .select('company_id')
      .eq('auth_id', session.user.id)
      .single();
      
    if (userData) {
      setCompanyId(userData.company_id);
      const response = await fetch(`${API_BASE_URL}/api/media/${userData.company_id}`);
      const data = await response.json();
      setMediaList(data);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    // Pedir o nome da mídia
    const name = prompt("Dê um nome fácil para encontrar esse arquivo depois (ex: 'Boas-vindas Vendedora'):", file.name);
    if (!name) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("company_id", companyId);
    formData.append("name", name);
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE_URL}/api/media`, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        fetchMedia();
      } else {
        alert("Erro no upload.");
      }
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar arquivo.");
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = (id: string) => {
    const item = mediaList.find(m => m.id === id);
    const mediaName = item ? item.name : 'esta mídia';

    setConfirmModalConfig({
      isOpen: true,
      title: 'Excluir Mídia da Biblioteca',
      message: `Tem certeza que deseja apagar "${mediaName}"? Se ela estiver sendo usada em um Fluxo, o envio falhará.`,
      confirmText: 'Sim, Apagar Mídia',
      cancelText: 'Cancelar',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await fetch(`${API_BASE_URL}/api/media/${id}`, { method: 'DELETE' });
          setMediaList(prev => prev.filter(m => m.id !== id));
        } catch (error) {
          console.error(error);
        }
      }
    });
  };

  const filteredMedia = useMemo(() => {
    return mediaList.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.media_type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = typeFilter === 'all' || item.media_type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [mediaList, searchQuery, typeFilter]);

  return (
    <div className="media-library-root">
      <header className="media-header">
        <div className="media-title">
          <FolderOpen size={24} style={{ color: 'var(--primary)' }} />
          <h2>Biblioteca de Mídia</h2>
          <span className="media-count-badge">{filteredMedia.length} de {mediaList.length}</span>
        </div>

        <div className="media-header-actions">
          <div className="media-search-wrapper">
            <Search size={16} className="media-search-icon" />
            <input 
              type="text"
              className="media-search-input"
              placeholder="Buscar mídia por nome..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="media-search-clear" 
                onClick={() => setSearchQuery('')}
                title="Limpar busca"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="media-filter-buttons">
            <button 
              className={`filter-btn ${typeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setTypeFilter('all')}
            >
              Todos
            </button>
            <button 
              className={`filter-btn ${typeFilter === 'image' ? 'active' : ''}`}
              onClick={() => setTypeFilter('image')}
              title="Filtrar Imagens"
            >
              <Image size={14} /> Imagens
            </button>
            <button 
              className={`filter-btn ${typeFilter === 'video' ? 'active' : ''}`}
              onClick={() => setTypeFilter('video')}
              title="Filtrar Vídeos"
            >
              <Video size={14} /> Vídeos
            </button>
            <button 
              className={`filter-btn ${typeFilter === 'audio' ? 'active' : ''}`}
              onClick={() => setTypeFilter('audio')}
              title="Filtrar Áudios"
            >
              <Music size={14} /> Áudios
            </button>
          </div>

          <button 
            className="btn-primary media-upload-btn" 
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
          >
            {loading ? 'Enviando...' : '+ Adicionar Nova Mídia'}
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            style={{ display: 'none' }} 
            accept="audio/*,image/*,video/*"
            onChange={handleUpload}
          />
        </div>
      </header>

      <div className="media-grid">
        {filteredMedia.map(media => (
          <div key={media.id} className="media-card">
            <div className="media-card-top">
              <h4 className="media-card-name" title={media.name}>{media.name}</h4>
              <button 
                onClick={() => handleDelete(media.id)}
                className="media-delete-btn"
                title="Excluir mídia"
                aria-label={`Excluir ${media.name}`}
              >
                <Trash2 size={15} />
              </button>
            </div>

            <div className="media-card-meta">
              <span className={`media-badge badge-${media.media_type}`}>
                {media.media_type.toUpperCase()}
              </span>
              <span className="media-date">
                {new Date(media.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="media-preview-container">
              {media.media_type === 'image' && (
                <img src={media.url} alt={media.name} className="media-preview-img" loading="lazy" />
              )}
              {media.media_type === 'audio' && (
                <div className="media-audio-box">
                  <Music size={32} style={{ color: 'var(--primary)', marginBottom: 8 }} />
                  <audio src={media.url} controls className="media-audio-player" />
                </div>
              )}
              {media.media_type === 'video' && (
                <video src={media.url} controls className="media-preview-video" preload="metadata" />
              )}
            </div>
          </div>
        ))}

        {filteredMedia.length === 0 && !loading && (
          <div className="media-empty-state">
            <FolderOpen size={48} style={{ color: 'var(--muted-foreground)', opacity: 0.5, marginBottom: 12 }} />
            {searchQuery || typeFilter !== 'all' ? (
              <>
                <h3>Nenhuma mídia encontrada</h3>
                <p>Nenhum resultado corresponde à sua pesquisa "{searchQuery}".</p>
                <button 
                  className="btn-clear-filters" 
                  onClick={() => { setSearchQuery(''); setTypeFilter('all'); }}
                >
                  Limpar filtros de busca
                </button>
              </>
            ) : (
              <>
                <h3>Nenhuma mídia salva ainda</h3>
                <p>Faça upload de áudios, vídeos e imagens para usar em seus fluxos e mensagens.</p>
              </>
            )}
          </div>
        )}
      </div>
      {/* Custom Confirm Modal */}
      <CustomConfirmModal
        config={confirmModalConfig}
        onClose={() => setConfirmModalConfig(null)}
      />
    </div>
  );
}
