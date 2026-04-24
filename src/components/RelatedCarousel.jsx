import React, { useRef } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const RelatedCarousel = ({ posts, currentPostId }) => {
  const scrollRef = useRef(null);

  // Filter out the current post and sort by date (though posts passed should already be sorted)
  const filteredPosts = posts
    .filter(post => post.id !== currentPostId)
    .slice(0, 6);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === 'left' 
        ? scrollLeft - clientWidth / 2 
        : scrollLeft + clientWidth / 2;
      
      scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
    }
  };

  if (filteredPosts.length === 0) return null;

  return (
    <section class="py-24 bg-bone border-t border-primary/10">
      <div class="max-w-7xl mx-auto px-6 md:px-12">
        <div class="flex justify-between items-end mb-12">
          <div>
            <span class="text-primary font-label text-xs tracking-[0.4em] uppercase mb-4 block">Archive</span>
            <h2 class="text-3xl md:text-5xl font-headline font-bold tracking-tight">Further <span class="italic font-light">Reading</span></h2>
          </div>
          
          <div class="flex gap-4">
            <button 
              onClick={() => scroll('left')}
              class="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-bone transition-all duration-300"
              aria-label="Previous posts"
            >
              <FiChevronLeft size={20} />
            </button>
            <button 
              onClick={() => scroll('right')}
              class="w-12 h-12 rounded-full border border-primary/20 flex items-center justify-center text-primary hover:bg-primary hover:text-bone transition-all duration-300"
              aria-label="Next posts"
            >
              <FiChevronRight size={20} />
            </button>
          </div>
        </div>

        <div 
          ref={scrollRef}
          class="flex gap-8 overflow-x-auto scrollbar-hide pb-8 snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {filteredPosts.map((post, index) => (
            <a 
              key={post.id}
              href={`${import.meta.env.BASE_URL}blog/${post.id}`}
              class={`min-w-[300px] md:min-w-[400px] group snap-start block ${index % 2 === 1 ? 'mt-12' : ''}`}
            >
              <div class="relative aspect-square overflow-hidden mb-6 bg-obsidian/5">
                <img 
                  src={post.data.thumbnail || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800"} 
                  alt={post.data.title}
                  class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 filter grayscale hover:grayscale-0"
                />
                <div class="absolute top-6 right-6 bg-bone/90 backdrop-blur-sm px-4 py-2">
                  <span class="text-[10px] font-label tracking-widest text-obsidian uppercase">
                    {new Date(post.data.pubDate).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: '2-digit' })}
                  </span>
                </div>
              </div>
              
              <span class="text-primary font-label text-[10px] tracking-widest uppercase mb-3 block">
                {post.data.category || "INVESTMENT"}
              </span>
              <h3 class="text-xl md:text-2xl font-serif leading-tight group-hover:text-primary transition-colors duration-300">
                {post.data.title}
              </h3>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RelatedCarousel;
