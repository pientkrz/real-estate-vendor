import React, { useRef } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const AgentGrid = ({ agents = [] }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (!scrollRef.current) return;
    const { scrollLeft, clientWidth } = scrollRef.current;
    scrollRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - clientWidth / 2 : scrollLeft + clientWidth / 2,
      behavior: 'smooth',
    });
  };

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
          <div className="flex flex-col md:items-end gap-6">
            <p className="max-w-md text-on-surface-variant font-body text-lg leading-relaxed">
              Nasz zespół doświadczonych profesjonalistów przeprowadzi Cię przez każdy etap transakcji na rynku luksusowych nieruchomości.
            </p>
            <div className="hidden md:flex gap-4">
              <button
                onClick={() => scroll('left')}
                className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-bone transition-all duration-300"
                aria-label="Poprzedni"
              >
                <FiChevronLeft size={20} />
              </button>
              <button
                onClick={() => scroll('right')}
                className="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-bone transition-all duration-300"
                aria-label="Następny"
              >
                <FiChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-8 overflow-x-auto pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {agents.map((agent, index) => (
            <div
              key={agent.id || `${agent.name}-${index}`}
              className="w-[calc(25%-18px)] shrink-0 snap-start bg-surface rounded-sm overflow-hidden group hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-primary/10"
              style={{ minWidth: '260px' }}
            >
              <div className="aspect-[4/5] overflow-hidden relative bg-primary/10">
                <img
                  src={agent.image || '/assets/agent-placeholder.svg'}
                  srcSet={agent.imageVariants?.length
                    ? agent.imageVariants
                      .filter((variant) => variant?.url && Number(variant.width) > 0)
                      .sort((left, right) => Number(left.width) - Number(right.width))
                      .map((variant) => `${variant.url} ${variant.width}w`)
                      .join(', ')
                    : undefined}
                  sizes="(min-width: 1024px) 260px, 80vw"
                  alt={agent.image ? agent.name : `Domyślne zdjęcie agenta: ${agent.name}`}
                  loading="lazy"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                />
              </div>

              <div className="p-8">
                <h3 className="text-xl font-headline font-bold mb-1 text-on-surface group-hover:text-primary transition-colors">
                  {agent.name}
                </h3>
                <p className="text-sm text-outline font-label uppercase tracking-wider mb-6">
                  {agent.role || 'Doradca nieruchomości'}
                </p>

                <div className="space-y-3">
                  {agent.phone ? (
                    <a
                      href={`tel:${agent.phone}`}
                      className="flex items-center gap-3 text-sm text-on-surface-variant hover:text-primary transition-colors group/link"
                    >
                      <span className="material-symbols-outlined text-sm">phone</span>
                      <span className="font-body">{agent.phone}</span>
                    </a>
                  ) : null}
                  {agent.email ? (
                    <a
                      href={`mailto:${agent.email}`}
                      className="flex items-center gap-3 text-sm text-on-surface-variant hover:text-primary transition-colors group/link"
                    >
                      <span className="material-symbols-outlined text-sm">mail</span>
                      <span className="font-body">{agent.email}</span>
                    </a>
                  ) : null}
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
