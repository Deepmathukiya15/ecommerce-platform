import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { useToast, errMsg } from '../context/ToastContext';
import Loader from '../components/Loader';
import { btn, btnGhost, btnOutline, btnPrimary, hint, input, label, lg, md } from '../utils/ui';

const EMPTY = { name: '', description: '', price: '', category: '', brand: '', stock: '' };

/**
 * Add / Edit product form (Admin & Sales Person).
 * Images are uploaded straight to Cloudinary via POST /api/products/upload —
 * the backend keeps them in memory only and stores the returned URLs.
 */
export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { success, error, info } = useToast();

  const [form, setForm] = useState(EMPTY);
  const [images, setImages] = useState([]); // [{url, public_id?}]
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    api.get('/products/categories').then((r) => setCategories(r.data)).catch(() => {});
    if (isEdit) {
      api
        .get(`/products/${id}`)
        .then(({ data }) => {
          setForm({
            name: data.name,
            description: data.description,
            price: String(data.price),
            category: data.category,
            brand: data.brand || '',
            stock: String(data.stock),
          });
          setImages(data.images || []);
        })
        .catch((err) => {
          error(errMsg(err, 'Could not load product'));
          navigate('/');
        })
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (images.length + files.length > 5) return error('Maximum 5 images per product');

    setUploading(true);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('images', f));
      const { data } = await api.post('/products/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImages((imgs) => [...imgs, ...data.images]);
      success(`${data.images.length} image(s) uploaded`);
    } catch (err) {
      error(errMsg(err, 'Image upload failed'));
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addByUrl = () => {
    const url = window.prompt('Paste an image URL (jpg/png/webp):');
    if (!url) return;
    if (!/^https?:\/\/.+/.test(url)) return error('Enter a valid http(s) image URL');
    setImages((imgs) => [...imgs, { url }]);
    info('Image URL added');
  };

  const removeImage = (idx) => setImages((imgs) => imgs.filter((_, i) => i !== idx));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (Number(form.price) < 0 || Number(form.stock) < 0) return error('Price and stock cannot be negative');
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        category: form.category.trim(),
        brand: form.brand.trim(),
        stock: Number(form.stock) || 0,
        images,
      };
      if (isEdit) {
        await api.put(`/products/${id}`, payload);
        success('Product updated');
        navigate(`/products/${id}`);
      } else {
        const { data } = await api.post('/products', payload);
        success('Product created');
        navigate(`/products/${data._id}`);
      }
    } catch (err) {
      error(errMsg(err, 'Could not save product'));
      setSaving(false);
    }
  };

  if (loading) return <Loader full label="Loading product…" />;

  return (
    <div className="mx-auto w-full max-w-2xl px-5 pb-14 pt-7">
      <h1 className="mb-5 text-2xl font-extrabold text-slate-900">{isEdit ? 'Edit Product' : 'Add New Product'}</h1>

      <form className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" onSubmit={onSubmit}>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="p-name" className={label}>Product name *</label>
          <input id="p-name" required maxLength={140} value={form.name} onChange={set('name')} placeholder="e.g. SoundWave Pro Headphones" className={input} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="p-desc" className={label}>Description *</label>
          <textarea id="p-desc" required rows={4} maxLength={4000} value={form.description} onChange={set('description')} placeholder="Describe features, specs, what makes it great…" className={input} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="p-price" className={label}>Price (₹) *</label>
            <input id="p-price" type="number" min="0" step="0.01" required value={form.price} onChange={set('price')} placeholder="4999" className={input} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="p-stock" className={label}>Stock *</label>
            <input id="p-stock" type="number" min="0" step="1" required value={form.stock} onChange={set('stock')} placeholder="25" className={input} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="p-category" className={label}>Category *</label>
            <input id="p-category" required list="cat-options" value={form.category} onChange={set('category')} placeholder="Electronics" className={input} />
            <datalist id="cat-options">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="p-brand" className={label}>Brand</label>
            <input id="p-brand" value={form.brand} onChange={set('brand')} placeholder="Optional" className={input} />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className={label}>Product images (up to 5 — uploaded to Cloudinary)</span>
          <div className="flex flex-wrap items-center gap-3">
            <input ref={fileRef} id="p-images" type="file" accept="image/*" multiple hidden onChange={onFiles} />
            <label htmlFor="p-images" className={`${btnOutline} ${md} cursor-pointer ${uploading ? 'pointer-events-none opacity-70' : ''}`}>
              {uploading ? 'Uploading to Cloudinary…' : '⬆ Upload images'}
            </label>
            <button type="button" className="bg-transparent text-sm font-semibold text-indigo-600 hover:underline" onClick={addByUrl}>
              or paste an image URL
            </button>
          </div>

          {images.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-2.5">
              {images.map((img, i) => (
                <div key={i} className="relative h-24 w-24 overflow-hidden rounded-xl border border-slate-200">
                  <img src={img.url} alt={`Preview ${i + 1}`} className="h-full w-full object-cover" onError={(e) => (e.target.style.opacity = 0.3)} />
                  {i === 0 && (
                    <span className="absolute inset-x-0 bottom-0 bg-indigo-600/90 py-0.5 text-center text-[10px] font-bold text-white">Cover</span>
                  )}
                  <button
                    type="button"
                    className="absolute right-1 top-1 flex h-5.5 w-5.5 items-center justify-center rounded-full bg-slate-900/75 text-[10px] text-white hover:bg-red-600"
                    onClick={() => removeImage(i)}
                    aria-label="Remove image"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <small className={hint}>
            Files never touch the server disk — they are streamed from memory straight to Cloudinary and only the returned URLs are saved in MongoDB.
          </small>
        </div>

        <div className="mt-1 flex flex-wrap justify-end gap-2.5">
          <button className={`${btnPrimary} ${lg}`} disabled={saving || uploading}>
            {saving ? 'Saving…' : isEdit ? 'Save changes' : 'Create product'}
          </button>
          <button type="button" className={`${btnGhost} ${lg}`} onClick={() => navigate(-1)}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
