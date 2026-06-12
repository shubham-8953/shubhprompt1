import React from "react";

interface OriginalYoutubeLogoProps {
  className?: string;
}

export const OriginalYoutubeLogo: React.FC<OriginalYoutubeLogoProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`${className} transition-transform`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.508 9.388.508 9.388.508s7.518 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837z"
        fill="#FF0000"
      />
      <path
        d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z"
        fill="#FFFFFF"
      />
    </svg>
  );
};
