// Data Diagnostic Helper
// Run this in browser console: copy and paste, or load via <script> tag

function diagnoseDataState() {
    console.log('=== PLATFORM ROADMAP DATA DIAGNOSTIC ===\n');

    // Check localStorage
    const featuresRaw = localStorage.getItem('roadmapFeatures');
    const workspacesRaw = localStorage.getItem('workspaces');
    const currentWorkspaceId = localStorage.getItem('currentWorkspaceId');

    console.log('📦 LocalStorage Status:');
    console.log('  - Features data exists:', !!featuresRaw);
    console.log('  - Workspaces data exists:', !!workspacesRaw);
    console.log('  - Current workspace ID:', currentWorkspaceId);
    console.log('');

    // Parse features
    let features = [];
    if (featuresRaw) {
        try {
            features = JSON.parse(featuresRaw);
            console.log(`✅ Parsed ${features.length} total features from localStorage`);

            // Group by workspace
            const byWorkspace = {};
            features.forEach(f => {
                const wid = f.workspaceId || 'NO_WORKSPACE';
                if (!byWorkspace[wid]) byWorkspace[wid] = [];
                byWorkspace[wid].push(f);
            });

            console.log('\n📊 Features by Workspace:');
            Object.keys(byWorkspace).forEach(wid => {
                console.log(`  - ${wid}: ${byWorkspace[wid].length} features`);
            });

        } catch (e) {
            console.error('❌ Error parsing features:', e);
        }
    } else {
        console.log('⚠️ No features found in localStorage');
    }

    // Parse workspaces
    let workspaces = [];
    if (workspacesRaw) {
        try {
            workspaces = JSON.parse(workspacesRaw);
            console.log(`\n✅ Parsed ${workspaces.length} workspaces`);
            workspaces.forEach(w => {
                const featureCount = features.filter(f => f.workspaceId === w.id).length;
                console.log(`  - ${w.name} (${w.id}): ${featureCount} features`);
            });
        } catch (e) {
            console.error('❌ Error parsing workspaces:', e);
        }
    } else {
        console.log('\n⚠️ No workspaces found in localStorage');
    }

    // Check current workspace
    console.log('\n🎯 Current Workspace:');
    if (currentWorkspaceId) {
        const currentWorkspace = workspaces.find(w => w.id === currentWorkspaceId);
        if (currentWorkspace) {
            const currentFeatures = features.filter(f => f.workspaceId === currentWorkspaceId);
            console.log(`  - Name: ${currentWorkspace.name}`);
            console.log(`  - ID: ${currentWorkspaceId}`);
            console.log(`  - Features: ${currentFeatures.length}`);
        } else {
            console.log(`  ⚠️ Current workspace ID (${currentWorkspaceId}) not found in workspaces!`);
        }
    } else {
        console.log('  ⚠️ No current workspace set');
    }

    // Check Supabase connection
    console.log('\n🔌 Supabase Connection:');
    if (typeof supabaseService !== 'undefined') {
        console.log('  - Service loaded:', !!supabaseService);
        console.log('  - Is connected:', supabaseService.isConnected);
    } else {
        console.log('  ⚠️ Supabase service not loaded');
    }

    // Check app state
    console.log('\n🎮 App State:');
    if (typeof app !== 'undefined') {
        console.log('  - App loaded:', !!app);
        console.log('  - Current features:', app.features?.length || 0);
        console.log('  - Current workspace ID:', app.currentWorkspaceId);
        console.log('  - Workspaces:', app.workspaces?.length || 0);
    } else {
        console.log('  ⚠️ App not loaded');
    }

    console.log('\n=== DIAGNOSIS COMPLETE ===\n');

    // Return diagnostic data
    return {
        features,
        workspaces,
        currentWorkspaceId,
        summary: {
            totalFeatures: features.length,
            totalWorkspaces: workspaces.length,
            currentWorkspaceFeatures: features.filter(f => f.workspaceId === currentWorkspaceId).length,
            hasSupabaseService: typeof supabaseService !== 'undefined',
            hasApp: typeof app !== 'undefined'
        }
    };
}

// Auto-run on load
console.log('💡 Data diagnostic helper loaded. Run diagnoseDataState() to check your data.');
