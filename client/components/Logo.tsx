import React from "react";
import { Link } from "react-router-dom";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const Logo: React.FC<LogoProps> = ({ className = "", size = "md" }) => {
  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <Link to="/" className={`inline-block ${className}`}>
      <div className="flex flex-col">
        <h1 className={`${sizeClasses[size]} font-serif font-semibold text-primary hover:opacity-80 transition-opacity`}>
          PracticeRoom
        </h1>
        <p className="text-xs text-muted-foreground font-sans">
          Classical Music Studio
        </p>
      </div>
    </Link>
  );
};
