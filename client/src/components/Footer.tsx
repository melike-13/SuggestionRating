export default function Footer() {
  return (
    <footer className="bg-neutral-dark text-white py-4">
      <div className="container mx-auto px-4 text-center">
        <p>© {new Date().getFullYear()} Kaizen Öneri Sistemi. Tüm hakları saklıdır.</p>
      </div>
    </footer>
  );
}
