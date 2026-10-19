import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  Download,
  ExternalLink,
  Search,
  MessageSquare,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { ResearchSession } from '../../types';
import { api } from '../../lib/api';

interface ActivityHistoryViewProps {
  onResumeSession: (sessionId: string) => void;
}

export const ActivityHistoryView: React.FC<ActivityHistoryViewProps> = ({
  onResumeSession,
}) => {
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchSessions = () => {
    setLoading(true);
    api.getSessions()
      .then(setSessions)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await api.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (e) {
      console.error('Failed to delete session:', e);
    }
  };

  const handleExport = (sess: ResearchSession) => {
    let md = `# Research Session Transcript: ${sess.title}\nDate: ${new Date(sess.createdAt).toLocaleString()}\n\n`;
    sess.messages.forEach(m => {
      md += `### ${m.role === 'user' ? 'Inquirer' : 'KNOWLEDGE OS Grounded Answer'}\n${m.content}\n\n`;
      if (m.answerDetails?.citations && m.answerDetails.citations.length > 0) {
        md += `**Citations:**\n`;
        m.answerDetails.citations.forEach(c => {
          md += `- [${c.index}] "${c.documentTitle}" (p. ${c.page || 'N/A'}): ${c.excerpt}\n`;
        });
        md += '\n';
      }
    });

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `session_${sess.id}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredSessions = sessions.filter(s =>
    search ? s.title.toLowerCase().includes(search.toLowerCase()) : true
  );

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-53px)] bg-[#F6F4EE] overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#506B58] mb-1">
              <History className="w-4 h-4" />
              <span>Research Provenance & Auditing</span>
            </div>
            <h1 className="font-editorial text-2xl lg:text-3xl font-medium text-[#222822]">
              Activity & Session History
            </h1>
            <p className="text-xs text-[#575D56] mt-1">
              Audit and resume previous inquiries with preserved citations and document scopes.
            </p>
          </div>

          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-[#8A9088] absolute left-2.5 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search sessions..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#FFFEFA] border border-[#E5E2D9] rounded-md text-[#222822] placeholder-[#8A9088] focus:outline-none focus:border-[#506B58]"
            />
          </div>
        </div>

        {filteredSessions.length === 0 ? (
          <div className="p-12 text-center bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl space-y-3">
            <History className="w-8 h-8 text-[#8A9088] opacity-40 mx-auto" />
            <h3 className="font-editorial text-base font-medium text-[#222822]">
              No Past Sessions Recorded
            </h3>
            <p className="text-xs text-[#575D56]">
              Inquiries submitted through the Research Desk are automatically indexed and saved here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map(sess => (
              <div
                key={sess.id}
                className="p-5 bg-[#FFFEFA] border border-[#E5E2D9] rounded-xl hover:shadow-2xs transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[11px] text-[#8A9088] font-mono mb-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(sess.updatedAt).toLocaleString()}</span>
                    <span>·</span>
                    <span>{sess.messages.length} interaction(s)</span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#222822] truncate">
                    {sess.title}
                  </h3>
                  {sess.messages[0] && (
                    <p className="mt-1 text-xs text-[#575D56] line-clamp-1 font-serif">
                      "{sess.messages[0].content}"
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onResumeSession(sess.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#506B58] hover:bg-[#3F5445] rounded transition-colors"
                  >
                    <span>Resume</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleExport(sess)}
                    className="p-1.5 text-[#575D56] hover:text-[#222822] hover:bg-[#F6F4EE] rounded transition-colors"
                    title="Export Transcript (Markdown)"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(sess.id)}
                    className="p-1.5 text-[#8A9088] hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                    title="Delete Session"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
