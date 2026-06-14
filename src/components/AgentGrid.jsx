import React from 'react';

const AgentGrid = ({ agents = [] }) => {
  return (
    <section className="py-24 bg-surface-container-low" id="agents">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <span className="text-primary font-label text-sm tracking-[0.3em] uppercase mb-4 block">Nasi eksperci</span>
            <h2 className="text-5xl md:text-6xl font-headline font-bold text-on-surface tracking-tight">
              Skontaktuj się z naszymi specjalistami
            </h2>
          </div>
          <p className="max-w-md text-on-surface-variant font-body text-lg leading-relaxed">
            Nasz zespół doświadczonych profesjonalistów przeprowadzi Cię przez każdy etap transakcji na rynku luksusowych nieruchomości.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {agents.map((agent, idx) => (
            <div 
              key={idx} 
              className="bg-surface rounded-sm overflow-hidden group hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-primary/10"
            >
              <div className="aspect-[4/5] overflow-hidden relative">
                <img 
                  src={agent.image} 
                  alt={agent.name} 
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  {agent.languages.map(lang => (
                    <span 
                      key={lang} 
                      className="bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-xs border border-white/20"
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
              
              <div className="p-8">
                <h3 className="text-xl font-headline font-bold mb-1 text-on-surface group-hover:text-primary transition-colors">
                  {agent.name}
                </h3>
                <p className="text-sm text-outline font-label uppercase tracking-wider mb-6">
                  {agent.role}
                </p>
                
                <div className="space-y-3">
                  <a 
                    href={`tel:${agent.phone}`}
                    className="flex items-center gap-3 text-sm text-on-surface-variant hover:text-primary transition-colors group/link"
                  >
                    <span className="material-symbols-outlined text-sm">phone</span>
                    <span className="font-body">{agent.phone}</span>
                  </a>
                  <a 
                    href={`mailto:${agent.email}`}
                    className="flex items-center gap-3 text-sm text-on-surface-variant hover:text-primary transition-colors group/link"
                  >
                    <span className="material-symbols-outlined text-sm">mail</span>
                    <span className="font-body">{agent.email}</span>
                  </a>
                </div>

                <div className="mt-8 pt-6 border-t border-outline/10">
                  <button className="w-full py-3 text-[11px] font-label uppercase tracking-[0.2em] text-primary border border-primary/20 hover:bg-primary hover:text-on-primary transition-all duration-300">
                    Umów spotkanie
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AgentGrid;
