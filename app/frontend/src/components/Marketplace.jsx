import React, { useState, useEffect, useContext } from 'react';
import {
  ShoppingBag, ShoppingCart, Trash2, CreditCard, Check, Search, Plus, Filter, Phone, MapPin, Tag,
  Star, CheckCircle2, AlertCircle, RefreshCw, Warehouse, Sparkles,
  ArrowRight, ShieldCheck, Truck, Package, X, Camera, Upload, Image as ImageIcon
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const CATEGORIES = ['All', 'Farm Produce', 'Feed', 'Medicines', 'Vaccines', 'Instruments'];

const FALLBACK_PRODUCTS = [
  {
    _id: 'prod_inst_1',
    name: 'Automatic Poultry Nipple Drinker Kit (10 Pack)',
    category: 'Instruments',
    price: 1200,
    unit: '10 pcs set',
    sellerName: 'AgriTech Poultry Equipments Ltd.',
    sellerPhone: '+880 1812-334455',
    sellerLocation: 'Gazipur, Dhaka',
    city: 'Gazipur, Dhaka',
    description: 'High-grade 360-degree stainless steel nipple drinkers with leak-proof rubber gaskets. Reduces water contamination by 90%.',
    image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
    stock: 45,
    rating: 4.8,
    badge: 'Best Seller',
    isFarmerListing: false
  },
  {
    _id: 'prod_med_1',
    name: 'Amprolium 20% Water Soluble Powder (Coccidiosis Treatment)',
    category: 'Medicines',
    price: 650,
    unit: '100g sachet',
    sellerName: 'Apex Vet Pharma Ltd.',
    sellerPhone: '+880 1715-445566',
    sellerLocation: 'Dhaka',
    city: 'Dhaka',
    description: 'Targeted anti-coccidial treatment effective against Eimeria tenella and bloody fecal droppings in broilers and layers.',
    image: 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',
    stock: 120,
    rating: 4.9,
    badge: 'Veterinary Choice',
    isFarmerListing: false
  },
  {
    _id: 'prod_med_2',
    name: 'Oxytetracycline 50% Broad-Spectrum Antibiotic',
    category: 'Medicines',
    price: 820,
    unit: '100g jar',
    sellerName: 'Square AgroVet Health',
    sellerPhone: '+880 1819-667788',
    sellerLocation: 'Chattogram',
    city: 'Chattogram',
    description: 'First-line antimicrobial for Fowl Cholera, Salmonella, and secondary bacterial respiratory infections.',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    stock: 85,
    rating: 4.8,
    badge: 'Top Rated',
    isFarmerListing: false
  },
  {
    _id: 'prod_vac_1',
    name: 'Newcastle Disease Vaccine (ND Lasota Live Strain - 1000 Doses)',
    category: 'Vaccines',
    price: 350,
    unit: '1000 dose vial',
    sellerName: 'Livestock Bio-Laboratories',
    sellerPhone: '+880 1722-114477',
    sellerLocation: 'Gazipur',
    city: 'Gazipur',
    description: 'Live freeze-dried vaccine for active immunization against Ranikhet / Newcastle disease via eye-drop or drinking water.',
    image: 'https://images.unsplash.com/photo-1583912267670-6575ad472688?auto=format&fit=crop&w=600&q=80',
    stock: 200,
    rating: 4.95,
    badge: 'Must Have',
    isFarmerListing: false
  },
  {
    _id: 'prod_feed_1',
    name: 'Broiler Starter Crumbles 22% CP (50 kg Bag)',
    category: 'Feed',
    price: 3250,
    unit: '50 kg sack',
    sellerName: 'Kazi Farms Feed Depot',
    sellerPhone: '+880 1811-990011',
    sellerLocation: 'Dhaka / Gazipur',
    city: 'Dhaka / Gazipur',
    description: 'High-protein balanced starter feed fortified with amino acids, phytase, and essential multivitamins.',
    image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80',
    stock: 350,
    rating: 4.85,
    badge: 'Fresh Stock',
    isFarmerListing: false
  },
  {
    _id: 'prod_farm_1',
    name: 'Live Healthy Broiler Chickens (Avg 2.2 kg weight)',
    category: 'Farm Produce',
    price: 195,
    unit: 'per kg',
    sellerName: 'Mohammad Rahman (Green Valley Farm)',
    sellerPhone: '+880 1712-345678',
    sellerLocation: 'Gazipur, Bangladesh',
    city: 'Gazipur, Bangladesh',
    description: 'Batch of fully grown healthy broilers ready for immediate wholesale or local market supply.',
    image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
    stock: 1500,
    rating: 5.0,
    badge: 'Direct from Farmer',
    isFarmerListing: true
  },
  {
    _id: 'prod_farm_2',
    name: 'Fresh Organic Brown Layer Eggs (Carton of 30)',
    category: 'Farm Produce',
    price: 380,
    unit: '30 pcs crate',
    sellerName: 'Tariqul Anam (Sonali Heritage)',
    sellerPhone: '+880 1911-556677',
    sellerLocation: 'Bogura, Bangladesh',
    city: 'Bogura, Bangladesh',
    description: 'Farm-fresh, grade-A brown eggs collected daily from free-run layer hens. Rich in Omega-3 and calcium.',
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80',
    stock: 80,
    rating: 4.9,
    badge: 'Farm Fresh',
    isFarmerListing: true
  },
  {
    _id: 'prod_farm_3',
    name: 'Dry Organic Poultry Litter Compost (50 kg Bag)',
    category: 'Farm Produce',
    price: 450,
    unit: '50 kg sack',
    sellerName: 'Bhuiyan Agro Farm',
    sellerPhone: '+880 1823-456789',
    sellerLocation: 'Cumilla, Bangladesh',
    city: 'Cumilla, Bangladesh',
    description: 'Aged, odorless, high-nitrogen poultry litter compost ideal for vegetable, fruit, and crop fertilization.',
    image: 'https://images.unsplash.com/photo-1592417817098-8f3d6ef23a48?auto=format&fit=crop&w=600&q=80',
    stock: 200,
    rating: 4.8,
    badge: 'Organic Farm',
    isFarmerListing: true
  }
];

export default function Marketplace({ activeFarm, activeFarmId, setActiveTab, onOpenRegisterFarm }) {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showSellModal, setShowSellModal] = useState(false);
  const [contactModalProduct, setContactModalProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Cart & Checkout State
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('agrimind_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [showCartModal, setShowCartModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(null);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [cartToast, setCartToast] = useState(null);

  const [checkoutForm, setCheckoutForm] = useState({
    customerName: '',
    customerPhone: '',
    district: 'Dhaka',
    deliveryAddress: '',
    notes: '',
    paymentMethod: 'cod'
  });

  // New Listing Form State
  const [sellForm, setSellForm] = useState({
    name: '',
    category: 'Farm Produce',
    price: '',
    unit: 'per kg',
    sellerName: activeFarm?.ownerName || '',
    sellerPhone: activeFarm?.phoneNumber || '',
    city: activeFarm?.city || 'Dhaka',
    description: '',
    image: ''
  });

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('agrimind_cart', JSON.stringify(cart));
    } catch (_) {}
  }, [cart]);

  // Autofill user details when authenticated
  useEffect(() => {
    if (user) {
      setCheckoutForm(prev => ({
        ...prev,
        customerName: prev.customerName || user.name || '',
        customerPhone: prev.customerPhone || user.mobile || user.phone || ''
      }));
    }
  }, [user]);

  // Cart operations
  const addToCart = (product, qty = 1) => {
    setCart(prev => {
      const idx = prev.findIndex(item => String(item._id) === String(product._id));
      if (idx !== -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: (next[idx].quantity || 1) + qty };
        return next;
      }
      return [...prev, {
        _id: product._id,
        name: product.name,
        price: product.price,
        unit: product.unit || 'unit',
        image: product.image,
        category: product.category,
        sellerName: product.sellerName,
        sellerPhone: product.sellerPhone,
        quantity: qty
      }];
    });

    setCartToast(`Added "${product.name}" to cart!`);
    setTimeout(() => setCartToast(null), 3500);
  };

  const updateCartQty = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => String(item._id) === String(productId) ? { ...item, quantity: newQty } : item));
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => String(item._id) !== String(productId)));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartTotalItems = cart.reduce((acc, item) => acc + (item.quantity || 1), 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + ((item.price || 0) * (item.quantity || 1)), 0);
  const deliveryFee = cart.length > 0 ? 120 : 0;
  const cartGrandTotal = cartSubtotal + deliveryFee;

  const handleBuyNow = (product) => {
    addToCart(product, 1);
    setShowCartModal(false);
    setShowCheckoutModal(true);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      setOrderError('Your cart is empty. Please add items to proceed.');
      return;
    }

    if (!checkoutForm.customerName.trim() || !checkoutForm.customerPhone.trim() || !checkoutForm.deliveryAddress.trim()) {
      setOrderError('Please provide your name, phone number, and delivery address.');
      return;
    }

    setOrderSubmitting(true);
    setOrderError(null);

    try {
      const payload = {
        customerName: checkoutForm.customerName.trim(),
        customerPhone: checkoutForm.customerPhone.trim(),
        district: checkoutForm.district || 'Dhaka',
        deliveryAddress: checkoutForm.deliveryAddress.trim(),
        notes: checkoutForm.notes || '',
        paymentMethod: checkoutForm.paymentMethod || 'cod',
        items: cart.map(item => ({
          productId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          unit: item.unit,
          image: item.image,
          sellerName: item.sellerName,
          sellerPhone: item.sellerPhone
        })),
        subtotal: cartSubtotal,
        deliveryFee: deliveryFee,
        totalAmount: cartGrandTotal
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.order) {
        setOrderConfirmed(data.order);
        setCart([]);
        setShowCheckoutModal(false);
      } else {
        setOrderError(data.message || data.error || 'Failed to place order.');
      }
    } catch (_) {
      setOrderError('Network error while placing order. Please try again.');
    } finally {
      setOrderSubmitting(false);
    }
  };

  useEffect(() => {
    if (activeFarm) {
      setSellForm(prev => ({
        ...prev,
        sellerName: prev.sellerName || activeFarm.ownerName || '',
        sellerPhone: prev.sellerPhone || activeFarm.phoneNumber || '',
        city: prev.city || activeFarm.city || 'Dhaka'
      }));
    } else if (activeFarmId) {
      fetch('/api/farms')
        .then(r => r.json())
        .then(d => {
          if (d.success && d.farms) {
            const found = d.farms.find(f => f._id === activeFarmId);
            if (found) {
              setSellForm(prev => ({
                ...prev,
                sellerName: prev.sellerName || found.ownerName || '',
                sellerPhone: prev.sellerPhone || found.phoneNumber || '',
                city: prev.city || found.city || 'Dhaka'
              }));
            }
          }
        })
        .catch(() => {});
    }
  }, [activeFarm, activeFarmId]);

  const applyFallbackProducts = (cat, q) => {
    let list = [...FALLBACK_PRODUCTS];
    if (cat && cat !== 'All') {
      const c = cat.toLowerCase();
      list = list.filter(p => {
        const pc = (p.category || '').toLowerCase();
        if (c.includes('farm') || c.includes('produce')) {
          return pc.includes('farm') || pc.includes('produce');
        }
        if (c.includes('med') && pc.includes('med')) return true;
        if (c.includes('vac') && pc.includes('vac')) return true;
        if (c.includes('inst') && pc.includes('inst')) return true;
        if (c.includes('feed') && pc.includes('feed')) return true;
        return pc === c;
      });
    }
    if (q && q.trim()) {
      const s = q.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s) ||
        (p.city && p.city.toLowerCase().includes(s))
      );
    }
    setProducts(list);
  };

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, JPEG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB.');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setImagePreview(dataUrl);
      setSellForm(prev => ({ ...prev, image: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setSellForm(prev => ({ ...prev, image: '' }));
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = '/api/products';
      const params = new URLSearchParams();
      if (category !== 'All') params.append('category', category);
      if (search.trim()) params.append('search', search.trim());
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.products) && data.products.length > 0) {
        setProducts(data.products);
      } else {
        applyFallbackProducts(category, search);
      }
    } catch {
      applyFallbackProducts(category, search);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [category, search]);

  const handleSellSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sellForm)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Your product has been listed in the Marketplace!');
        setShowSellModal(false);
        setImagePreview(null);
        setSellForm({
          name: '',
          category: 'Farm Produce',
          price: '',
          unit: 'per kg',
          sellerName: activeFarm?.ownerName || '',
          sellerPhone: activeFarm?.phoneNumber || '',
          city: activeFarm?.city || 'Dhaka',
          description: '',
          image: ''
        });
        fetchProducts();
        setTimeout(() => setSuccessMsg(null), 5000);
      } else {
        setError(data.error || 'Failed to list product.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in">
      {/* ── Sell Your Product Modal ── */}
      {showSellModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-emerald-500/30 max-w-xl w-full my-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                  List Your Farm Product for Sale
                </h3>
                <p className="text-xs text-slate-400">
                  Sell live chickens, fresh eggs, compost manure, or surplus farm equipment directly to other buyers.
                </p>
              </div>
              <button
                onClick={() => setShowSellModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSellSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Product Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fresh Brown Farm Eggs (30-Egg Crate)"
                  value={sellForm.name}
                  onChange={e => setSellForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Category</label>
                  <select
                    value={sellForm.category}
                    onChange={e => setSellForm(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Farm Produce">Farm Produce (Chickens, Eggs, Compost)</option>
                    <option value="Feed">Feed & Nutrition</option>
                    <option value="Medicines">Medicines</option>
                    <option value="Vaccines">Vaccines</option>
                    <option value="Instruments">Instruments & Tools</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Price (BDT) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 390"
                    value={sellForm.price}
                    onChange={e => setSellForm(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Unit / Quantity</label>
                  <input
                    type="text"
                    placeholder="e.g. per kg, per crate"
                    value={sellForm.unit}
                    onChange={e => setSellForm(prev => ({ ...prev, unit: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Seller / Farm Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Green Valley Farm"
                    value={sellForm.sellerName}
                    onChange={e => setSellForm(prev => ({ ...prev, sellerName: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Seller Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +880 1712-345678"
                    value={sellForm.sellerPhone}
                    onChange={e => setSellForm(prev => ({ ...prev, sellerPhone: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">City / Location *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gazipur, Dhaka"
                    value={sellForm.city}
                    onChange={e => setSellForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Product Photo Upload */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    Product Photo
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">Optional (auto-assigned if omitted)</span>
                </label>

                {imagePreview ? (
                  <div className="relative rounded-xl border border-emerald-500/40 bg-slate-900/90 p-3 flex items-center gap-4 group shadow-md">
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-slate-700 bg-slate-950 shrink-0">
                      <img
                        src={imagePreview}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Photo Attached</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        This photo will be displayed on your marketplace listing
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <label
                          htmlFor="product-photo-file"
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium cursor-pointer transition-colors border border-slate-700"
                        >
                          Change Photo
                        </label>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-medium transition-colors border border-rose-500/30"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="product-photo-file"
                    className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-xl p-4 flex flex-col items-center justify-center gap-2 bg-slate-900/40 hover:bg-emerald-950/10 transition-all cursor-pointer group text-center"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-800 group-hover:bg-emerald-500/20 border border-slate-700 group-hover:border-emerald-500/40 flex items-center justify-center transition-colors">
                      <Upload className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-slate-200 group-hover:text-emerald-300 transition-colors">
                        Click to upload product photo
                      </p>
                      <p className="text-[10px] text-slate-400">
                        PNG, JPG, JPEG or WEBP (Max 5MB)
                      </p>
                    </div>
                  </label>
                )}

                <input
                  id="product-photo-file"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/jpg"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Description</label>
                <textarea
                  rows="2"
                  placeholder="Describe your product condition, batch size, availability..."
                  value={sellForm.description}
                  onChange={e => setSellForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
                >
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span>Post Listing to Marketplace</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSellModal(false)}
                  className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 text-sm hover:bg-slate-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Contact Seller Modal ── */}
      {contactModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="glass-panel rounded-2xl p-6 border border-emerald-500/30 max-w-sm w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" />
                Contact Seller
              </h3>
              <button onClick={() => setContactModalProduct(null)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
              <p className="font-bold text-sm text-slate-100">{contactModalProduct.name}</p>
              <p className="text-emerald-400 font-extrabold text-lg">৳ {contactModalProduct.price.toLocaleString()} <span className="text-xs font-normal text-slate-400">/{contactModalProduct.unit}</span></p>
              <div className="pt-2 border-t border-slate-800 text-slate-300 space-y-1">
                <p><span className="text-slate-500">Seller:</span> {contactModalProduct.sellerName}</p>
                <p><span className="text-slate-500">Location:</span> {contactModalProduct.city || contactModalProduct.sellerLocation || 'Bangladesh'}</p>
                <p><span className="text-slate-500">Direct Contact:</span> <strong className="text-emerald-400">{contactModalProduct.sellerPhone}</strong></p>
              </div>
            </div>

            <div className="space-y-2">
              <a
                href={`tel:${contactModalProduct.sellerPhone}`}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span>Call Seller Directly</span>
              </a>
              <button
                onClick={() => setContactModalProduct(null)}
                className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Cart Toast Notification ── */}
      {cartToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold px-4 py-3 rounded-2xl shadow-2xl border border-emerald-300 animate-slide-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-xs">{cartToast}</span>
          <button
            onClick={() => { setShowCartModal(true); setCartToast(null); }}
            className="ml-2 px-3 py-1 rounded-xl bg-slate-950 text-emerald-300 text-[11px] font-extrabold hover:bg-slate-900 transition-colors shadow"
          >
            View Cart
          </button>
        </div>
      )}

      {/* ── Success Alert ── */}
      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* ── Header Banner ── */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/50 to-emerald-950/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShoppingBag className="w-3.5 h-3.5" /> AgriMind Farm Marketplace
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-emerald-200 to-teal-400">
              Poultry Supplies & Trade Hub
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm">
              Buy farming instruments, vaccines, medicines, and feed at wholesale rates. Sell live chickens, fresh farm eggs, and organic compost directly to fellow farmers.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            <button
              onClick={() => setShowCartModal(true)}
              className="relative px-5 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-750 text-slate-100 border border-slate-700 hover:border-emerald-500/60 font-bold text-sm shadow-xl transition-all flex items-center gap-2.5 hover:scale-[1.02]"
            >
              <ShoppingCart className="w-4 h-4 text-emerald-400" />
              <span>Cart</span>
              {cartTotalItems > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-emerald-500 text-slate-950 shadow-md">
                  {cartTotalItems}
                </span>
              )}
            </button>

            <button
              onClick={() => setShowSellModal(true)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-950/50 hover:scale-[1.02] transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Sell Your Farm Produce</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Search & Filter Tabs ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                category === cat
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/40'
                  : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search instruments, vaccines, eggs..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* ── Products Grid ── */}
      {loading ? (
        <div className="glass-panel p-16 rounded-2xl text-center space-y-3 border border-slate-800">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading marketplace catalogue...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="glass-panel p-16 rounded-2xl text-center space-y-3 border border-slate-800">
          <Package className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-base font-bold text-slate-300">No products found</p>
          <p className="text-xs text-slate-500">Try changing your category filter or search terms.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map(product => {
            const inCartItem = cart.find(i => String(i._id) === String(product._id));
            const inCartQty = inCartItem ? inCartItem.quantity : 0;

            return (
              <div
                key={product._id}
                className="glass-panel rounded-2xl border border-slate-800/90 hover:border-emerald-500/40 transition-all duration-300 overflow-hidden flex flex-col group hover:scale-[1.01] shadow-xl"
              >
                {/* Product Image */}
                <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=500&auto=format&fit=crop&q=60';
                    }}
                  />
                  <div className="absolute top-2.5 left-2.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-950/80 backdrop-blur-md text-emerald-300 border border-emerald-500/30">
                      {product.category}
                    </span>
                  </div>
                  {product.badge && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500 text-slate-950 shadow-md">
                        {product.badge}
                      </span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-slate-100 group-hover:text-emerald-300 transition-colors line-clamp-2">
                      {product.name}
                    </h4>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-800/80">
                    {/* Price & Rating */}
                    <div className="flex items-baseline justify-between">
                      <div>
                        <span className="text-lg font-extrabold text-emerald-400">
                          ৳ {product.price?.toLocaleString()}
                        </span>
                        <span className="text-[11px] text-slate-500 ml-1 font-medium">
                          /{product.unit}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-amber-400 font-bold">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{product.rating || '4.8'}</span>
                      </div>
                    </div>

                    {/* Seller & Location */}
                    <div className="text-[11px] text-slate-400 space-y-0.5">
                      <p className="truncate font-medium text-slate-300 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{product.sellerName}</span>
                      </p>
                      <p className="flex items-center gap-1 text-slate-500">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span>{product.city}</span>
                      </p>
                    </div>

                    {/* Action Buttons: Add to Cart, Buy Now, Call */}
                    <div className="space-y-2 pt-1">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => addToCart(product, 1)}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 ${
                            inCartQty > 0
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700 hover:border-emerald-500/40'
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{inCartQty > 0 ? `In Cart (${inCartQty})` : 'Add to Cart'}</span>
                        </button>

                        <button
                          onClick={() => handleBuyNow(product)}
                          className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs font-extrabold shadow-md shadow-emerald-950/40 transition-all flex items-center justify-center gap-1 active:scale-95"
                        >
                          <span>Buy Now</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => setContactModalProduct(product)}
                        className="w-full py-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-[11px] font-medium transition-colors flex items-center justify-center gap-1 border border-slate-800/80"
                      >
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>Contact Seller</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Floating Cart Trigger ── */}
      {cartTotalItems > 0 && !showCartModal && !showCheckoutModal && !orderConfirmed && (
        <button
          onClick={() => setShowCartModal(true)}
          className="fixed bottom-6 right-6 z-40 px-5 py-3.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-2xl shadow-emerald-950/80 flex items-center gap-3 hover:scale-105 transition-all border border-emerald-300"
        >
          <ShoppingCart className="w-5 h-5" />
          <span>View Cart ({cartTotalItems})</span>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-950/20 text-slate-950 text-xs font-black">
            ৳{cartSubtotal.toLocaleString()}
          </span>
        </button>
      )}

      {/* ── Shopping Cart Modal ── */}
      {showCartModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/30 max-w-2xl w-full my-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-100">Your Shopping Cart</h3>
                  <p className="text-xs text-slate-400">{cartTotalItems} {cartTotalItems === 1 ? 'item' : 'items'} selected</p>
                </div>
              </div>
              <button
                onClick={() => setShowCartModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-600 mx-auto" />
                <p className="text-base font-bold text-slate-300">Your cart is currently empty</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Browse through vaccines, farm instruments, medicines, and produce above and add items to your cart.
                </p>
                <button
                  onClick={() => setShowCartModal(false)}
                  className="mt-3 px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-extrabold hover:bg-emerald-400 transition-colors"
                >
                  Start Shopping
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Cart Items List */}
                <div className="max-h-80 overflow-y-auto space-y-3 pr-1 divide-y divide-slate-800/60">
                  {cart.map(item => (
                    <div key={item._id} className="pt-3 first:pt-0 flex items-center gap-3">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?w=200'}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover bg-slate-900 border border-slate-800 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-slate-200 truncate">{item.name}</h4>
                        <p className="text-[11px] text-slate-400">
                          ৳{item.price?.toLocaleString()} <span className="text-slate-500">/{item.unit}</span>
                        </p>
                        <p className="text-[10px] text-emerald-400/80 truncate">By {item.sellerName || 'AgriMind'}</p>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-xl p-1 shrink-0">
                        <button
                          onClick={() => updateCartQty(item._id, item.quantity - 1)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm transition-colors"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-xs font-extrabold text-slate-100">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(item._id, item.quantity + 1)}
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center font-bold text-sm transition-colors"
                        >
                          +
                        </button>
                      </div>

                      {/* Item Total & Remove */}
                      <div className="text-right shrink-0 min-w-[70px]">
                        <p className="text-xs font-extrabold text-emerald-400">
                          ৳{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                        </p>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 ml-auto mt-1"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal & Calculations */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Products Subtotal</span>
                    <span className="font-semibold text-slate-200">৳{cartSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-emerald-400" /> Standard Delivery (Nationwide)
                    </span>
                    <span className="font-semibold text-slate-200">৳{deliveryFee}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-extrabold text-slate-100">
                    <span>Total Amount</span>
                    <span className="text-emerald-400 text-base">৳{cartGrandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={clearCart}
                    className="px-4 py-3 rounded-xl border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs font-semibold transition-colors"
                  >
                    Clear Cart
                  </button>
                  <button
                    onClick={() => {
                      setShowCartModal(false);
                      setShowCheckoutModal(true);
                    }}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 hover:scale-[1.01] transition-all"
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Checkout Modal ── */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/30 max-w-xl w-full my-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  Checkout & Confirm Order
                </h3>
                <p className="text-xs text-slate-400">
                  Enter your delivery contact details. Pay via Cash on Delivery upon delivery to your farm.
                </p>
              </div>
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {orderError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{orderError}</span>
              </div>
            )}

            {/* Order Items Preview Strip */}
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300">Items ({cartTotalItems})</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowCheckoutModal(false);
                    setShowCartModal(true);
                  }}
                  className="text-emerald-400 text-[11px] hover:underline"
                >
                  Edit Cart
                </button>
              </div>
              <div className="flex items-center justify-between text-sm font-extrabold text-emerald-400">
                <span className="text-slate-300 text-xs font-normal">Subtotal + ৳120 Delivery:</span>
                <span>৳{cartGrandTotal.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handlePlaceOrder} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abir Hossain"
                    value={checkoutForm.customerName}
                    onChange={e => setCheckoutForm(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-300">Mobile Number (Active) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 017XXXXXXXX"
                    value={checkoutForm.customerPhone}
                    onChange={e => setCheckoutForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 text-xs focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">District / Division *</label>
                <select
                  value={checkoutForm.district}
                  onChange={e => setCheckoutForm(prev => ({ ...prev, district: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Dhaka">Dhaka</option>
                  <option value="Gazipur">Gazipur</option>
                  <option value="Chattogram">Chattogram</option>
                  <option value="Bogura">Bogura</option>
                  <option value="Mymensingh">Mymensingh</option>
                  <option value="Cumilla">Cumilla</option>
                  <option value="Rajshahi">Rajshahi</option>
                  <option value="Sylhet">Sylhet</option>
                  <option value="Khulna">Khulna</option>
                  <option value="Barishal">Barishal</option>
                  <option value="Rangpur">Rangpur</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Detailed Delivery Address (Farm / Street / Union) *</label>
                <textarea
                  rows="2"
                  required
                  placeholder="e.g. Joydebpur Chowrasta, Green Valley Poultry Farm, Shed #2, Gazipur"
                  value={checkoutForm.deliveryAddress}
                  onChange={e => setCheckoutForm(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Delivery Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Call before arrival, deliver before 5 PM"
                  value={checkoutForm.notes}
                  onChange={e => setCheckoutForm(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-slate-100 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2 pt-1">
                <label className="font-semibold text-slate-300">Payment Option</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    checkoutForm.paymentMethod === 'cod'
                      ? 'bg-emerald-500/10 border-emerald-500 text-slate-100'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={checkoutForm.paymentMethod === 'cod'}
                      onChange={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: 'cod' }))}
                      className="accent-emerald-500"
                    />
                    <div>
                      <p className="font-bold text-xs text-slate-200">Cash on Delivery</p>
                      <p className="text-[10px] text-slate-400">Pay cash when package arrives</p>
                    </div>
                  </label>

                  <label className={`p-3 rounded-xl border flex items-center gap-2.5 cursor-pointer transition-all ${
                    checkoutForm.paymentMethod === 'bkash'
                      ? 'bg-emerald-500/10 border-emerald-500 text-slate-100'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400'
                  }`}>
                    <input
                      type="radio"
                      name="payment"
                      value="bkash"
                      checked={checkoutForm.paymentMethod === 'bkash'}
                      onChange={() => setCheckoutForm(prev => ({ ...prev, paymentMethod: 'bkash' }))}
                      className="accent-emerald-500"
                    />
                    <div>
                      <p className="font-bold text-xs text-slate-200">bKash / Nagad</p>
                      <p className="text-[10px] text-slate-400">Direct mobile payment</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCheckoutModal(false)}
                  className="px-5 py-3 rounded-xl border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orderSubmitting}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all"
                >
                  {orderSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Placing Order...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Confirm & Place Order (৳{cartGrandTotal.toLocaleString()})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Order Confirmed Screen / Modal ── */}
      {orderConfirmed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/40 max-w-lg w-full my-8 space-y-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Order #{orderConfirmed.orderNumber}
              </span>
              <h3 className="text-xl font-extrabold text-slate-100 pt-2">Order Confirmed!</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Thank you, {orderConfirmed.customerName}. Your farm order has been received and our team is preparing it for dispatch.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left space-y-2 text-xs">
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Delivery Recipient</span>
                <span className="font-bold text-slate-200">{orderConfirmed.customerName} ({orderConfirmed.customerPhone})</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Destination</span>
                <span className="font-medium text-slate-200 text-right max-w-[240px] truncate">{orderConfirmed.deliveryAddress}, {orderConfirmed.district}</span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-2">
                <span className="text-slate-400">Payment Mode</span>
                <span className="font-bold text-emerald-400 uppercase">{orderConfirmed.paymentMethod || 'Cash on Delivery'}</span>
              </div>
              <div className="flex justify-between pt-1 font-bold text-sm">
                <span className="text-slate-300">Total Due on Delivery</span>
                <span className="text-emerald-400 font-extrabold">৳{orderConfirmed.totalAmount?.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={() => setOrderConfirmed(null)}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-950/50 transition-all"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {/* ── Farm Registration & Management CTA Section (Under Shopping Section) ── */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-cyan-950/30 space-y-4 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Warehouse className="w-3.5 h-3.5" /> Farm Management & ML Prediction Hub
            </span>
            <h3 className="text-2xl font-extrabold text-slate-100">
              Have a Poultry Farm? Register or Manage Your Farms
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Register multiple farms under your account to run automated Machine Learning profit forecasts, AI fecal disease diagnostics, and track customized local weather.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={() => {
                if (onOpenRegisterFarm) {
                  onOpenRegisterFarm();
                } else {
                  setActiveTab('farm');
                }
              }}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-950/40 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Register a New Farm</span>
            </button>

            <button
              onClick={() => setActiveTab('farm')}
              className="px-5 py-3.5 rounded-2xl border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Go to My Farm Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
