// Initialize Supabase client (will be set when init is called)
let supabase = null;

const supabaseService = {
            isConnected: false,
            userId: null,
            subscriptions: [],

            // Initialize and get/create anonymous user ID
            async init() {
                try {
                    // Use a shared 'default' user ID so all browsers see the same data
                    // Perfect for personal roadmap manager - your data syncs everywhere!
                    this.userId = DEFAULT_USER_ID;
                    console.log('✅ Using shared user ID for cross-browser sync:', this.userId);

                    // Test connection
                    const { error } = await supabase.from('features').select('count', { count: 'exact', head: true });
                    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows, which is fine
                        throw error;
                    }

                    this.isConnected = true;
                    console.log('✅ Supabase connected successfully');
                    return true;
                } catch (error) {
                    console.warn('⚠️ Supabase connection failed:', error.message);
                    this.isConnected = false;
                    return false;
                }
            },

            // Generate unique ID
            generateId() {
                return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
            },

            // Set user ID for RLS policies (fallback to client-side filtering)
            async setUserId() {
                // Skip RPC call entirely since it's causing 404 errors
                // We'll use client-side filtering instead
                console.log('ℹ️ Using client-side filtering for database queries');
            },

            // Load features from Supabase
            async loadFeatures() {
                if (!this.isConnected) return null;

                try {
                    await this.setUserId();

                    // Load features with all new tracking fields
                    const { data: features, error: featuresError } = await supabase
                        .from('features')
                        .select('*')
                        .eq('user_id', this.userId)
                        .order('created_at', { ascending: false });

                    if (featuresError) throw featuresError;

                    if (!features || features.length === 0) {
                        console.log('ℹ️ No features found in cloud');
                        return [];
                    }

                    // Load all related data in parallel for better performance
                    const [
                        { data: timelineItems },
                        { data: linkedItems },
                        { data: executionSteps },
                        { data: featureResources },
                        { data: milestones },
                        { data: risks },
                        { data: prerequisites },
                        { data: inspirationItems }
                    ] = await Promise.all([
                        supabase.from('timeline_items').select('*').eq('user_id', this.userId),
                        supabase.from('linked_items').select('*').eq('user_id', this.userId),
                        supabase.from('execution_steps').select('*').eq('user_id', this.userId),
                        supabase.from('feature_resources').select('*').eq('user_id', this.userId),
                        supabase.from('milestones').select('*').eq('user_id', this.userId),
                        supabase.from('risks').select('*').eq('user_id', this.userId),
                        supabase.from('prerequisites').select('*').eq('user_id', this.userId),
                        supabase.from('inspiration_items').select('*').eq('user_id', this.userId)
                    ]);

                    // Combine data structure to match app format
                    const combinedFeatures = features.map(feature => {
                        // Get timeline items for this feature
                        const items = (timelineItems || []).filter(item => item.feature_id === feature.id);

                        // Add linked items to each timeline item
                        const itemsWithLinks = items.map(item => {
                            const links = (linkedItems || [])
                                .filter(link => link.source_item_id === item.id || link.target_item_id === item.id)
                                .map(link => ({
                                    linkedItemId: link.target_item_id === item.id ? link.source_item_id : link.target_item_id,
                                    linkedFeatureId: '',
                                    relationshipType: link.relationship_type,
                                    reason: link.reason,
                                    direction: link.source_item_id === item.id ? 'outgoing' : 'incoming'
                                }));

                            return {
                                id: item.id,
                                timeline: item.timeline,
                                difficulty: item.difficulty,
                                usp: item.usp,
                                integrationType: item.integration_type,
                                category: item.category || [],
                                linkedItems: links.length > 0 ? links : undefined,
                                createdAt: item.created_at
                            };
                        });

                        // Get execution steps for this feature
                        const steps = (executionSteps || [])
                            .filter(step => step.feature_id === feature.id)
                            .sort((a, b) => a.step_order - b.step_order)
                            .map(step => ({
                                id: step.id,
                                order: step.step_order,
                                title: step.title,
                                description: step.description,
                                estimatedHours: step.estimated_hours,
                                actualHours: step.actual_hours,
                                status: step.status,
                                assignee: step.assignee,
                                startDate: step.start_date,
                                completedDate: step.completed_date,
                                blockedBy: step.blocked_by,
                                dependencies: step.dependencies || [],
                                checklistItems: step.checklist_items || [],
                                completed: step.completed
                            }));

                        // Get resources for this feature
                        const resourcesData = (featureResources || []).find(r => r.feature_id === feature.id);
                        const resources = resourcesData ? {
                            teamRoles: resourcesData.team_roles || [],
                            technologies: resourcesData.technologies || [],
                            estimatedBudget: resourcesData.estimated_budget,
                            actualBudget: resourcesData.actual_budget,
                            currency: resourcesData.currency,
                            estimatedHours: resourcesData.estimated_hours,
                            actualHours: resourcesData.actual_hours,
                            externalDependencies: resourcesData.external_dependencies || [],
                            apiRequirements: resourcesData.api_requirements || [],
                            infrastructureNeeds: resourcesData.infrastructure_needs || []
                        } : {};

                        // Get planning data for this feature
                        const planning = {
                            milestones: (milestones || [])
                                .filter(m => m.feature_id === feature.id)
                                .map(m => ({
                                    id: m.id,
                                    name: m.name,
                                    description: m.description,
                                    targetDate: m.target_date,
                                    actualDate: m.actual_date,
                                    status: m.status,
                                    owner: m.owner,
                                    dependencies: m.dependencies || [],
                                    criteria: m.criteria || [],
                                    progressPercent: m.progress_percent,
                                    criticalPath: m.critical_path
                                })),
                            risks: (risks || [])
                                .filter(r => r.feature_id === feature.id)
                                .map(r => ({
                                    id: r.id,
                                    description: r.description,
                                    mitigation: r.mitigation,
                                    severity: r.severity,
                                    probability: r.probability,
                                    riskScore: r.risk_score,
                                    status: r.status,
                                    owner: r.owner,
                                    category: r.category,
                                    identifiedDate: r.identified_date,
                                    reviewDate: r.review_date
                                })),
                            prerequisites: (prerequisites || [])
                                .filter(p => p.feature_id === feature.id)
                                .sort((a, b) => a.display_order - b.display_order)
                                .map(p => p.prerequisite_text || p.text || p)
                        };

                        // Get inspiration items for this feature
                        const inspiration = (inspirationItems || [])
                            .filter(i => i.feature_id === feature.id)
                            .sort((a, b) => a.display_order - b.display_order)
                            .map(i => ({
                                id: i.id,
                                title: i.title,
                                url: i.url,
                                description: i.description,
                                type: i.type,
                                imageUrl: i.image_url,
                                relevanceScore: i.relevance_score,
                                notes: i.notes,
                                tags: i.tags || []
                            }));

                        return {
                            id: feature.id,
                            name: feature.name,
                            type: feature.type,
                            purpose: feature.purpose,
                            workspaceId: feature.workspace_id,

                            // Core tracking fields
                            status: feature.status || 'not_started',
                            priority: feature.priority || 'medium',
                            health: feature.health || 'on_track',

                            // Ownership
                            owner: feature.owner,
                            contributors: feature.contributors || [],
                            stakeholders: feature.stakeholders || [],

                            // Timeline
                            plannedStartDate: feature.planned_start_date,
                            actualStartDate: feature.actual_start_date,
                            plannedEndDate: feature.planned_end_date,
                            actualEndDate: feature.actual_end_date,
                            targetRelease: feature.target_release,

                            // Effort
                            storyPoints: feature.story_points,
                            estimatedHours: feature.estimated_hours,
                            actualHours: feature.actual_hours,
                            effortConfidence: feature.effort_confidence || 'medium',

                            // Progress
                            progressPercent: feature.progress_percent || 0,
                            completedSteps: feature.completed_steps || 0,
                            totalSteps: feature.total_steps || 0,

                            // Business value
                            businessValue: feature.business_value || 'medium',
                            customerImpact: feature.customer_impact,
                            strategicAlignment: feature.strategic_alignment,
                            successMetrics: feature.success_metrics || [],

                            // Acceptance
                            acceptanceCriteria: feature.acceptance_criteria || [],
                            definitionOfDone: feature.definition_of_done || [],

                            // Blockers
                            blockers: feature.blockers || [],
                            isBlocked: feature.is_blocked || false,

                            // Categorization
                            tags: feature.tags || [],
                            category: feature.category,

                            // AI metadata
                            aiGenerated: feature.ai_generated,
                            aiCreated: feature.ai_created,
                            aiModified: feature.ai_modified,

                            // Nested data
                            timelineItems: itemsWithLinks,
                            executionSteps: steps,
                            resources: resources,
                            planning: planning,
                            inspiration: inspiration,

                            // Metadata
                            createdAt: feature.created_at,
                            updatedAt: feature.updated_at,
                            createdBy: feature.created_by,
                            lastModifiedBy: feature.last_modified_by,
                            lastViewedAt: feature.last_viewed_at
                        };
                    });

                    console.log(`✅ Loaded ${combinedFeatures.length} features from Supabase (with all related data)`);
                    return combinedFeatures;
                } catch (error) {
                    console.error('❌ Error loading from Supabase:', error);
                    return null;
                }
            },

            // Save all features to Supabase (with all related data)
            async syncFeatures(features) {
                if (!this.isConnected) {
                    console.log('ℹ️ Supabase not connected, ensuring localStorage is current');
                    return true;
                }

                try {
                    await this.setUserId();

                    // Delete all existing data for this user (full sync approach)
                    await Promise.all([
                        supabase.from('features').delete().eq('user_id', this.userId),
                        supabase.from('timeline_items').delete().eq('user_id', this.userId),
                        supabase.from('linked_items').delete().eq('user_id', this.userId),
                        supabase.from('execution_steps').delete().eq('user_id', this.userId),
                        supabase.from('feature_resources').delete().eq('user_id', this.userId),
                        supabase.from('milestones').delete().eq('user_id', this.userId),
                        supabase.from('risks').delete().eq('user_id', this.userId),
                        supabase.from('prerequisites').delete().eq('user_id', this.userId),
                        supabase.from('inspiration_items').delete().eq('user_id', this.userId)
                    ]);

                    if (features.length === 0) {
                        console.log('✅ Synced 0 features to Supabase');
                        return true;
                    }

                    // Prepare all data for batch insert
                    const featuresData = [];
                    const timelineItemsData = [];
                    const linkedItemsData = [];
                    const executionStepsData = [];
                    const featureResourcesData = [];
                    const milestonesData = [];
                    const risksData = [];
                    const prerequisitesData = [];
                    const inspirationItemsData = [];

                    features.forEach(feature => {
                        // Feature main data with all new tracking fields
                        featuresData.push({
                            id: feature.id,
                            user_id: this.userId,
                            workspace_id: feature.workspaceId || null,
                            name: feature.name,
                            type: feature.type,
                            purpose: feature.purpose,

                            // Core tracking
                            status: feature.status || 'not_started',
                            priority: feature.priority || 'medium',
                            health: feature.health || 'on_track',

                            // Ownership
                            owner: feature.owner || null,
                            contributors: feature.contributors || [],
                            stakeholders: feature.stakeholders || [],

                            // Timeline
                            planned_start_date: feature.plannedStartDate || null,
                            actual_start_date: feature.actualStartDate || null,
                            planned_end_date: feature.plannedEndDate || null,
                            actual_end_date: feature.actualEndDate || null,
                            target_release: feature.targetRelease || null,

                            // Effort
                            story_points: feature.storyPoints || null,
                            estimated_hours: feature.estimatedHours || null,
                            actual_hours: feature.actualHours || null,
                            effort_confidence: feature.effortConfidence || 'medium',

                            // Progress
                            progress_percent: feature.progressPercent || 0,
                            completed_steps: feature.completedSteps || 0,
                            total_steps: feature.totalSteps || 0,

                            // Business value
                            business_value: feature.businessValue || 'medium',
                            customer_impact: feature.customerImpact || null,
                            strategic_alignment: feature.strategicAlignment || null,
                            success_metrics: feature.successMetrics || [],

                            // Acceptance
                            acceptance_criteria: feature.acceptanceCriteria || [],
                            definition_of_done: feature.definitionOfDone || [],

                            // Blockers
                            blockers: feature.blockers || [],
                            is_blocked: feature.isBlocked || false,

                            // Categorization
                            tags: feature.tags || [],
                            category: feature.category || null,

                            // AI
                            ai_generated: feature.aiGenerated || null,
                            ai_created: feature.aiCreated || false,
                            ai_modified: feature.aiModified || false,

                            // Metadata
                            created_at: feature.createdAt || new Date().toISOString(),
                            updated_at: feature.updatedAt || new Date().toISOString(),
                            created_by: feature.createdBy || null,
                            last_modified_by: feature.lastModifiedBy || null,
                            last_viewed_at: feature.lastViewedAt || null
                        });

                        // Timeline items
                        if (feature.timelineItems && feature.timelineItems.length > 0) {
                            feature.timelineItems.forEach(item => {
                                timelineItemsData.push({
                                    id: item.id,
                                    feature_id: feature.id,
                                    user_id: this.userId,
                                    workspace_id: feature.workspaceId || null,
                                    timeline: item.timeline,
                                    difficulty: item.difficulty,
                                    usp: item.usp || null,
                                    integration_type: item.integrationType || null,
                                    category: item.category || [],
                                    created_at: item.createdAt || new Date().toISOString()
                                });

                                // Linked items
                                if (item.linkedItems && item.linkedItems.length > 0) {
                                    item.linkedItems.forEach(link => {
                                        linkedItemsData.push({
                                            user_id: this.userId,
                                            workspace_id: feature.workspaceId || null,
                                            source_item_id: link.direction === 'outgoing' ? item.id : link.linkedItemId,
                                            target_item_id: link.direction === 'outgoing' ? link.linkedItemId : item.id,
                                            relationship_type: link.relationshipType,
                                            reason: link.reason || null,
                                            direction: link.direction
                                        });
                                    });
                                }
                            });
                        }

                        // Execution steps
                        if (feature.executionSteps && feature.executionSteps.length > 0) {
                            feature.executionSteps.forEach((step, index) => {
                                executionStepsData.push({
                                    id: step.id,
                                    feature_id: feature.id,
                                    user_id: this.userId,
                                    workspace_id: feature.workspaceId || null,
                                    step_order: step.order !== undefined ? step.order : index,
                                    title: step.title,
                                    description: step.description || null,
                                    estimated_hours: step.estimatedHours || null,
                                    actual_hours: step.actualHours || null,
                                    status: step.status || 'not_started',
                                    assignee: step.assignee || null,
                                    start_date: step.startDate || null,
                                    completed_date: step.completedDate || null,
                                    blocked_by: step.blockedBy || null,
                                    dependencies: step.dependencies || [],
                                    checklist_items: step.checklistItems || [],
                                    completed: step.completed || false
                                });
                            });
                        }

                        // Resources
                        if (feature.resources && Object.keys(feature.resources).length > 0) {
                            featureResourcesData.push({
                                id: `${feature.id}_resources`,
                                feature_id: feature.id,
                                user_id: this.userId,
                                workspace_id: feature.workspaceId || null,
                                team_roles: feature.resources.teamRoles || [],
                                technologies: feature.resources.technologies || [],
                                estimated_budget: feature.resources.estimatedBudget || null,
                                actual_budget: feature.resources.actualBudget || null,
                                currency: feature.resources.currency || 'USD',
                                estimated_hours: feature.resources.estimatedHours || null,
                                actual_hours: feature.resources.actualHours || null,
                                external_dependencies: feature.resources.externalDependencies || [],
                                api_requirements: feature.resources.apiRequirements || [],
                                infrastructure_needs: feature.resources.infrastructureNeeds || []
                            });
                        }

                        // Planning - Milestones
                        if (feature.planning && feature.planning.milestones && feature.planning.milestones.length > 0) {
                            feature.planning.milestones.forEach(milestone => {
                                milestonesData.push({
                                    id: milestone.id,
                                    feature_id: feature.id,
                                    user_id: this.userId,
                                    workspace_id: feature.workspaceId || null,
                                    name: milestone.name,
                                    description: milestone.description || null,
                                    target_date: milestone.targetDate || null,
                                    actual_date: milestone.actualDate || null,
                                    status: milestone.status || 'not_started',
                                    owner: milestone.owner || null,
                                    dependencies: milestone.dependencies || [],
                                    criteria: milestone.criteria || [],
                                    progress_percent: milestone.progressPercent || 0,
                                    critical_path: milestone.criticalPath || false
                                });
                            });
                        }

                        // Planning - Risks
                        if (feature.planning && feature.planning.risks && feature.planning.risks.length > 0) {
                            feature.planning.risks.forEach(risk => {
                                risksData.push({
                                    id: risk.id,
                                    feature_id: feature.id,
                                    user_id: this.userId,
                                    workspace_id: feature.workspaceId || null,
                                    description: risk.description,
                                    mitigation: risk.mitigation || null,
                                    severity: risk.severity || 'medium',
                                    probability: risk.probability || 'possible',
                                    risk_score: risk.riskScore || null,
                                    status: risk.status || 'identified',
                                    owner: risk.owner || null,
                                    category: risk.category || 'technical',
                                    identified_date: risk.identifiedDate || new Date().toISOString().split('T')[0],
                                    review_date: risk.reviewDate || null
                                });
                            });
                        }

                        // Planning - Prerequisites
                        if (feature.planning && feature.planning.prerequisites) {
                            const prereqs = feature.planning.prerequisites;
                            prereqs.forEach((prereq, index) => {
                                if (typeof prereq === 'string') {
                                    // Old format - string array
                                    prerequisitesData.push({
                                        id: `${feature.id}_prereq_${index}`,
                                        feature_id: feature.id,
                                        user_id: this.userId,
                                        workspace_id: feature.workspaceId || null,
                                        prerequisite_text: prereq,
                                        category: 'technical',
                                        status: 'pending',
                                        display_order: index
                                    });
                                } else if (prereq && prereq.text) {
                                    // New format - object with text property
                                    prerequisitesData.push({
                                        id: prereq.id || `${feature.id}_prereq_${index}`,
                                        feature_id: feature.id,
                                        user_id: this.userId,
                                        workspace_id: feature.workspaceId || null,
                                        prerequisite_text: prereq.text,
                                        category: prereq.category || 'technical',
                                        status: prereq.status || 'pending',
                                        completion_date: prereq.completionDate || null,
                                        notes: prereq.notes || null,
                                        display_order: index
                                    });
                                }
                            });
                        }

                        // Inspiration
                        if (feature.inspiration && feature.inspiration.length > 0) {
                            feature.inspiration.forEach((item, index) => {
                                inspirationItemsData.push({
                                    id: item.id,
                                    feature_id: feature.id,
                                    user_id: this.userId,
                                    workspace_id: feature.workspaceId || null,
                                    title: item.title,
                                    url: item.url || null,
                                    description: item.description || null,
                                    type: item.type || 'reference',
                                    image_url: item.imageUrl || null,
                                    relevance_score: item.relevanceScore || null,
                                    notes: item.notes || null,
                                    tags: item.tags || [],
                                    display_order: index
                                });
                            });
                        }
                    });

                    // Batch insert all data in parallel
                    const insertPromises = [];

                    if (featuresData.length > 0) {
                        insertPromises.push(supabase.from('features').insert(featuresData));
                    }
                    if (timelineItemsData.length > 0) {
                        insertPromises.push(supabase.from('timeline_items').insert(timelineItemsData));
                    }
                    if (linkedItemsData.length > 0) {
                        // Deduplicate linked items
                        const uniqueLinks = linkedItemsData.filter((link, index, self) =>
                            index === self.findIndex(l =>
                                l.source_item_id === link.source_item_id &&
                                l.target_item_id === link.target_item_id
                            )
                        );
                        if (uniqueLinks.length > 0) {
                            insertPromises.push(supabase.from('linked_items').insert(uniqueLinks));
                        }
                    }
                    if (executionStepsData.length > 0) {
                        insertPromises.push(supabase.from('execution_steps').insert(executionStepsData));
                    }
                    if (featureResourcesData.length > 0) {
                        insertPromises.push(supabase.from('feature_resources').insert(featureResourcesData));
                    }
                    if (milestonesData.length > 0) {
                        insertPromises.push(supabase.from('milestones').insert(milestonesData));
                    }
                    if (risksData.length > 0) {
                        insertPromises.push(supabase.from('risks').insert(risksData));
                    }
                    if (prerequisitesData.length > 0) {
                        insertPromises.push(supabase.from('prerequisites').insert(prerequisitesData));
                    }
                    if (inspirationItemsData.length > 0) {
                        insertPromises.push(supabase.from('inspiration_items').insert(inspirationItemsData));
                    }

                    const results = await Promise.all(insertPromises);

                    // Check for errors
                    const errors = results.filter(r => r.error);
                    if (errors.length > 0) {
                        console.error('❌ Errors during sync:', errors);
                        throw new Error('Some data failed to sync');
                    }

                    console.log(`✅ Synced ${features.length} features to Supabase (with all related data)`);
                    console.log(`  - ${timelineItemsData.length} timeline items`);
                    console.log(`  - ${executionStepsData.length} execution steps`);
                    console.log(`  - ${milestonesData.length} milestones`);
                    console.log(`  - ${risksData.length} risks`);
                    console.log(`  - ${prerequisitesData.length} prerequisites`);
                    console.log(`  - ${inspirationItemsData.length} inspiration items`);

                    return true;
                } catch (error) {
                    console.error('❌ Error syncing to Supabase:', error);
                    return false;
                }
            },

            // Subscribe to real-time changes
            subscribeToChanges(callback) {
                if (!this.isConnected) return;

                // Subscribe to features changes
                const featuresChannel = supabase
                    .channel('features-changes')
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'features',
                        filter: `user_id=eq.${this.userId}`
                    }, async (payload) => {
                        console.log('🔄 Features changed:', payload);
                        const features = await this.loadFeatures();
                        if (features) callback(features);
                    })
                    .subscribe();

                this.subscriptions.push(featuresChannel);

                // Subscribe to timeline_items changes
                const itemsChannel = supabase
                    .channel('timeline-items-changes')
                    .on('postgres_changes', {
                        event: '*',
                        schema: 'public',
                        table: 'timeline_items',
                        filter: `user_id=eq.${this.userId}`
                    }, async (payload) => {
                        console.log('🔄 Timeline items changed:', payload);
                        const features = await this.loadFeatures();
                        if (features) callback(features);
                    })
                    .subscribe();

                this.subscriptions.push(itemsChannel);

                console.log('✅ Subscribed to real-time updates');
            },

            // Unsubscribe from all changes
            unsubscribeAll() {
                this.subscriptions.forEach(sub => {
                    supabase.removeChannel(sub);
                });
                this.subscriptions = [];
                console.log('✅ Unsubscribed from all real-time updates');
            },

            // Load all workspaces
            async loadWorkspaces() {
                if (!this.isConnected) return null;

                try {
                    await this.setUserId();

                    const { data: workspaces, error } = await supabase
                        .from('workspaces')
                        .select('*')
                        .eq('user_id', this.userId)
                        .order('created_at', { ascending: false });

                    if (error) throw error;

                    console.log(`✅ Loaded ${workspaces?.length || 0} workspaces from Supabase`);
                    return workspaces || [];
                } catch (error) {
                    console.error('❌ Error loading workspaces:', error);
                    return null;
                }
            },

            // Create a new workspace
            async createWorkspace(workspace) {
                if (!this.isConnected) return false;

                try {
                    await this.setUserId();

                    const workspaceData = {
                        id: workspace.id,
                        user_id: this.userId,
                        name: workspace.name,
                        description: workspace.description || null,
                        color: workspace.color || '#3b82f6',
                        icon: workspace.icon || '📊',
                        custom_instructions: workspace.customInstructions || null,
                        ai_memory: workspace.aiMemory || [],
                        created_at: workspace.createdAt || new Date().toISOString(),
                        updated_at: workspace.updatedAt || new Date().toISOString()
                    };

                    const { error } = await supabase
                        .from('workspaces')
                        .insert([workspaceData]);

                    if (error) throw error;

                    console.log('✅ Created workspace:', workspace.name);
                    return true;
                } catch (error) {
                    console.error('❌ Error creating workspace:', error);
                    return false;
                }
            },

            // Update a workspace
            async updateWorkspace(workspaceId, updates) {
                if (!this.isConnected) return false;

                try {
                    await this.setUserId();

                    const updateData = {
                        name: updates.name,
                        description: updates.description,
                        color: updates.color,
                        icon: updates.icon,
                        custom_instructions: updates.customInstructions,
                        ai_memory: updates.aiMemory,
                        updated_at: new Date().toISOString()
                    };

                    const { error } = await supabase
                        .from('workspaces')
                        .update(updateData)
                        .eq('id', workspaceId)
                        .eq('user_id', this.userId);

                    if (error) throw error;

                    console.log('✅ Updated workspace:', workspaceId);
                    return true;
                } catch (error) {
                    console.error('❌ Error updating workspace:', error);
                    return false;
                }
            },

            // Delete a workspace (cascade deletes features)
            async deleteWorkspace(workspaceId) {
                if (!this.isConnected) return false;

                try {
                    await this.setUserId();

                    // Delete all features in this workspace (cascade will handle timeline_items and linked_items)
                    await supabase
                        .from('features')
                        .delete()
                        .eq('workspace_id', workspaceId)
                        .eq('user_id', this.userId);

                    // Delete the workspace
                    const { error } = await supabase
                        .from('workspaces')
                        .delete()
                        .eq('id', workspaceId)
                        .eq('user_id', this.userId);

                    if (error) throw error;

                    console.log('✅ Deleted workspace:', workspaceId);
                    return true;
                } catch (error) {
                    console.error('❌ Error deleting workspace:', error);
                    return false;
                }
            },

            // Load features for a specific workspace
            async loadWorkspaceFeatures(workspaceId) {
                if (!this.isConnected) return null;

                try {
                    await this.setUserId();

                    // Load features for this workspace
                    const { data: features, error: featuresError } = await supabase
                        .from('features')
                        .select('*')
                        .eq('user_id', this.userId)
                        .eq('workspace_id', workspaceId)
                        .order('created_at', { ascending: false });

                    if (featuresError) throw featuresError;

                    if (!features || features.length === 0) {
                        console.log('ℹ️ No features found in workspace');
                        return [];
                    }

                    // Load timeline items for all features in workspace
                    const { data: timelineItems, error: itemsError } = await supabase
                        .from('timeline_items')
                        .select('*')
                        .eq('user_id', this.userId)
                        .eq('workspace_id', workspaceId);

                    if (itemsError) throw itemsError;

                    // Load linked items for workspace
                    const { data: linkedItems, error: linksError } = await supabase
                        .from('linked_items')
                        .select('*')
                        .eq('user_id', this.userId)
                        .eq('workspace_id', workspaceId);

                    if (linksError) throw linksError;

                    // Combine data structure to match app format
                    const combinedFeatures = features.map(feature => {
                        // Get timeline items for this feature
                        const items = timelineItems.filter(item => item.feature_id === feature.id);

                        // Add linked items to each timeline item
                        const itemsWithLinks = items.map(item => {
                            const links = linkedItems
                                .filter(link => link.source_item_id === item.id || link.target_item_id === item.id)
                                .map(link => ({
                                    linkedItemId: link.target_item_id === item.id ? link.source_item_id : link.target_item_id,
                                    linkedFeatureId: '', // Will be populated by app
                                    relationshipType: link.relationship_type,
                                    reason: link.reason,
                                    direction: link.source_item_id === item.id ? 'outgoing' : 'incoming'
                                }));

                            return {
                                id: item.id,
                                timeline: item.timeline,
                                difficulty: item.difficulty,
                                usp: item.usp,
                                integrationType: item.integration_type,
                                category: item.category || [],
                                linkedItems: links.length > 0 ? links : undefined,
                                createdAt: item.created_at
                            };
                        });

                        return {
                            id: feature.id,
                            name: feature.name,
                            type: feature.type,
                            purpose: feature.purpose,
                            workspaceId: feature.workspace_id,
                            aiGenerated: feature.ai_generated,
                            aiCreated: feature.ai_created,
                            aiModified: feature.ai_modified,
                            timelineItems: itemsWithLinks,
                            createdAt: feature.created_at,
                            updatedAt: feature.updated_at
                        };
                    });

                    console.log(`✅ Loaded ${combinedFeatures.length} features from workspace`);
                    return combinedFeatures;
                } catch (error) {
                    console.error('❌ Error loading workspace features:', error);
                    return null;
                }
            },

            // Get connection status
            getStatus() {
                return {
                    connected: this.isConnected,
                    userId: this.userId
                };
            }
};

// Initialize Supabase client
function initSupabase(supabaseClient) {
    supabase = supabaseClient;
}
