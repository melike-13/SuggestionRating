export default function Footer() {
  return (
    <footer className="bg-primary text-white py-4">
      <div className="container mx-auto px-4 text-center">
        <p>© {new Date().getFullYear()} <span className="font-bold">LAV</span> Kaizen Öneri Sistemi. Tüm hakları saklıdır.</p>
      </div>
    </footer>
  );
}
