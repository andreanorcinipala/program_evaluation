export const metadata = {
  title: "Causal Inference Methods - Interactive Learning Platform",
  description:
    "Learn RCT, DiD, RD, and PSM through personalized, AI-powered explanations with interactive visualizations.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0 }}>{children}</body>
    </html>
  );
}
