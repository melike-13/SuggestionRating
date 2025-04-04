import LavLogo from "@/assets/lav-logo";

export default function Footer() {
  return (
    <footer className="bg-primary text-white py-4">
      <div className="container mx-auto px-4 text-center flex items-center justify-center gap-2">
        <LavLogo variant="white" size={24} />
        <p>© {new Date().getFullYear()} LAV Kaizen Öneri Sistemi. Tüm hakları saklıdır.</p>
      </div>
    </footer>
  );
}
