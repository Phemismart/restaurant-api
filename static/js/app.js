/**
 * Savory Table - Complete Frontend Application Logic
 * Integrates with Go / Gin / GORM / SQLite API with JWT Auth & Dark Mode
 */

// Global Application State
const state = {
    menu: [],
    filteredMenu: [],
    cart: [],
    orders: []
};

let currentAuthMode = 'login'; // 'login' or 'signup'

// Token Storage Helpers
function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
}

// Generates Authorization Header for Protected Endpoints
function getAuthHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// Exact Custom Image Mapping (Local Static Routes)
const DISH_IMAGES = {
    jollof: "/static/images/jollof.jpg",
    friedRice: "/static/images/fried-rice.jpg", 
    egusi: "/static/images/egusi.jpg",
    amala: "/static/images/amala.jpg",
    catfish: "/static/images/catfish.jpg",
    suya: "/static/images/suya.jpg",
    fallback: "/static/images/okra.jpg"
};

// Strict Name Matcher
function getDishImage(dishName = "") {
    const name = dishName.toLowerCase().trim();

    if (name.includes("amala") || name.includes("abula") || name.includes("ewedu") || name.includes("gbegiri")) {
        return DISH_IMAGES.amala;
    }
    if (name.includes("egusi") || name.includes("pounded yam")) {
        return DISH_IMAGES.egusi;
    }
    if (name.includes("catfish") || name.includes("pepper soup")) {
        return DISH_IMAGES.catfish;
    }
    if (name.includes("suya")) {
        return DISH_IMAGES.suya;
    }
    if (name.includes("fried rice")) {
        return DISH_IMAGES.friedRice;
    }
    if (name.includes("jollof")) {
        return DISH_IMAGES.jollof;
    }

    return DISH_IMAGES.fallback;
}

// Currency Formatter
function formatNaira(amount) {
    return new Intl.NumberFormat('en-NG', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2
    }).format(amount).replace('NGN', '₦');
}

// API Service Client (Relative paths leverage same-origin Go server)
const API = {
    async getMenu() {
        const res = await fetch('/api/menu');
        if (!res.ok) throw new Error('Failed to fetch menu catalog');
        const json = await res.json();
        return json.data || [];
    },
    async signup(email, password) {
        const res = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Registration failed');
        return json;
    },
    async login(email, password) {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Login failed');
        return json;
    },
    async createDish(dishData) {
        const res = await fetch('/api/menu', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(dishData)
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to create dish (Auth required)');
        return json;
    },
    async getOrders() {
        const res = await fetch('/api/orders', {
            headers: getAuthHeaders()
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to fetch orders (Auth required)');
        return json.data || [];
    },
    async createOrder(orderData) {
        const res = await fetch('/api/orders', {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(orderData)
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to submit order (Auth required)');
        return json;
    }
};

// DOM Initialization
document.addEventListener('DOMContentLoaded', () => {
    initLucideIcons();
    setupEventListeners();
    setupThemeToggle();
    setupAuthListeners();
    loadMenu();
    loadOrders();
});

function initLucideIcons() {
    if (window.lucide) window.lucide.createIcons();
}

// Dark Mode Toggle Logic
function setupThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (!themeBtn) return;

    themeBtn.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        initLucideIcons();
    });
}

// Auth Modal & State Handlers
function setupAuthListeners() {
    const modal = document.getElementById('auth-modal');
    const openBtn = document.getElementById('open-auth-btn');
    const closeBtn = document.getElementById('close-auth-modal-btn');
    const tabLogin = document.getElementById('tab-login');
    const tabSignup = document.getElementById('tab-signup');
    const form = document.getElementById('auth-form');

    // Toggle Modal or Logout
    openBtn?.addEventListener('click', () => {
        if (getToken()) {
            removeToken();
            updateAuthUI();
            loadOrders();
        } else {
            modal.classList.remove('opacity-0', 'pointer-events-none');
        }
    });

    closeBtn?.addEventListener('click', () => {
        modal.classList.add('opacity-0', 'pointer-events-none');
    });

    // Toggle Login vs Register Tabs
    tabLogin?.addEventListener('click', () => {
        currentAuthMode = 'login';
        document.getElementById('auth-modal-title').innerText = 'Account Login';
        document.getElementById('auth-submit-btn').innerText = 'Sign In';
        tabLogin.className = 'flex-1 py-2 rounded-lg bg-white dark:bg-slate-900 text-forest-950 dark:text-white shadow-sm transition';
        tabSignup.className = 'flex-1 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition';
    });

    tabSignup?.addEventListener('click', () => {
        currentAuthMode = 'signup';
        document.getElementById('auth-modal-title').innerText = 'Create Account';
        document.getElementById('auth-submit-btn').innerText = 'Register';
        tabSignup.className = 'flex-1 py-2 rounded-lg bg-white dark:bg-slate-900 text-forest-950 dark:text-white shadow-sm transition';
        tabLogin.className = 'flex-1 py-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition';
    });

    // Handle Auth Submission
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value.trim();
        const password = document.getElementById('auth-password').value.trim();
        const alertEl = document.getElementById('auth-alert');

        showAlert(alertEl, '', 'hide');

        try {
            if (currentAuthMode === 'signup') {
                await API.signup(email, password);
                showAlert(alertEl, 'Registration successful! Signing in...', 'success');
            }

            const loginRes = await API.login(email, password);
            setToken(loginRes.token);
            
            showAlert(alertEl, 'Authenticated successfully!', 'success');
            updateAuthUI();
            loadOrders();

            setTimeout(() => {
                closeBtn.click();
                form.reset();
                showAlert(alertEl, '', 'hide');
            }, 1000);

        } catch (err) {
            showAlert(alertEl, err.message, 'error');
        }
    });

    updateAuthUI();
}

// Dynamic Auth UI Update based on JWT token
function updateAuthUI() {
    const btn = document.getElementById('open-auth-btn');
    if (!btn) return;

    if (getToken()) {
        btn.innerHTML = `<i data-lucide="log-out" class="w-4 h-4 text-terracotta-500"></i><span>Logout</span>`;
        btn.className = "bg-rose-950/80 hover:bg-rose-900 text-cream-50 font-bold px-3.5 py-2.5 rounded-xl text-xs transition flex items-center space-x-2";
    } else {
        btn.innerHTML = `<i data-lucide="user" class="w-4 h-4"></i><span>Login</span>`;
        btn.className = "bg-forest-900 dark:bg-slate-800 hover:bg-forest-950 dark:hover:bg-slate-700 text-cream-50 font-bold px-3.5 py-2.5 rounded-xl text-xs transition flex items-center space-x-2";
    }
    initLucideIcons();
}

// General Event Listener Setup
function setupEventListeners() {
    const drawer = document.getElementById('cart-drawer');
    const backdrop = document.getElementById('cart-drawer-backdrop');
    
    const openCart = () => {
        drawer.classList.remove('translate-x-full');
        backdrop.classList.remove('opacity-0', 'pointer-events-none');
    };
    const closeCart = () => {
        drawer.classList.add('translate-x-full');
        backdrop.classList.add('opacity-0', 'pointer-events-none');
    };

    document.getElementById('cart-toggle-btn')?.addEventListener('click', openCart);
    document.getElementById('close-cart-btn')?.addEventListener('click', closeCart);
    backdrop?.addEventListener('click', closeCart);

    // Search Filter
    document.getElementById('menu-search-input')?.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        state.filteredMenu = state.menu.filter(dish => 
            dish.name.toLowerCase().includes(query) || 
            (dish.description && dish.description.toLowerCase().includes(query))
        );
        renderMenu();
    });

    // Checkout Form
    document.getElementById('checkout-form')?.addEventListener('submit', handleCheckoutSubmit);

    // Refresh Orders
    document.getElementById('refresh-orders-btn')?.addEventListener('click', loadOrders);

    // Admin Add Dish Modal
    const modal = document.getElementById('dish-modal');
    const openModalBtn = document.getElementById('open-add-dish-btn');
    const closeModalBtn = document.getElementById('close-dish-modal-btn');

    openModalBtn?.addEventListener('click', () => modal.classList.remove('opacity-0', 'pointer-events-none'));
    closeModalBtn?.addEventListener('click', () => modal.classList.add('opacity-0', 'pointer-events-none'));
    
    document.getElementById('add-dish-form')?.addEventListener('submit', handleAddDishSubmit);
}

// Render Menu Cards
async function loadMenu() {
    const container = document.getElementById('menu-container');
    container.innerHTML = renderSkeletonCards(3);

    try {
        state.menu = await API.getMenu();
        state.filteredMenu = [...state.menu];
        renderMenu();
    } catch (err) {
        console.error(err);
        container.innerHTML = `
            <div class="col-span-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-6 rounded-2xl text-center">
                <i data-lucide="alert-circle" class="w-8 h-8 mx-auto mb-2 text-red-500"></i>
                <p class="font-bold">Unable to load menu items</p>
                <p class="text-xs text-red-600 dark:text-red-400 mt-1">Please ensure your Go server is running on port 8080.</p>
            </div>
        `;
        initLucideIcons();
    }
}

function renderMenu() {
    const container = document.getElementById('menu-container');
    
    if (state.filteredMenu.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-12 text-center text-slate-400">
                <i data-lucide="utensils" class="w-12 h-12 mx-auto mb-3 opacity-40"></i>
                <p class="font-bold text-slate-600 dark:text-slate-300">No dishes found</p>
                <p class="text-xs">Try adjusting your search query or add a new dish.</p>
            </div>
        `;
        initLucideIcons();
        return;
    }

    container.innerHTML = state.filteredMenu.map(dish => {
        const imageUrl = getDishImage(dish.name);
        const isAvailable = dish.is_available !== false;

        return `
            <article class="dish-card bg-white dark:bg-slate-900 border border-cream-200/90 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                <div class="relative aspect-[16/10] overflow-hidden bg-cream-100 dark:bg-slate-800">
                    <img src="${imageUrl}" alt="${dish.name}" class="dish-card-img w-full h-full object-cover" loading="lazy">
                    <div class="absolute top-3 right-3">
                        ${isAvailable 
                            ? `<span class="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Available</span>`
                            : `<span class="bg-rose-500/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">Sold Out</span>`
                        }
                    </div>
                </div>

                <div class="p-6 flex flex-col flex-grow justify-between space-y-4">
                    <div class="space-y-2">
                        <div class="flex items-start justify-between gap-2">
                            <h3 class="font-extrabold text-forest-950 dark:text-white text-lg leading-snug">${dish.name}</h3>
                            <span class="font-bold text-terracotta-600 dark:text-terracotta-500 text-base whitespace-nowrap">${formatNaira(dish.price)}</span>
                        </div>
                        <p class="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">${dish.description || 'Crafted with fresh ingredients.'}</p>
                    </div>

                    <button onclick="addToCart(${dish.ID})" ${!isAvailable ? 'disabled' : ''} 
                            class="w-full bg-forest-900 hover:bg-forest-950 dark:bg-slate-800 dark:hover:bg-slate-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-cream-50 font-bold py-3 rounded-xl transition flex items-center justify-center space-x-2 text-xs">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        <span>${isAvailable ? 'Add to Order' : 'Currently Unavailable'}</span>
                    </button>
                </div>
            </article>
        `;
    }).join('');

    initLucideIcons();
}

// Cart Management
function addToCart(dishId) {
    const dish = state.menu.find(d => d.ID === dishId);
    if (!dish) return;

    const existingIndex = state.cart.findIndex(item => item.dishId === dishId);
    if (existingIndex > -1) {
        state.cart[existingIndex].quantity += 1;
    } else {
        state.cart.push({ dishId, dish, quantity: 1 });
    }

    updateCartUI();
    if (state.cart.reduce((acc, i) => acc + i.quantity, 0) === 1) {
        document.getElementById('cart-toggle-btn')?.click();
    }
}

function updateCartQuantity(dishId, change) {
    const index = state.cart.findIndex(item => item.dishId === dishId);
    if (index === -1) return;

    state.cart[index].quantity += change;
    if (state.cart[index].quantity <= 0) {
        state.cart.splice(index, 1);
    }
    updateCartUI();
}

function updateCartUI() {
    const badge = document.getElementById('cart-badge');
    const container = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('cart-subtotal');
    const totalEl = document.getElementById('cart-total');

    const totalItems = state.cart.reduce((sum, item) => sum + item.quantity, 0);
    badge.innerText = totalItems;

    if (state.cart.length === 0) {
        container.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-center py-12 text-slate-400 space-y-3">
                <i data-lucide="shopping-bag" class="w-12 h-12 opacity-30"></i>
                <p class="font-bold text-slate-600 dark:text-slate-300 text-sm">Your cart is empty</p>
                <p class="text-xs max-w-xs">Explore our menu catalog and add items to place an order.</p>
            </div>
        `;
        subtotalEl.innerText = formatNaira(0);
        totalEl.innerText = formatNaira(0);
        initLucideIcons();
        return;
    }

    let grandTotal = 0;

    container.innerHTML = state.cart.map(item => {
        const itemTotal = item.dish.price * item.quantity;
        grandTotal += itemTotal;

        return `
            <div class="flex items-center justify-between p-3.5 bg-cream-50 dark:bg-slate-950 border border-cream-200 dark:border-slate-800 rounded-xl">
                <div class="space-y-0.5 max-w-[180px]">
                    <h4 class="font-bold text-slate-800 dark:text-slate-200 text-xs truncate">${item.dish.name}</h4>
                    <p class="text-[11px] text-terracotta-600 dark:text-terracotta-500 font-semibold">${formatNaira(item.dish.price)}</p>
                </div>
                
                <div class="flex items-center space-x-2">
                    <button onclick="updateCartQuantity(${item.dishId}, -1)" class="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs">-</button>
                    <span class="text-xs font-bold text-slate-800 dark:text-slate-200 min-w-[16px] text-center">${item.quantity}</span>
                    <button onclick="updateCartQuantity(${item.dishId}, 1)" class="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-bold text-xs">+</button>
                </div>
            </div>
        `;
    }).join('');

    subtotalEl.innerText = formatNaira(grandTotal);
    totalEl.innerText = formatNaira(grandTotal);
    initLucideIcons();
}

// Checkout Submission
async function handleCheckoutSubmit(e) {
    e.preventDefault();
    const alertEl = document.getElementById('checkout-alert');
    const submitBtn = document.getElementById('submit-order-btn');
    const customerNameInput = document.getElementById('checkout-customer-name');

    const customerName = customerNameInput.value.trim();
    if (!customerName) {
        showAlert(alertEl, 'Please provide your name to place the order.', 'error');
        return;
    }

    if (state.cart.length === 0) {
        showAlert(alertEl, 'Your cart is empty. Add a dish first.', 'error');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span>Processing Order...</span>`;
    showAlert(alertEl, '', 'hide');

    try {
        for (const item of state.cart) {
            const payload = {
                customer_name: customerName,
                dish_id: item.dishId,
                quantity: item.quantity
            };
            await API.createOrder(payload);
        }

        showAlert(alertEl, '🎉 Order placed successfully!', 'success');
        
        state.cart = [];
        updateCartUI();
        customerNameInput.value = '';
        loadOrders();

        setTimeout(() => {
            document.getElementById('close-cart-btn')?.click();
            showAlert(alertEl, '', 'hide');
        }, 2000);

    } catch (err) {
        console.error(err);
        showAlert(alertEl, err.message || 'Order creation failed.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `<span>Confirm & Place Order</span><i data-lucide="arrow-right" class="w-4 h-4"></i>`;
        initLucideIcons();
    }
}

// Render Orders Tracker
async function loadOrders() {
    const container = document.getElementById('orders-container');
    container.innerHTML = renderSkeletonCards(2);

    try {
        state.orders = await API.getOrders();
        renderOrders();
    } catch (err) {
        console.error(err);
        container.innerHTML = `
            <div class="col-span-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 p-4 rounded-xl text-center text-xs">
                ${getToken() ? 'Failed to load orders feed.' : 'Please click "Login" above to view protected orders.'}
            </div>
        `;
    }
}

function renderOrders() {
    const container = document.getElementById('orders-container');

    if (!state.orders || state.orders.length === 0) {
        container.innerHTML = `
            <div class="col-span-full bg-white dark:bg-slate-900 border border-cream-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400">
                <i data-lucide="clock" class="w-10 h-10 mx-auto mb-2 opacity-30"></i>
                <p class="font-bold text-slate-600 dark:text-slate-300 text-sm">No active orders found</p>
                <p class="text-xs">Placed orders will appear here in real time.</p>
            </div>
        `;
        initLucideIcons();
        return;
    }

    container.innerHTML = state.orders.slice().reverse().map(order => {
        const dishName = order.dish ? order.dish.name : `Dish #${order.dish_id}`;
        const unitPrice = order.dish ? order.dish.price : 0;
        const totalPrice = unitPrice * order.quantity;
        const status = order.status || 'Pending';

        return `
            <div class="bg-white dark:bg-slate-900 border border-cream-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div class="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order #${order.ID}</span>
                        <h4 class="font-extrabold text-forest-950 dark:text-white text-sm">${order.customer_name}</h4>
                    </div>
                    <span class="bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        ${status}
                    </span>
                </div>

                <div class="flex items-center justify-between text-xs">
                    <div>
                        <p class="font-bold text-slate-800 dark:text-slate-200">${dishName}</p>
                        <p class="text-slate-400 text-[11px]">Quantity: ${order.quantity}</p>
                    </div>
                    <p class="font-bold text-forest-900 dark:text-terracotta-500 text-sm">${totalPrice > 0 ? formatNaira(totalPrice) : 'N/A'}</p>
                </div>
            </div>
        `;
    }).join('');

    initLucideIcons();
}

// Add Dish Form Handler
async function handleAddDishSubmit(e) {
    e.preventDefault();
    const alertEl = document.getElementById('dish-modal-alert');
    const saveBtn = document.getElementById('save-dish-btn');

    const payload = {
        name: document.getElementById('new-dish-name').value.trim(),
        description: document.getElementById('new-dish-desc').value.trim(),
        price: parseFloat(document.getElementById('new-dish-price').value),
        is_available: document.getElementById('new-dish-available').checked
    };

    saveBtn.disabled = true;
    try {
        await API.createDish(payload);
        showAlert(alertEl, 'Dish successfully saved to SQLite database!', 'success');
        document.getElementById('add-dish-form').reset();
        loadMenu();

        setTimeout(() => {
            document.getElementById('close-dish-modal-btn')?.click();
            showAlert(alertEl, '', 'hide');
        }, 1500);
    } catch (err) {
        showAlert(alertEl, err.message || 'Failed to create dish.', 'error');
    } finally {
        saveBtn.disabled = false;
    }
}

// Utility Helpers
function showAlert(el, msg, type) {
    if (type === 'hide') {
        el.classList.add('hidden');
        return;
    }
    el.classList.remove('hidden', 'bg-red-50', 'text-red-700', 'bg-emerald-50', 'text-emerald-700', 'dark:bg-red-950/50', 'dark:text-red-300', 'dark:bg-emerald-950/50', 'dark:text-emerald-300');
    if (type === 'error') {
        el.classList.add('bg-red-50', 'text-red-700', 'dark:bg-red-950/50', 'dark:text-red-300');
    } else {
        el.classList.add('bg-emerald-50', 'text-emerald-700', 'dark:bg-emerald-950/50', 'dark:text-emerald-300');
    }
    el.innerText = msg;
}

function renderSkeletonCards(count) {
    return Array(count).fill(0).map(() => `
        <div class="bg-white dark:bg-slate-900 border border-cream-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 animate-skeleton">
            <div class="h-32 rounded-xl bg-cream-200/60 dark:bg-slate-800"></div>
            <div class="h-4 w-2/3 bg-cream-200/80 dark:bg-slate-800 rounded"></div>
            <div class="h-3 w-full bg-cream-200/50 dark:bg-slate-800 rounded"></div>
        </div>
    `).join('');
}