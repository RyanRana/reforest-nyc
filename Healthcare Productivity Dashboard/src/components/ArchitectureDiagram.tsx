import React, { useState } from 'react';
import { Globe, Server, Database, Cpu, Users, FileText, Bell, Map as MapIcon, MessageSquare, Upload } from 'lucide-react';

interface ArchNode {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  tech: string[];
  endpoints?: string[];
}

export function ArchitectureDiagram() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const frontend: ArchNode[] = [
    {
      id: 'map',
      label: 'Map Module',
      description: 'Interactive H3 visualization',
      icon: <MapIcon className="w-4 h-4" />,
      color: 'bg-emerald-600',
      tech: ['Mapbox GL JS', 'React', 'H3 Hexagons', 'WebGL'],
    },
    {
      id: 'chat',
      label: 'Chat UI',
      description: 'Community discussions',
      icon: <MessageSquare className="w-4 h-4" />,
      color: 'bg-blue-600',
      tech: ['React', 'WebSocket', 'Real-time updates'],
    },
    {
      id: 'upload',
      label: 'File Upload',
      description: 'Initiative photos & docs',
      icon: <Upload className="w-4 h-4" />,
      color: 'bg-purple-600',
      tech: ['React Dropzone', 'Supabase Storage', 'Image optimization'],
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      description: 'Community metrics',
      icon: <Users className="w-4 h-4" />,
      color: 'bg-cyan-600',
      tech: ['Recharts', 'React', 'Real-time stats'],
    },
  ];

  const backend: ArchNode[] = [
    {
      id: 'api-gateway',
      label: 'API Gateway',
      description: 'Node.js + Express',
      icon: <Server className="w-4 h-4" />,
      color: 'bg-indigo-600',
      tech: ['Express.js', 'TypeScript', 'CORS', 'Rate limiting'],
      endpoints: [
        'GET /api/h3/:cellId',
        'POST /api/predict',
        'GET /api/organizations/:zip',
        'POST /api/events',
        'GET /api/reviews/:zip'
      ]
    },
    {
      id: 'ml-server',
      label: 'Python ML Server',
      description: 'Port 3002',
      icon: <Cpu className="w-4 h-4" />,
      color: 'bg-pink-600',
      tech: ['Flask/FastAPI', 'scikit-learn', 'NumPy', 'Pandas'],
      endpoints: [
        'POST /predict/temperature',
        'POST /predict/growth',
        'POST /predict/survival'
      ]
    },
    {
      id: 'gpu-processor',
      label: 'GPU Review Processor',
      description: 'NVIDIA acceleration',
      icon: <Cpu className="w-4 h-4" />,
      color: 'bg-orange-600',
      tech: ['CUDA', 'NLP Models', 'Sentiment Analysis', 'Bias Detection'],
    },
  ];

  const dataStores: ArchNode[] = [
    {
      id: 'supabase',
      label: 'Supabase (PostgreSQL)',
      description: 'Main database',
      icon: <Database className="w-4 h-4" />,
      color: 'bg-green-600',
      tech: [
        'Tables: 8 (users, reviews, events, orgs)',
        'Row Level Security (RLS)',
        'Real-time subscriptions',
        'PostGIS for spatial queries'
      ],
    },
    {
      id: 'cache',
      label: 'H3 Features Cache',
      description: 'In-memory JSON',
      icon: <FileText className="w-4 h-4" />,
      color: 'bg-yellow-600',
      tech: ['8,000 H3 cells', 'Parquet files', 'Redis (optional)', 'TTL: 2 min'],
    },
    {
      id: 'storage',
      label: 'File Storage',
      description: 'Supabase buckets',
      icon: <Upload className="w-4 h-4" />,
      color: 'bg-teal-600',
      tech: [
        'organization-logos',
        'event-images',
        'initiative-images',
        'CDN delivery'
      ],
    },
  ];

  const renderCard = (node: ArchNode) => {
    const isSelected = selectedNode === node.id;
    
    return (
      <div
        key={node.id}
        className={`cursor-pointer transition-all duration-300 ${
          isSelected ? 'scale-105' : 'hover:scale-102'
        }`}
        onClick={() => setSelectedNode(isSelected ? null : node.id)}
      >
        <div className={`${node.color} backdrop-blur-lg rounded-lg p-3 shadow-lg border-2 ${
          isSelected ? 'border-[#22c55e] shadow-[#22c55e]/30' : 'border-transparent'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {node.icon}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-xs text-white truncate">{node.label}</h3>
              <p className="text-xs text-gray-200 opacity-90 truncate">{node.description}</p>
            </div>
          </div>
          
          {isSelected && (
            <div className="mt-2 pt-2 border-t border-white/20">
              <div className="space-y-1">
                {node.tech.map((tech, i) => (
                  <div key={i} className="text-xs text-gray-100 flex items-start gap-1">
                    <span className="text-[#22c55e] mt-0.5">•</span>
                    <span className="flex-1">{tech}</span>
                  </div>
                ))}
              </div>
              {node.endpoints && node.endpoints.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/20">
                  <div className="text-xs font-semibold text-[#22c55e] mb-1">Endpoints:</div>
                  {node.endpoints.map((endpoint, i) => (
                    <div key={i} className="text-xs text-gray-100 font-mono">{endpoint}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="glass-card p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold gradient-text mb-2">Three-Tier Architecture</h2>
        <p className="text-[#a7c4a0] italic">Click components for technical details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Frontend */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#22c55e] font-semibold mb-3">
            <Globe className="w-5 h-5" />
            <span>Frontend Layer</span>
          </div>
          <div className="space-y-3">
            {frontend.map(renderCard)}
          </div>
          <div className="bg-[#14532d]/30 p-3 rounded border border-[#2d4a3d] text-xs text-[#a7c4a0]">
            <div className="font-semibold text-[#22c55e] mb-1">Tech Stack</div>
            React + TypeScript<br/>
            Tailwind CSS<br/>
            Mapbox GL JS<br/>
            Recharts
          </div>
        </div>

        {/* Backend Services */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#22c55e] font-semibold mb-3">
            <Server className="w-5 h-5" />
            <span>Backend Services</span>
          </div>
          <div className="space-y-3">
            {backend.map(renderCard)}
          </div>
          <div className="bg-[#14532d]/30 p-3 rounded border border-[#2d4a3d] text-xs text-[#a7c4a0]">
            <div className="font-semibold text-[#22c55e] mb-1">Performance</div>
            API: &lt;50ms response<br/>
            ML: &lt;1ms inference<br/>
            Cache: 2-min TTL<br/>
            WebSocket: Real-time
          </div>
        </div>

        {/* Data Layer */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[#22c55e] font-semibold mb-3">
            <Database className="w-5 h-5" />
            <span>Data Layer</span>
          </div>
          <div className="space-y-3">
            {dataStores.map(renderCard)}
          </div>
          <div className="bg-[#14532d]/30 p-3 rounded border border-[#2d4a3d] text-xs text-[#a7c4a0]">
            <div className="font-semibold text-[#22c55e] mb-1">Storage</div>
            PostgreSQL + PostGIS<br/>
            8,000 H3 cells cached<br/>
            3 storage buckets<br/>
            RLS enabled
          </div>
        </div>
      </div>

      {/* Data Flow Arrows */}
      <div className="mt-8 pt-6 border-t border-[#2d4a3d]">
        <h4 className="text-sm font-semibold text-[#a7c4a0] mb-3">Request Flow</h4>
        <div className="flex items-center gap-2 text-sm text-gray-300 overflow-x-auto pb-2">
          <div className="bg-gradient-to-r from-[#15803d] to-[#16a34a] px-3 py-1 rounded whitespace-nowrap text-white">User Request</div>
          <div className="text-[#22c55e]">→</div>
          <div className="bg-gradient-to-r from-[#15803d] to-[#16a34a] px-3 py-1 rounded whitespace-nowrap text-white">API Gateway</div>
          <div className="text-[#22c55e]">→</div>
          <div className="bg-gradient-to-r from-[#15803d] to-[#16a34a] px-3 py-1 rounded whitespace-nowrap text-white">ML Server</div>
          <div className="text-[#22c55e]">→</div>
          <div className="bg-gradient-to-r from-[#15803d] to-[#16a34a] px-3 py-1 rounded whitespace-nowrap text-white">Database</div>
          <div className="text-[#22c55e]">→</div>
          <div className="bg-gradient-to-r from-[#15803d] to-[#16a34a] px-3 py-1 rounded whitespace-nowrap text-white">Response</div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
        <div className="bg-[#14532d]/30 p-3 rounded border border-[#2d4a3d]">
          <div className="text-[#22c55e] font-semibold">4 Frontend Modules</div>
          <div className="text-[#a7c4a0] text-xs">Map, Chat, Upload, Dashboard</div>
        </div>
        <div className="bg-[#14532d]/30 p-3 rounded border border-[#2d4a3d]">
          <div className="text-[#22c55e] font-semibold">3 Backend Services</div>
          <div className="text-[#a7c4a0] text-xs">Node.js, Python ML, GPU NLP</div>
        </div>
        <div className="bg-[#14532d]/30 p-3 rounded border border-[#2d4a3d]">
          <div className="text-[#22c55e] font-semibold">3 Data Stores</div>
          <div className="text-[#a7c4a0] text-xs">PostgreSQL, Cache, Storage</div>
        </div>
        <div className="bg-[#14532d]/30 p-3 rounded border border-[#2d4a3d]">
          <div className="text-[#22c55e] font-semibold">&lt;50ms Latency</div>
          <div className="text-[#a7c4a0] text-xs">End-to-end response time</div>
        </div>
      </div>
    </div>
  );
}