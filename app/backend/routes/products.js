/**
 * =============================================================================
 * Module: Marketplace & Farm Supplies Routes
 * Authorship: Full-Stack Web Team & Marketplace Lead
 * Component: /app/backend/routes/products.js
 * Description: Poultry tools, vaccines, medicines, feed, and farmer selling trade hub
 * =============================================================================
 */

const express = require('express');
const router = express.Router();

const INITIAL_PRODUCTS = [
  // Instruments & Equipment
  {
    _id: 'prod_inst_1',
    name: 'Automatic Poultry Nipple Drinker Kit (10 Pack)',
    category: 'Instruments',
    price: 1200,
    unit: '10 pcs set',
    sellerName: 'AgriTech Poultry Equipments Ltd.',
    sellerPhone: '+880 1812-334455',
    sellerLocation: 'Gazipur, Dhaka',
    description: 'High-grade 360-degree stainless steel nipple drinkers with leak-proof rubber gaskets. Reduces water contamination by 90%.',
    image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
    stock: 45,
    rating: 4.8,
    badge: 'Best Seller',
    isFarmerListing: false
  },
  {
    _id: 'prod_inst_2',
    name: 'Digital Shed Thermostat & Humidity Controller',
    category: 'Instruments',
    price: 3400,
    unit: '1 unit',
    sellerName: 'SmartPoultry Automation',
    sellerPhone: '+880 1711-223344',
    sellerLocation: 'Bogura',
    description: 'Dual-relay automatic microclimate controller for cooling fans, foggers, and brooder heaters with high-accuracy waterproof probe.',
    image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
    stock: 20,
    rating: 4.9,
    badge: 'Popular',
    isFarmerListing: false
  },
  {
    _id: 'prod_inst_3',
    name: 'Infrared Poultry Brooder Gas Heater (2500 Bird Capacity)',
    category: 'Instruments',
    price: 6800,
    unit: '1 set',
    sellerName: 'Bengal Brooders & Farm Tech',
    sellerPhone: '+880 1912-778899',
    sellerLocation: 'Mymensingh',
    description: 'Energy-efficient ceramic gas brooder heater ensuring uniform radiant heat for day-old chicks during initial brooding weeks.',
    image: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=600&q=80',
    stock: 12,
    rating: 4.7,
    badge: 'Essential',
    isFarmerListing: false
  },
  // Medicines & Health
  {
    _id: 'prod_med_1',
    name: 'Amprolium 20% Water Soluble Powder (Coccidiosis Treatment)',
    category: 'Medicines',
    price: 650,
    unit: '100g sachet',
    sellerName: 'Apex Vet Pharma Ltd.',
    sellerPhone: '+880 1715-445566',
    sellerLocation: 'Dhaka',
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
    description: 'First-line antimicrobial for Fowl Cholera, Salmonella (Fowl Typhoid / Pullorum), and secondary bacterial respiratory infections.',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    stock: 85,
    rating: 4.8,
    badge: 'Top Rated',
    isFarmerListing: false
  },
  // Vaccines & Biosecurity
  {
    _id: 'prod_vac_1',
    name: 'Newcastle Disease Vaccine (ND Lasota Live Strain - 1000 Doses)',
    category: 'Vaccines',
    price: 350,
    unit: '1000 dose vial',
    sellerName: 'Livestock Bio-Laboratories',
    sellerPhone: '+880 1722-114477',
    sellerLocation: 'Gazipur',
    description: 'Live freeze-dried vaccine for active immunization against Ranikhet / Newcastle disease via eye-drop or drinking water.',
    image: 'https://images.unsplash.com/photo-1583912267670-6575ad472688?auto=format&fit=crop&w=600&q=80',
    stock: 200,
    rating: 4.95,
    badge: 'Must Have',
    isFarmerListing: false
  },
  {
    _id: 'prod_vac_2',
    name: 'Virkon-S Virucidal Shed Disinfectant (1 kg)',
    category: 'Vaccines',
    price: 2400,
    unit: '1 kg tub',
    sellerName: 'BioShield Farm Hygiene',
    sellerPhone: '+880 1913-889900',
    sellerLocation: 'Dhaka',
    description: 'DEFRA-approved viral disinfectant proven effective against Avian Influenza, Newcastle Disease, and Gumboro virus.',
    image: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=600&q=80',
    stock: 60,
    rating: 4.9,
    badge: 'Biosecurity Pro',
    isFarmerListing: false
  },
  // Feed & Nutrition
  {
    _id: 'prod_feed_1',
    name: 'Broiler Starter Crumbles 22% CP (50 kg Bag)',
    category: 'Feed',
    price: 3250,
    unit: '50 kg sack',
    sellerName: 'Kazi Farms Feed Depot',
    sellerPhone: '+880 1811-990011',
    sellerLocation: 'Dhaka / Gazipur',
    description: 'High-protein balanced starter feed fortified with amino acids, phytase, and essential multivitamins for days 1 to 14.',
    image: 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80',
    stock: 350,
    rating: 4.85,
    badge: 'Fresh Stock',
    isFarmerListing: false
  },
  // Farmer Produce
  {
    _id: 'prod_farm_1',
    name: 'Live Healthy Broiler Chickens (Avg 2.2 kg weight)',
    category: 'Farmer Products',
    price: 195,
    unit: 'per kg',
    sellerName: 'Mohammad Rahman (Green Valley Farm)',
    sellerPhone: '+880 1712-345678',
    sellerLocation: 'Gazipur, Bangladesh',
    description: 'Batch of 1,500 fully grown healthy broilers ready for immediate wholesale or local market supply. Complete vaccination record.',
    image: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=600&q=80',
    stock: 1500,
    rating: 5.0,
    badge: 'Direct from Farmer',
    isFarmerListing: true
  },
  {
    _id: 'prod_farm_2',
    name: 'Fresh Organic Brown Layer Eggs (Carton of 30)',
    category: 'Farmer Products',
    price: 380,
    unit: '30 pcs crate',
    sellerName: 'Tariqul Anam (Sonali Heritage)',
    sellerPhone: '+880 1911-556677',
    sellerLocation: 'Bogura, Bangladesh',
    description: 'Farm-fresh, grade-A brown eggs collected daily from free-run layer hens. Rich in Omega-3 and calcium.',
    image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80',
    stock: 80,
    rating: 4.9,
    badge: 'Farm Fresh',
    isFarmerListing: true
  }
];

let inMemoryProducts = [...INITIAL_PRODUCTS];

// @route   GET /api/products
// @desc    Get all marketplace products with optional category filter
// @access  Public
router.get('/', (req, res) => {
  const { category, search } = req.query;
  let products = [...inMemoryProducts];

  if (category && category !== 'All') {
    products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  if (search) {
    const q = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.sellerLocation.toLowerCase().includes(q)
    );
  }

  res.json({ success: true, count: products.length, products });
});

// @route   POST /api/products
// @desc    Farmer lists their own farm produce or supply for sale
// @access  Public
router.post('/', (req, res) => {
  try {
    const {
      name,
      category,
      price,
      unit,
      sellerName,
      sellerPhone,
      sellerLocation,
      description,
      image,
      stock
    } = req.body;

    if (!name || !price || !sellerName || !sellerPhone) {
      return res.status(400).json({
        success: false,
        error: 'Product name, price, seller name, and contact phone are required.'
      });
    }

    const defaultImages = {
      'Instruments': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      'Medicines': 'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&w=600&q=80',
      'Vaccines': 'https://images.unsplash.com/photo-1583912267670-6575ad472688?auto=format&fit=crop&w=600&q=80',
      'Feed': 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=600&q=80',
      'Farmer Products': 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?auto=format&fit=crop&w=600&q=80'
    };

    const newProduct = {
      _id: 'prod_' + Date.now(),
      name: name.trim(),
      category: category || 'Farmer Products',
      price: parseFloat(price),
      unit: unit || 'item',
      sellerName: sellerName.trim(),
      sellerPhone: String(sellerPhone).trim(),
      sellerLocation: (sellerLocation || 'Bangladesh').trim(),
      description: description ? description.trim() : 'Fresh supply listed directly by verified farmer.',
      image: image && image.startsWith('http') ? image : (defaultImages[category] || defaultImages['Farmer Products']),
      stock: parseInt(stock) || 10,
      rating: 5.0,
      badge: 'Farmer Listing',
      isFarmerListing: true,
      createdAt: new Date().toISOString()
    };

    inMemoryProducts.unshift(newProduct);

    res.status(201).json({
      success: true,
      message: 'Product listed on AgriShop marketplace successfully!',
      product: newProduct
    });
  } catch (err) {
    console.error('Error adding product:', err);
    res.status(500).json({ success: false, error: 'Failed to list product.' });
  }
});

module.exports = router;
