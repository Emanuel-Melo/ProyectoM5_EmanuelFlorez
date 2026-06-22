import loadingVideo from "../../assets/loading/video loading.mp4";
import logo from "../../assets/images/Logo Buy.png";

interface LoadingScreenProps {
  label?: string;
}

export function LoadingScreen({ label = "Cargando" }: LoadingScreenProps) {
  return (
    <main className="loading-screen" aria-busy="true" aria-live="polite">
      <video
        className="loading-video"
        src={loadingVideo}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className="loading-overlay" />
      <div className="loading-content">
        <img className="loading-logo" src={logo} alt="Buy" />
        <p className="auth-loader" role="status">
          {label}
        </p>
      </div>
    </main>
  );
}
