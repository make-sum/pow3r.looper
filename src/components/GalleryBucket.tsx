import React, { useState, useMemo } from 'react';
import { Play, Grid, List, Save, Search, Settings2, FolderDown, MoreVertical, Trash2, Music, Video, Image as ImageIcon, Mic, Database, Cpu, Wand2, Folder, Clock, Tag, FileType, CheckCircle2 } from 'lucide-react';
import { useGalleryStore, GalleryMediaItem } from '../services/galleryService';
import { toast } from 'sonner';

export default function GalleryBucket({ pageId, panel }: { pageId: string, panel: 'left' | 'right' }) {
  const [view, setView] = useState<'grid' | 'list'>('list');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  
  const { items, albums, deleteItem } = useGalleryStore();

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchSearch = i.title.toLowerCase().includes(search.toLowerCase()) || 
                          i.tags.some(t => t.toLowerCase().includes(search.toLowerCase())) ||
                          (i.metadata?.prompt && String(i.metadata.prompt).toLowerCase().includes(search.toLowerCase()));
      const matchType = filterType === 'all' || i.type === filterType;
      const matchAlbum = selectedAlbum === 'all' || i.albums.includes(selectedAlbum);
      
      // So we use pageId context filtering optionally or via an explicit dropdown. For now, we match if the record belongs to the pageId.
      // If we want a global view, we might pass an empty pageId.
      const matchContext = pageId ? (i.sourcePageId === pageId || i.sourcePageId?.toLowerCase().includes(pageId.toLowerCase())) : true;
      
      return matchSearch && matchType && matchAlbum && matchContext;
    });
  }, [items, search, filterType, selectedAlbum, pageId]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'audio': return <Music className="w-4 h-4 text-indigo-400" />;
      case 'image': return <ImageIcon className="w-4 h-4 text-emerald-400" />;
      case 'video': return <Video className="w-4 h-4 text-rose-400" />;
      case 'voice': return <Mic className="w-4 h-4 text-orange-400" />;
      case 'json': return <Database className="w-4 h-4 text-cyan-400" />;
      case 'agent': return <Cpu className="w-4 h-4 text-fuchsia-400" />;
      case 'sfx': return <Wand2 className="w-4 h-4 text-yellow-400" />;
      default: return <FileType className="w-4 h-4 text-zinc-400" />;
    }
  };

  const handlePlay = (item: GalleryMediaItem) => {
      // Logic to preview media 
      if (item.url && (item.type === 'audio' || item.type === 'voice' || item.type === 'sfx')) {
          const audio = new Audio(item.url);
          audio.play().catch(e => toast.error("Failed to play preview", { description: e.message }));
      } else {
          toast.info("Media preview unavailable");
      }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950 rounded-xl border border-zinc-800 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.5)]">
      <div className="p-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur flex flex-col gap-3">
         <div className="flex items-center justify-between">
            <h3 className="font-mono text-[10px] text-zinc-400 font-bold uppercase tracking-widest flex items-center gap-2">
              <FolderDown className="w-3 h-3 text-indigo-500" />
              GLOBAL GALLERY {pageId ? `// ${pageId.toUpperCase()}` : ''}
            </h3>
            <div className="flex items-center gap-2">
               <select 
                  className="bg-zinc-950 border border-zinc-800 rounded p-1 text-[10px] font-mono text-zinc-400 focus:outline-none focus:border-indigo-500"
                  value={selectedAlbum}
                  onChange={e => setSelectedAlbum(e.target.value)}
               >
                  <option value="all">ALL ALBUMS</option>
                  {albums.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
               </select>

               <select 
                  className="bg-zinc-950 border border-zinc-800 rounded p-1 text-[10px] font-mono text-zinc-400 focus:outline-none focus:border-indigo-500"
                  value={filterType}
                  onChange={e => setFilterType(e.target.value)}
               >
                  <option value="all">ALL TYPES</option>
                  <option value="audio">AUDIO/MUSIC</option>
                  <option value="voice">VOICE</option>
                  <option value="sfx">SFX</option>
                  <option value="image">IMAGES</option>
                  <option value="preset">PRESETS</option>
               </select>

               <div className="flex items-center gap-1 border-l border-zinc-800 pl-2 ml-1">
                 <button onClick={() => setView('grid')} className={`p-1 rounded transition-colors ${view === 'grid' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
                   <Grid className="w-3 h-3" />
                 </button>
                 <button onClick={() => setView('list')} className={`p-1 rounded transition-colors ${view === 'list' ? 'bg-zinc-800 text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}>
                   <List className="w-3 h-3" />
                 </button>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-2">
            <div className="flex-1 relative">
               <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
               <input 
                 value={search} 
                 onChange={e => setSearch(e.target.value)} 
                 placeholder="Search by name, tags, semantic properties, or XMAP metadata..." 
                 className="w-full bg-zinc-950 border border-zinc-800 rounded text-xs pl-7 pr-2 py-1.5 focus:outline-none focus:border-indigo-500/50 text-zinc-300 transition-colors placeholder:text-zinc-600 font-mono" 
                 list="gallery-suggestions"
               />
               <datalist id="gallery-suggestions">
                  <option value="tag:synthwave" />
                  <option value="type:voice" />
                  <option value="length:>30s" />
               </datalist>
            </div>
         </div>
      </div>

      <div className={`p-3 overflow-y-auto custom-scrollbar flex-1 ${view === 'grid' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' : 'flex flex-col gap-1'}`}>
         {filteredItems.length === 0 ? (
           <div className="flex flex-col col-span-full items-center justify-center p-12 text-zinc-500 gap-4 mt-8">
             <div className="p-4 rounded-full bg-zinc-900 border border-zinc-800/50">
                <Database className="w-8 h-8 opacity-50 text-indigo-500" />
             </div>
             <span className="text-xs font-mono">No specific media in Vault</span>
           </div>
         ) : filteredItems.map(item => (
           <div 
             key={item.id} 
             className={`group relative border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 hover:border-indigo-500/50 cursor-pointer overflow-hidden transition-all
               ${view === 'grid' ? 'rounded-lg aspect-square flex flex-col p-3 items-center justify-center text-center gap-2' : 'rounded-md p-2 flex items-center gap-4'}
             `}
             onDoubleClick={() => handlePlay(item)}
           >
             <div className="shrink-0 p-2 rounded bg-zinc-950/50 border border-zinc-800 group-hover:scale-110 transition-transform">
                {getTypeIcon(item.type)}
             </div>
             
             <div className={`flex flex-col overflow-hidden pointer-events-none ${view === 'grid' ? 'items-center w-full' : 'flex-1'}`}>
                <span className="text-zinc-200 text-xs font-bold truncate group-hover:text-indigo-300 transition-colors w-full">
                  {item.title}
                </span>
                
                <div className={`flex gap-3 text-[9px] font-mono text-zinc-500 uppercase mt-1 w-full ${view === 'grid' ? 'justify-center items-center flex-wrap' : 'items-center'}`}>
                  <span className="flex items-center gap-1"><Folder className="w-2 h-2" /> {item.format || item.type}</span>
                  {item.length && <span className="flex items-center gap-1"><Clock className="w-2 h-2" /> {item.length}</span>}
                  <span className="flex items-center gap-1"><Clock className="w-2 h-2" /> {new Date(item.date).toLocaleDateString()}</span>
                </div>
                
                {view === 'list' && (
                  <div className="flex gap-1 mt-1.5 overflow-hidden">
                     {item.tags?.slice(0,4).map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded-sm bg-zinc-800 text-zinc-400 text-[8px] font-mono">#{tag}</span>
                     ))}
                  </div>
                )}
             </div>

             <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10 bg-zinc-900/80 backdrop-blur rounded p-0.5 border border-zinc-700">
                <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }} className="p-1 rounded-sm hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors">
                  <Trash2 className="w-3 h-3" />
                </button>
             </div>

             <button 
                onClick={(e) => { e.stopPropagation(); handlePlay(item); }}
                className={`absolute ${view === 'grid' ? 'bottom-3 right-3' : 'top-1/2 -translate-y-1/2 right-3'} p-2 rounded-full bg-indigo-500/10 border border-indigo-500 text-indigo-400 opacity-0 group-hover:opacity-100 group-hover:bg-indigo-500 group-hover:text-white active:scale-95 transition-all z-10 shadow-lg`}
             >
                <Play className="w-3 h-3 fill-current" />
             </button>
           </div>
         ))}
      </div>
    </div>
  );
}
