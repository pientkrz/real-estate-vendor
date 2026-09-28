import React from 'react';

const BrandLogo = ({
  alt = 'Global S Home',
  className = 'h-full w-full object-contain',
  base = import.meta.env.BASE_URL,
  ...props
}) => (
  <img
    src={`${base}assets/global-s-home-logo.svg`}
    alt={alt}
    className={className}
    width="1100"
    height="565"
    {...props}
  />
);

export default BrandLogo;
