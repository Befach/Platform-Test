// Initialize Supabase client and services
// Note: This expects window.supabase, SUPABASE_URL, SUPABASE_ANON_KEY, supabaseService, and initSupabase to be loaded
function initializeApp() {
    if (!window.supabase) {
        console.error('❌ Supabase library not loaded. Make sure CDN script is included.');
        return false;
    }

    // Create Supabase client
    const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Initialize the service
    initSupabase(supabaseClient);

    console.log('✅ App modules initialized');
    return true;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
}
