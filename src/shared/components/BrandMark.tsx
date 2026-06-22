import logo from "../../assets/images/Logo Buy.png";
import wordmark from "../../assets/images/Escritura Buy.png";

interface BrandMarkProps {
  compact?: boolean;
}

export function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className={compact ? "brand-mark brand-mark-compact" : "brand-mark"}>
      <img className="brand-logo" src={logo} alt="Buy" />
      {!compact && <img className="brand-wordmark" src={wordmark} alt="" />}
    </div>
  );
}
