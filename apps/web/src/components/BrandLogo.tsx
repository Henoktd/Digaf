"use client";

import Image from "next/image";
import { useState } from "react";

const BRAND_NAME = "Digaf Shareholder Governance Platform";
const LOGO_SRC = "/logos/digaf-logo.svg";

type BrandLogoProps = {
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

export function BrandLogo({
  className,
  imageClassName,
  fallbackClassName = "block break-words font-bold leading-tight",
}: BrandLogoProps) {
  const [showLogo, setShowLogo] = useState(true);

  return (
    <div className={className}>
      {showLogo ? (
        <Image
          src={LOGO_SRC}
          alt={BRAND_NAME}
          width={320}
          height={96}
          className={imageClassName}
          onError={() => setShowLogo(false)}
        />
      ) : (
        <span className={fallbackClassName}>{BRAND_NAME}</span>
      )}
    </div>
  );
}
