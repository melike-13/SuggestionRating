export default function Footer() {
  return (
    <footer className="bg-white text-gray-700 py-4 border-t border-gray-200">
      <div className="container mx-auto px-4 text-center">
        <p>© {new Date().getFullYear()} <span className="font-bold text-primary">LAV</span> Kaizen Öneri Sistemi. Tüm hakları saklıdır.</p>
      </div>
    </footer>
  );
}
