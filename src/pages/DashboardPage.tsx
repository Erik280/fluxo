import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import ChatView from './ChatView';
import KanbanView from './KanbanView';
import SettingsView from './SettingsView';
import MediaLibraryView from './MediaLibraryView';
import FlowBuilderView from './FlowBuilderView';
import CampaignView from './CampaignView';
import QuickRepliesView from './QuickRepliesView';

type ViewType = 'chat' | 'kanban' | 'settings' | 'media' | 'flows' | 'campaigns' | 'quick-replies';

const VALID_VIEWS: ViewType[] = ['chat', 'kanban', 'settings', 'media', 'flows', 'campaigns', 'quick-replies'];

export default function DashboardPage() {
  const navigate = useNavigate();
  const { '*': wildcard } = useParams();

  // segments: ex: ['chat', '554888602478']
  const segments = (wildcard || '').split('/').filter(Boolean);
  const currentView = segments[0] as ViewType;

  // Derive activeView from the URL; default to 'kanban'
  const activeView: ViewType = VALID_VIEWS.includes(currentView)
    ? currentView
    : (VALID_VIEWS.includes(wildcard as ViewType) ? (wildcard as ViewType) : 'kanban');

  const handleViewChange = (view: ViewType) => {
    navigate(`/dashboard/${view}`);
  };

  return (
    <DashboardLayout activeView={activeView} onViewChange={handleViewChange}>
      {activeView === 'chat'          && <ChatView activeChatParam={segments[1]} />}
      {activeView === 'kanban'        && <KanbanView />}
      {activeView === 'settings'      && <SettingsView />}
      {activeView === 'media'         && <MediaLibraryView />}
      {activeView === 'flows'         && <FlowBuilderView />}
      {activeView === 'campaigns'     && <CampaignView />}
      {activeView === 'quick-replies' && <QuickRepliesView />}
    </DashboardLayout>
  );
}
