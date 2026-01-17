import { motion } from 'motion/react';
import { Monitor, Server, Database, Cloud, Layers } from 'lucide-react';

export function ArchitectureFlowDiagram() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 p-4 overflow-auto">
      <div className="mb-4">
        <h2 className="text-white mb-1">Architecture Flow Diagram</h2>
        <p className="text-slate-300 text-sm">System components and their relationships</p>
      </div>

      <div className="relative">
        {/* Layered Architecture View */}
        <div className="space-y-3">
          {/* Client Layer */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.2 }}
            className="relative"
          >
            <div className="absolute -left-24 top-1/2 -translate-y-1/2 hidden xl:flex">
              <div className="flex items-center gap-2">
                <Monitor className="text-cyan-400" size={20} />
                <div>
                  <div className="text-cyan-400 uppercase tracking-wider text-xs">Layer 1</div>
                  <div className="text-slate-500 text-xs">Client</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-950/50 to-cyan-900/30 border border-cyan-800/50 rounded-lg p-3 shadow-xl backdrop-blur">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse"></div>
                <h3 className="text-white text-sm uppercase tracking-wide">Client Layer</h3>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.3 }}
                  className="bg-slate-800/80 border border-cyan-700/30 rounded p-2 hover:border-cyan-500/50 transition-all"
                >
                  <div className="text-cyan-400 text-xs mb-1">C1</div>
                  <div className="text-white text-xs">UI Shell</div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.32 }}
                  className="bg-slate-800/80 border border-blue-700/30 rounded p-2 hover:border-blue-500/50 transition-all"
                >
                  <div className="text-blue-400 text-xs mb-1">C2</div>
                  <div className="text-white text-xs">Map Module</div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.34 }}
                  className="bg-slate-800/80 border border-purple-700/30 rounded p-2 hover:border-purple-500/50 transition-all"
                >
                  <div className="text-purple-400 text-xs mb-1">C3</div>
                  <div className="text-white text-xs">Chat UI</div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.36 }}
                  className="bg-slate-800/80 border border-emerald-700/30 rounded p-2 hover:border-emerald-500/50 transition-all"
                >
                  <div className="text-emerald-400 text-xs mb-1">C4</div>
                  <div className="text-white text-xs">File Upload</div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.38 }}
                  className="bg-slate-800/80 border border-amber-700/30 rounded p-2 hover:border-amber-500/50 transition-all"
                >
                  <div className="text-amber-400 text-xs mb-1">C5</div>
                  <div className="text-white text-xs">Dashboard</div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.4 }}
                  className="bg-slate-800/80 border border-rose-700/30 rounded p-2 hover:border-rose-500/50 transition-all"
                >
                  <div className="text-rose-400 text-xs mb-1">C6</div>
                  <div className="text-white text-xs">Notifications</div>
                </motion.div>
              </div>

              {/* Cache modules */}
              <div className="mt-2 grid grid-cols-2 gap-2">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.42 }}
                  className="bg-slate-800/60 border border-slate-600/30 rounded p-2 text-xs"
                >
                  <div className="text-slate-400">C7: Text Cache</div>
                </motion.div>
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.44 }}
                  className="bg-slate-800/60 border border-slate-600/30 rounded p-2 text-xs"
                >
                  <div className="text-slate-400">C8: Color Cache</div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Connection Indicator */}
          <div className="flex justify-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-px h-4 bg-gradient-to-b from-cyan-500 to-emerald-500"></div>
              <Layers className="text-emerald-400" size={16} />
              <div className="w-px h-4 bg-gradient-to-b from-emerald-500 to-amber-500"></div>
            </motion.div>
          </div>

          {/* Backend Layer */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.6 }}
            className="relative"
          >
            <div className="absolute -left-24 top-1/2 -translate-y-1/2 hidden xl:flex">
              <div className="flex items-center gap-2">
                <Server className="text-emerald-400" size={20} />
                <div>
                  <div className="text-emerald-400 uppercase tracking-wider text-xs">Layer 2</div>
                  <div className="text-slate-500 text-xs">Backend</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-emerald-950/50 to-emerald-900/30 border border-emerald-800/50 rounded-lg p-3 shadow-xl backdrop-blur">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
                <h3 className="text-white text-sm uppercase tracking-wide">Backend Layer (Flask)</h3>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-7 gap-2">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.62 }}
                  className="bg-slate-800/80 border border-cyan-700/30 rounded p-2 hover:border-cyan-500/50 transition-all"
                >
                  <div className="text-cyan-400 text-xs mb-1">B1</div>
                  <div className="text-white text-xs">API Gateway</div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.64 }}
                  className="bg-slate-800/80 border border-blue-700/30 rounded p-2 hover:border-blue-500/50 transition-all"
                >
                  <div className="text-blue-400 text-xs mb-1">B2</div>
                  <div className="text-white text-xs">OCR Service</div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.66 }}
                  className="bg-slate-800/80 border border-purple-700/30 rounded p-2 hover:border-purple-500/50 transition-all"
                >
                  <div className="text-purple-400 text-xs mb-1">B3</div>
                  <div className="text-white text-xs">RAG/Docs</div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.68 }}
                  className="bg-slate-800/80 border border-emerald-700/30 rounded p-2 hover:border-emerald-500/50 transition-all"
                >
                  <div className="text-emerald-400 text-xs mb-1">B4</div>
                  <div className="text-white text-xs">Lab Analyzer</div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.7 }}
                  className="bg-slate-800/80 border border-amber-700/30 rounded p-2 hover:border-amber-500/50 transition-all"
                >
                  <div className="text-amber-400 text-xs mb-1">B5</div>
                  <div className="text-white text-xs">Search/Dir</div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.72 }}
                  className="bg-slate-800/80 border border-rose-700/30 rounded p-2 hover:border-rose-500/50 transition-all"
                >
                  <div className="text-rose-400 text-xs mb-1">B6</div>
                  <div className="text-white text-xs">Notifications</div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.74 }}
                  className="bg-slate-800/80 border border-pink-700/30 rounded p-2 hover:border-pink-500/50 transition-all"
                >
                  <div className="text-pink-400 text-xs mb-1">B7</div>
                  <div className="text-white text-xs">Static Assets</div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Connection Indicator */}
          <div className="flex justify-center">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              transition={{ delay: 0.76 }}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-px h-4 bg-gradient-to-b from-emerald-500 to-amber-500"></div>
              <Database className="text-amber-400" size={16} />
              <div className="w-px h-4 bg-gradient-to-b from-amber-500 to-orange-500"></div>
            </motion.div>
          </div>

          {/* Data Layer */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.78 }}
            className="relative"
          >
            <div className="absolute -left-24 top-1/2 -translate-y-1/2 hidden xl:flex">
              <div className="flex items-center gap-2">
                <Database className="text-amber-400" size={20} />
                <div>
                  <div className="text-amber-400 uppercase tracking-wider text-xs">Layer 3</div>
                  <div className="text-slate-500 text-xs">Data</div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-amber-950/50 to-amber-900/30 border border-amber-800/50 rounded-lg p-3 shadow-xl backdrop-blur">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></div>
                <h3 className="text-white text-sm uppercase tracking-wide">Data Stores</h3>
              </div>

              <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.8 }}
                  className="bg-slate-800/80 border border-cyan-700/30 rounded p-2 hover:border-cyan-500/50 transition-all"
                >
                  <div className="text-cyan-400 text-xs mb-1">D1</div>
                  <div className="text-white text-xs">SQLite DB</div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.82 }}
                  className="bg-slate-800/80 border border-blue-700/30 rounded p-2 hover:border-blue-500/50 transition-all"
                >
                  <div className="text-blue-400 text-xs mb-1">D2</div>
                  <div className="text-white text-xs">OCR Cache</div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.84 }}
                  className="bg-slate-800/80 border border-purple-700/30 rounded p-2 hover:border-purple-500/50 transition-all"
                >
                  <div className="text-purple-400 text-xs mb-1">D3</div>
                  <div className="text-white text-xs">Upload Docs</div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.86 }}
                  className="bg-slate-800/80 border border-emerald-700/30 rounded p-2 hover:border-emerald-500/50 transition-all"
                >
                  <div className="text-emerald-400 text-xs mb-1">D4</div>
                  <div className="text-white text-xs">Frontend Data</div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.88 }}
                  className="bg-slate-800/80 border border-amber-700/30 rounded p-2 hover:border-amber-500/50 transition-all"
                >
                  <div className="text-amber-400 text-xs mb-1">D5</div>
                  <div className="text-white text-xs">Color Palette</div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* External Services */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }} 
            animate={{ y: 0, opacity: 1 }} 
            transition={{ delay: 0.9 }}
            className="relative"
          >
            <div className="absolute -left-24 top-1/2 -translate-y-1/2 hidden xl:flex">
              <div className="flex items-center gap-2">
                <Cloud className="text-slate-500" size={20} />
                <div>
                  <div className="text-slate-500 uppercase tracking-wider text-xs">External</div>
                  <div className="text-slate-600 text-xs">3rd Party</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-700/50 rounded-lg p-3 shadow-xl backdrop-blur border-dashed">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 bg-slate-500 rounded-full"></div>
                <h3 className="text-slate-400 text-sm uppercase tracking-wide">External Services</h3>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.92 }}
                  className="bg-slate-800/60 border border-slate-600/30 rounded p-2"
                >
                  <div className="text-slate-500 text-xs mb-1">X1</div>
                  <div className="text-slate-300 text-xs">Font/Icons</div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.94 }}
                  className="bg-slate-800/60 border border-slate-600/30 rounded p-2 opacity-60"
                >
                  <div className="text-slate-500 text-xs mb-1">X2</div>
                  <div className="text-slate-400 text-xs">Push/Email</div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }} 
                  transition={{ delay: 0.96 }}
                  className="bg-slate-800/60 border border-slate-600/30 rounded p-2 opacity-60"
                >
                  <div className="text-slate-500 text-xs mb-1">X3</div>
                  <div className="text-slate-400 text-xs">EMR/SSO</div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-cyan-500 rounded"></div>
          <span className="text-slate-300 text-xs">Client</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-emerald-500 rounded"></div>
          <span className="text-slate-300 text-xs">Backend</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-amber-500 rounded"></div>
          <span className="text-slate-300 text-xs">Data</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-slate-600 rounded border border-dashed border-slate-500"></div>
          <span className="text-slate-400 text-xs">External</span>
        </div>
      </div>
    </div>
  );
}
