const CART_KEY = 's22market_cart';

export let cart = [];

export function loadCart() {
    const saved = localStorage.getItem(CART_KEY);
    cart = saved ? JSON.parse(saved) : [];
    return cart;
}

export function saveCart() {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function addToCart(product, quantity = 1) {
    const existingIndex = cart.findIndex(item => item.id === product.id);
    if (existingIndex > -1) {
        cart[existingIndex].quantity += quantity;
    } else {
        cart.push({ ...product, quantity });
    }
    saveCart();
    return cart;
}

export function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    return cart;
}

export function clearCart() {
    cart = [];
    saveCart();
    return cart;
}

export function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

export function getCartCount() {
    return cart.reduce((count, item) => count + item.quantity, 0);
}
