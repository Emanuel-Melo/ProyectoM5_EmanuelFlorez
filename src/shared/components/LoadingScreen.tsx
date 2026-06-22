import loadingVideo from "../../assets/loading/video loading.mp4";

export function LoadingScreen() {
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
      <div className="loading-message" role="status">
        Cargando...
      </div>
    </main>
  );
}
