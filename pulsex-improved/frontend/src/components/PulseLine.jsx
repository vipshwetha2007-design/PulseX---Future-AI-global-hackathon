export default function PulseLine({ color = "#2FE6C4", height = 40, animated = true, className = "" }) {
  return (
    <svg
      viewBox="0 0 400 40"
      preserveAspectRatio="none"
      width="100%"
      height={height}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M0,20 L60,20 L75,20 L85,4 L95,36 L105,10 L115,20 L140,20 L400,20"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength="100"
        style={
          animated
            ? {
                strokeDasharray: 100,
                strokeDashoffset: 100,
                animation: "pulse-draw 2.4s linear infinite",
              }
            : undefined
        }
      />
      <style>{`
        @keyframes pulse-draw {
          0% { stroke-dashoffset: 100; opacity: 0.3; }
          50% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: -100; opacity: 0.3; }
        }
      `}</style>
    </svg>
  );
}
