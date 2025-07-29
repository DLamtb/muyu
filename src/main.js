// Main application entry point
import { UIController } from './modules/UIController.js';

console.log('佛经诵读应用已启动');

// Global application instance
let app = null;

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM 已加载完成');
    
    try {
        // Register Service Worker for PWA support
        await registerServiceWorker();
        
        // Initialize the main UI controller
        app = new UIController();
        
        // Make app globally accessible for debugging
        window.app = app;
        
        console.log('应用初始化完成');
        
    } catch (error) {
        console.error('应用初始化失败:', error);
        showInitializationError(error);
    }
});

// Register Service Worker
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        // New version available
                        showUpdateAvailable();
                    }
                });
            });
            
            console.log('Service Worker 注册成功:', registration.scope);
        } catch (error) {
            console.warn('Service Worker 注册失败:', error);
        }
    }
}

// Show update available notification
function showUpdateAvailable() {
    const updateBanner = document.createElement('div');
    updateBanner.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: var(--accent-color);
        color: white;
        padding: 1rem;
        text-align: center;
        z-index: 10001;
        font-size: 0.875rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    `;
    
    updateBanner.innerHTML = `
        <span>应用有新版本可用</span>
        <button onclick="location.reload()" style="
            background: white;
            color: var(--accent-color);
            border: none;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            margin-left: 1rem;
            cursor: pointer;
            font-size: 0.875rem;
            font-weight: 600;
        ">更新</button>
        <button onclick="this.parentElement.remove()" style="
            background: transparent;
            color: white;
            border: 1px solid white;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            margin-left: 0.5rem;
            cursor: pointer;
            font-size: 0.875rem;
        ">稍后</button>
    `;
    
    document.body.appendChild(updateBanner);
}

// Handle application cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (app) {
        app.dispose();
    }
});

// Show initialization error
function showInitializationError(error) {
    const errorMessage = document.createElement('div');
    errorMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #ff3b30;
        color: white;
        padding: 2rem;
        border-radius: 12px;
        text-align: center;
        z-index: 10000;
        max-width: 80%;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    `;
    
    errorMessage.innerHTML = `
        <h2 style="margin-bottom: 1rem;">应用初始化失败</h2>
        <p style="margin-bottom: 1rem;">${error.message}</p>
        <button onclick="location.reload()" style="
            background: white;
            color: #ff3b30;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
        ">重新加载</button>
    `;
    
    document.body.appendChild(errorMessage);
}

// Export for potential external use
export { app };