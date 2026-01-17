import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { DataFlowDiagram } from './components/DataFlowDiagram';
import { ArchitectureDiagram } from './components/ArchitectureDiagram';
import { APIIntegrationDiagram } from './components/APIIntegrationDiagram';
import { DatasetInventory } from './components/DatasetInventory';
import { AIModelWorkflows } from './components/AIModelWorkflows';

export default function App() {
  const [activeTab, setActiveTab] = useState('ai-workflows');

  return (
    <div className="min-h-screen" style={{background: '#ffffff'}}>
      {/* Header */}
      <div className="border-b" style={{borderColor: 'rgba(0,0,0,0.08)', background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)'}}>
        <div className="container mx-auto px-6 py-8">
          <img src="/logo.png" alt="ReforestNYC" style={{height: '50px', width: 'auto', marginBottom: '1rem', display: 'block'}} />
          <h1 className="text-4xl font-bold mb-3" style={{color: '#1a1a1a', fontFamily: 'Times New Roman, Times, serif', fontWeight: 'normal', letterSpacing: '0.02em', fontSize: 'clamp(2rem, 3vw, 2.5rem)'}}>
            NYC Climate Resilience Platform
          </h1>
          <p className="text-lg" style={{color: '#718096', fontFamily: 'Times New Roman, Times, serif', fontStyle: 'normal', fontSize: '1rem'}}>
            Advanced ML Architecture & Data Pipeline Documentation
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="container mx-auto px-6 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5 p-1" style={{background: 'transparent', border: 'none', boxShadow: 'none', display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap'}}>
            <TabsTrigger 
              value="ai-workflows"
              style={{background: 'transparent', border: 'none', color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.95rem', padding: '0.75rem 1.5rem', fontFamily: 'Times New Roman, Times, serif', fontWeight: 'normal'}}
            >
              AI Workflows
            </TabsTrigger>
            <TabsTrigger 
              value="data-flow"
              style={{background: 'transparent', border: 'none', color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.95rem', padding: '0.75rem 1.5rem', fontFamily: 'Times New Roman, Times, serif', fontWeight: 'normal'}}
            >
              Data Flow
            </TabsTrigger>
            <TabsTrigger 
              value="architecture"
              style={{background: 'transparent', border: 'none', color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.95rem', padding: '0.75rem 1.5rem', fontFamily: 'Times New Roman, Times, serif', fontWeight: 'normal'}}
            >
              Architecture
            </TabsTrigger>
            <TabsTrigger 
              value="api-integration"
              style={{background: 'transparent', border: 'none', color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.95rem', padding: '0.75rem 1.5rem', fontFamily: 'Times New Roman, Times, serif', fontWeight: 'normal'}}
            >
              API Integration
            </TabsTrigger>
            <TabsTrigger 
              value="datasets"
              style={{background: 'transparent', border: 'none', color: '#1a1a1a', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.95rem', padding: '0.75rem 1.5rem', fontFamily: 'Times New Roman, Times, serif', fontWeight: 'normal'}}
            >
              Datasets
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ai-workflows" className="mt-6 animate-fade-in">
            <AIModelWorkflows />
          </TabsContent>

          <TabsContent value="data-flow" className="mt-6 animate-fade-in">
            <DataFlowDiagram />
          </TabsContent>

          <TabsContent value="architecture" className="mt-6 animate-fade-in">
            <ArchitectureDiagram />
          </TabsContent>

          <TabsContent value="api-integration" className="mt-6 animate-fade-in">
            <APIIntegrationDiagram />
          </TabsContent>

          <TabsContent value="datasets" className="mt-6 animate-fade-in">
            <DatasetInventory />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
