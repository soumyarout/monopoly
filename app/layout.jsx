export const metadata = {
  title: "Monopoly Deal",
  description: "Multiplayer Monopoly Deal — Claude is your live judge",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: "#071407" }}>
        {children}
      </body>
    </html>
  );
}
