export default function Footer() {
  return (
    <footer className="mt-10 bg-slate-900 text-slate-400">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-8">
        <div>
          <span className="flex items-center gap-2 text-lg font-extrabold text-white">
            <span className="text-xl">🛒</span> Shop<span className="text-indigo-400">Kart</span>
          </span>
        </div>
      
        <small className="w-full border-t border-slate-800 pt-3.5 text-center text-xs">
          © {new Date().getFullYear()} ShopKart — All rights reserved.
        </small>
      </div>
    </footer>
  );
}
