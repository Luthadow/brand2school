export default function RootLoading(): JSX.Element {
  return (
    <div
      className="b2s-root-loading"
      style={{
        minHeight: "45vh",
        display: "grid",
        placeItems: "center",
        padding: "2rem 1.25rem"
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "28rem" }}>
        <p
          style={{
            margin: 0,
            fontFamily: "var(--font-heading, Montserrat), system-ui, sans-serif",
            fontWeight: 800,
            fontSize: "1.05rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "#003b8e"
          }}
        >
          Loading Brand2School
        </p>
        <p style={{ margin: "0.75rem 0 0", fontSize: "0.9rem", color: "#6b7280", lineHeight: 1.5 }}>
          First load may take a moment while the app prepares data and assets.
        </p>
        <div
          style={{
            marginTop: "1.25rem",
            height: "3px",
            borderRadius: "999px",
            background: "linear-gradient(90deg, #003b8e, #6cc24a, #f7931e)",
            animation: "b2s-load-pulse 1.2s ease-in-out infinite"
          }}
          aria-hidden
        />
        <style>{`@keyframes b2s-load-pulse { 0%, 100% { opacity: 0.45; transform: scaleX(0.92); } 50% { opacity: 1; transform: scaleX(1); } }`}</style>
      </div>
    </div>
  );
}
