import React from 'react';

/**
 * Clean, consistent cricket line-art SVG set.
 * Constraints:
 * - 200x200 viewBox
 * - Stroke width ~1.6 - 1.8px
 * - Rounded caps & joins (strokeLinecap="round" strokeLinejoin="round")
 * - No warm/orange fills; currentColor for styling via CSS
 */

export const CricketBall = ({ className = '', size = 200, ...props }) => (
  <svg
    viewBox="0 0 200 200"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Outer sphere contour */}
    <circle cx="100" cy="100" r="76" />
    
    {/* Primary stitched seam curves */}
    <path d="M 46 46 C 72 78, 122 122, 154 154" />
    <path d="M 52 40 C 78 72, 128 116, 160 148" />

    {/* Seam stitches */}
    <path d="M 47 45 L 53 39" />
    <path d="M 59 57 L 65 51" />
    <path d="M 71 70 L 77 64" />
    <path d="M 84 83 L 90 77" />
    <path d="M 97 97 L 103 91" />
    <path d="M 110 110 L 116 104" />
    <path d="M 123 123 L 129 117" />
    <path d="M 136 136 L 142 130" />
    <path d="M 149 149 L 155 143" />

    {/* Faint leather hemisphere specular arc */}
    <path
      d="M 38 126 A 76 76 0 0 0 126 162"
      strokeDasharray="4 8"
      opacity="0.5"
    />
  </svg>
);

export const CricketBat = ({ className = '', size = 200, ...props }) => (
  <svg
    viewBox="0 0 200 200"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Handle with rounded grip top */}
    <path d="M 148 24 C 151 27, 153 31, 150 34 L 119 75 C 117 78, 113 77, 110 74 L 104 69 C 101 66, 102 62, 105 60 L 138 22 C 141 19, 145 20, 148 24 Z" />

    {/* Handle rubber grip ridges */}
    <path d="M 139 28 L 145 33" />
    <path d="M 133 36 L 139 41" />
    <path d="M 127 44 L 133 49" />
    <path d="M 121 52 L 127 57" />
    <path d="M 115 60 L 121 65" />
    <path d="M 109 68 L 115 73" />

    {/* Bat shoulders and blade */}
    <path d="M 104 69 C 96 73, 90 82, 88 92 L 48 162 C 45 168, 48 176, 55 178 C 62 180, 71 176, 75 170 L 120 95 C 124 88, 124 79, 119 75" />

    {/* Blade central spine ridge */}
    <path d="M 102 85 L 63 165" opacity="0.6" strokeDasharray="3 4" />

    {/* Bat toe curve */}
    <path d="M 48 162 C 50 172, 65 175, 75 170" />
  </svg>
);

export const CricketStumps = ({ className = '', size = 200, ...props }) => (
  <svg
    viewBox="0 0 200 200"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Ground crease line */}
    <path d="M 32 170 L 168 170" />

    {/* Left stump (off) */}
    <path d="M 64 54 L 64 170" />
    <path d="M 60 54 L 68 54" />

    {/* Middle stump */}
    <path d="M 100 54 L 100 170" />
    <path d="M 96 54 L 104 54" />

    {/* Right stump (leg) */}
    <path d="M 136 54 L 136 170" />
    <path d="M 132 54 L 140 54" />

    {/* Left bail */}
    <path d="M 58 48 C 61 46, 67 46, 70 48 L 94 48 C 97 46, 102 46, 105 48" />

    {/* Right bail */}
    <path d="M 95 48 C 98 46, 103 46, 106 48 L 130 48 C 133 46, 139 46, 142 48" />

    {/* Ground anchor spikes */}
    <path d="M 64 170 L 64 180" opacity="0.4" />
    <path d="M 100 170 L 100 180" opacity="0.4" />
    <path d="M 136 170 L 136 180" opacity="0.4" />
  </svg>
);

export const CricketHelmet = ({ className = '', size = 200, ...props }) => (
  <svg
    viewBox="0 0 200 200"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Helmet outer shell dome */}
    <path d="M 48 132 C 40 100, 52 50, 98 44 C 136 40, 160 68, 162 96" />

    {/* Visor / Peak */}
    <path d="M 148 88 L 176 96 L 158 106" />

    {/* Ear protection flap */}
    <path d="M 48 132 C 55 142, 70 146, 80 144 C 92 142, 98 130, 96 116 C 94 104, 82 98, 70 102 C 56 106, 50 118, 48 132 Z" />
    <circle cx="74" cy="122" r="5" opacity="0.5" />

    {/* Face grille horizontal bars */}
    <path d="M 96 116 C 120 114, 150 112, 164 116" />
    <path d="M 94 128 C 120 126, 146 126, 158 134" />
    <path d="M 90 140 C 114 142, 136 148, 146 156" />

    {/* Face grille vertical connecting ribs */}
    <path d="M 124 108 L 120 142" />
    <path d="M 144 112 L 138 152" />

    {/* Chinstrap anchor loop */}
    <path d="M 80 144 C 84 158, 96 166, 114 168" strokeDasharray="3 4" opacity="0.6" />
  </svg>
);

export const CricketPitch = ({ className = '', size = 200, ...props }) => (
  <svg
    viewBox="0 0 200 200"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...props}
  >
    {/* Rectangular pitch strip boundary */}
    <rect x="52" y="26" width="96" height="148" rx="8" />

    {/* Top creases: bowling & popping */}
    <path d="M 60 48 L 140 48" />
    <path d="M 42 62 L 158 62" />
    <path d="M 72 48 L 72 62" />
    <path d="M 128 48 L 128 62" />
    {/* Top wickets */}
    <circle cx="92" cy="48" r="2" fill="currentColor" />
    <circle cx="100" cy="48" r="2" fill="currentColor" />
    <circle cx="108" cy="48" r="2" fill="currentColor" />

    {/* Bottom creases: popping & bowling */}
    <path d="M 42 138 L 158 138" />
    <path d="M 60 152 L 140 152" />
    <path d="M 72 138 L 72 152" />
    <path d="M 128 138 L 128 152" />
    {/* Bottom wickets */}
    <circle cx="92" cy="152" r="2" fill="currentColor" />
    <circle cx="100" cy="152" r="2" fill="currentColor" />
    <circle cx="108" cy="152" r="2" fill="currentColor" />

    {/* Center dashed run corridor */}
    <path d="M 100 74 L 100 126" strokeDasharray="4 6" opacity="0.6" />
    {/* Mown grass diagonal lines */}
    <path d="M 60 92 L 78 74" opacity="0.3" />
    <path d="M 60 114 L 88 86" opacity="0.3" />
    <path d="M 112 114 L 140 86" opacity="0.3" />
    <path d="M 122 126 L 140 108" opacity="0.3" />
  </svg>
);

export const CricketExtras = ({ variant = 'cross', className = '', size = 32, ...props }) => {
  if (variant === 'stitches') {
    return (
      <svg
        viewBox="0 0 60 30"
        width={size * 2}
        height={size}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path d="M 10 24 L 20 6" />
        <path d="M 24 24 L 34 6" />
        <path d="M 38 24 L 48 6" />
      </svg>
    );
  }

  if (variant === 'dots') {
    return (
      <svg
        viewBox="0 0 40 40"
        width={size}
        height={size}
        fill="currentColor"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <circle cx="12" cy="14" r="2" />
        <circle cx="28" cy="14" r="2" />
        <circle cx="20" cy="26" r="2" />
      </svg>
    );
  }

  // Default: crosshair / target mark
  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <path d="M 20 8 L 20 32" />
      <path d="M 8 20 L 32 20" />
      <circle cx="20" cy="20" r="1.5" fill="currentColor" />
    </svg>
  );
};

export default {
  CricketBall,
  CricketBat,
  CricketStumps,
  CricketHelmet,
  CricketPitch,
  CricketExtras,
};

