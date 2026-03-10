export const metadata = {
  title: "Causal Inference Methods - Interactive Learning Platform",
  description:
    "Learn RCT, DiD, RD, and PSM through personalized, AI-powered explanations with interactive visualizations.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, fontFamily: "'Inter', sans-serif" }}>{children}</body>
    </html>
  );
}
