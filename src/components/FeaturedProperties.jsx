import React from 'react';

const PropertyCard = ({ title, location, beds, baths, area, price, image, status }) => {
  return (
    <div className="group cursor-pointer">
      <div className="relative overflow-hidden aspect-[4/5] mb-6 rounded-sm">
        <img 
          alt={title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
          src={image}
        />
        <div className="absolute top-6 left-6">
          <span className="bg-surface/90 glass-effect px-4 py-1 text-[10px] font-label uppercase tracking-widest text-on-surface">
            {status}
          </span>
        </div>
      </div>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-headline font-bold mb-1">{title}</h3>
          <p className="text-on-surface-variant font-body text-sm mb-4">{location}</p>
          <div className="flex items-center gap-6 text-outline text-xs uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">bed</span> {beds} Beds
            </span>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">shower</span> {baths} Baths
            </span>
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">straighten</span> {area}
            </span>
          </div>
        </div>
        <p className="text-primary font-headline font-bold text-xl">{price}</p>
      </div>
    </div>
  );
};

const FeaturedProperties = () => {
  const properties = [
    {
      title: "Villa Aman-I-Khas",
      location: "Marbella, Spain",
      beds: 6,
      baths: 8,
      area: "1,200m²",
      price: "€12.5M",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAl5pCSyDBP4BcJWnmpGxkSuAPhCUfRC_CbPn1D_75WYv0NQWjg4FBoT1v4svqrAV3EFxRkE7aR5elZsxF1g7SSF9eq2scDTK1iVRbQM1HHOGXuCLJkEhuyGSkISqVPSI24pzu2Iykow2nsjmpEPHUhCDbc6bZRN3GdPLIfLjRrabTK89GWEh41WyOdqMozo39zxkh-FJceoGS5IG9stuRy-PEbFl6smQDgPpxBGysqZycwK0h2E1w4JF1R-p0T_vc1LBi84KMqBtIS",
      status: "Available"
    },
    {
      title: "The Cerulean Point",
      location: "Mykonos, Greece",
      beds: 8,
      baths: 9,
      area: "1,850m²",
      price: "€18.2M",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCqZBAtGsLR054PfUHL9TpUyphvbMZSaex6rVILEkhdzNlM5RqB6CFofjE6_ia2LB4wtQlKAozptM7XlQHQabcXxsVzvG2Eb1axIGFUy3ijSMYh4gjndqA2psQKmj1F6VzswjDSC0mdeLW7cAKT5ulyHrq-Yeji-jdS3MenhE7GrF1N4amaUL7I5XG_iNHKpS5JldulIevMhJmlUcmyyNJlY6YZiXv7XZ_HPSxNWA4AYmcHnTLDDlnbdphXkft8bHq8CKqDLF2ddvzk",
      status: "Reserved"
    },
    {
      title: "Echoes of Como",
      location: "Lake Como, Italy",
      beds: 5,
      baths: 6,
      area: "940m²",
      price: "€8.9M",
      image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDgSYIl09VKfZDI1GX65g5DW5wi_DGGb7e2JxKWhcbQyVBMFUSXidmu4aKWiPDi0-5M6H4AHV1QE5JDKoLxhYI7EfDxtm2Tp5Hsimplm3xrXUnxRjBY1ZifHBuuJTxOWUQ29iKbig4CR9n8hzDiCSmkjxq_GJNWuQzjofX6eMuqvOBXywU2NeUVmWROYtzrYaKDzTVpWML-8oDORFD00b_i2ki9BAtdtDNPQs-p_-wbRZlK9CM7BcxpoXPDCqjLAvK_j38DZjv9DT_y",
      status: "New Listing"
    }
  ];

  return (
    <section className="px-12 py-32 max-w-screen-2xl mx-auto">
      <div className="flex justify-between items-end mb-16">
        <div>
          <span className="text-primary font-label text-sm tracking-[0.2em] uppercase mb-4 block">Curated Listings</span>
          <h2 className="text-5xl font-headline font-bold tracking-tight">The Architectural Collection</h2>
        </div>
        <button className="text-primary font-semibold border-b border-primary pb-1 hover:opacity-70 transition-opacity">
          View Full Portfolio
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {properties.map((prop, index) => (
          <PropertyCard key={index} {...prop} />
        ))}
      </div>
    </section>
  );
};

export default FeaturedProperties;
