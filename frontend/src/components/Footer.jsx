export default function Footer() {
  return (
    <footer className="mt-10 bg-slate-900 text-slate-400">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-5 px-5 py-8">
        <div>
          <span className="flex items-center gap-2 text-lg font-extrabold text-white">
            <span className="text-xl">🛒</span> Shop<span className="text-indigo-400">Kart</span>
          </span>
          <p className="mt-1.5 max-w-sm text-xs">
            Role-based e-commerce platform — React · Express · MongoDB · Cloudinary · Razorpay
          </p>
        </div>
        <div className="flex flex-col gap-1 text-xs">
          <span>Admin · Sales Person · Customer roles</span>
          <span>JWT auth with bcrypt hashing</span>
          <span>Razorpay test-mode checkout</span>
        </div>
        <small className="w-full border-t border-slate-800 pt-3.5 text-center text-xs">
          © {new Date().getFullYear()} ShopKart — Full Stack Internship Task
        </small>
      </div>
    </footer>
  );
}
