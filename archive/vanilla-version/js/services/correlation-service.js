/**
 * Correlation Service
 * Automatically detects relationships between features based on similarity
 *
 * Purpose: Find correlated features using text analysis, keyword overlap, and category similarity
 * Integration: Works with Supabase feature_correlations table
 */

const correlationService = {
    /**
     * Correlation types
     */
    CORRELATION_TYPES: {
        high_similarity: { label: 'High Similarity', icon: '🔄', description: 'Very similar features (potential duplicates)' },
        complementary: { label: 'Complementary', icon: '🤝', description: 'Features that work well together' },
        sequential: { label: 'Sequential', icon: '➡️', description: 'Features that follow each other' },
        thematic: { label: 'Thematic', icon: '🎨', description: 'Share same theme/domain' },
        technical: { label: 'Technical', icon: '⚙️', description: 'Share technical requirements' },
        functional: { label: 'Functional', icon: '🎯', description: 'Share functional area' }
    },

    /**
     * Detect correlations for a single feature
     * @param {String} featureId - Feature ID
     * @param {Array} features - All features
     * @param {Number} minThreshold - Minimum correlation score (0-1)
     * @returns {Promise<Array>} Detected correlations
     */
    async detectFeatureCorrelations(featureId, features, minThreshold = 0.3) {
        const targetFeature = features.find(f => f.id === featureId);
        if (!targetFeature) {
            throw new Error(`Feature not found: ${featureId}`);
        }

        // Get candidate features from same workspace
        const candidates = features.filter(f =>
            f.workspaceId === targetFeature.workspaceId &&
            f.id !== featureId
        );

        const correlations = [];

        for (const candidate of candidates) {
            const correlation = this.calculateCorrelation(targetFeature, candidate);

            if (correlation.score >= minThreshold) {
                correlations.push({
                    featureAId: targetFeature.id,
                    featureBId: candidate.id,
                    correlationScore: correlation.score,
                    cosineSimilarity: correlation.textSimilarity,
                    keywordOverlapScore: correlation.keywordOverlap,
                    categorySimilarity: correlation.categorySimilarity,
                    correlationType: this.inferCorrelationType(correlation),
                    commonKeywords: correlation.commonKeywords,
                    commonCategories: correlation.commonCategories,
                    confidence: correlation.score,
                    relevance: correlation.score
                });
            }
        }

        // Sort by score
        correlations.sort((a, b) => b.correlationScore - a.correlationScore);

        return correlations;
    },

    /**
     * Calculate correlation between two features
     * @param {Object} featureA - First feature
     * @param {Object} featureB - Second feature
     * @returns {Object} Correlation metrics
     */
    calculateCorrelation(featureA, featureB) {
        // Calculate text similarity
        const textSimilarity = this.calculateTextSimilarity(featureA, featureB);

        // Calculate keyword overlap
        const keywordAnalysis = this.calculateKeywordOverlap(featureA, featureB);

        // Calculate category similarity
        const categorySimilarity = this.calculateCategorySimilarity(featureA, featureB);

        // Calculate overall score (weighted average)
        const score = (textSimilarity * 0.5) + (keywordAnalysis.score * 0.3) + (categorySimilarity * 0.2);

        return {
            score: Math.round(score * 10000) / 10000,
            textSimilarity: Math.round(textSimilarity * 10000) / 10000,
            keywordOverlap: Math.round(keywordAnalysis.score * 10000) / 10000,
            categorySimilarity: Math.round(categorySimilarity * 10000) / 10000,
            commonKeywords: keywordAnalysis.common,
            commonCategories: this.getCommonCategories(featureA, featureB)
        };
    },

    /**
     * Calculate text similarity using Jaccard coefficient
     * @param {Object} featureA - First feature
     * @param {Object} featureB - Second feature
     * @returns {Number} Similarity score (0-1)
     */
    calculateTextSimilarity(featureA, featureB) {
        // Combine name and purpose for each feature
        const textA = `${featureA.name} ${featureA.purpose || ''}`.toLowerCase();
        const textB = `${featureB.name} ${featureB.purpose || ''}`.toLowerCase();

        // Tokenize into words
        const wordsA = this.tokenize(textA);
        const wordsB = this.tokenize(textB);

        // Remove stop words
        const cleanWordsA = this.removeStopWords(wordsA);
        const cleanWordsB = this.removeStopWords(wordsB);

        // Calculate Jaccard similarity
        const setA = new Set(cleanWordsA);
        const setB = new Set(cleanWordsB);

        const intersection = new Set([...setA].filter(x => setB.has(x)));
        const union = new Set([...setA, ...setB]);

        if (union.size === 0) return 0;

        return intersection.size / union.size;
    },

    /**
     * Calculate keyword overlap
     * @param {Object} featureA - First feature
     * @param {Object} featureB - Second feature
     * @returns {Object} Overlap score and common keywords
     */
    calculateKeywordOverlap(featureA, featureB) {
        // Extract keywords from name and purpose
        const keywordsA = this.extractKeywords(featureA);
        const keywordsB = this.extractKeywords(featureB);

        const setA = new Set(keywordsA);
        const setB = new Set(keywordsB);

        const common = [...setA].filter(x => setB.has(x));
        const union = new Set([...setA, ...setB]);

        const score = union.size > 0 ? common.length / union.size : 0;

        return {
            score,
            common
        };
    },

    /**
     * Calculate category similarity
     * @param {Object} featureA - First feature
     * @param {Object} featureB - Second feature
     * @returns {Number} Similarity score (0-1)
     */
    calculateCategorySimilarity(featureA, featureB) {
        const categoriesA = this.getCategories(featureA);
        const categoriesB = this.getCategories(featureB);

        if (categoriesA.length === 0 && categoriesB.length === 0) return 0;

        const setA = new Set(categoriesA);
        const setB = new Set(categoriesB);

        const common = [...setA].filter(x => setB.has(x));
        const maxLength = Math.max(categoriesA.length, categoriesB.length);

        return maxLength > 0 ? common.length / maxLength : 0;
    },

    /**
     * Get categories from a feature
     * @param {Object} feature - Feature
     * @returns {Array} Categories
     */
    getCategories(feature) {
        const categories = new Set();

        if (feature.timelineItems) {
            feature.timelineItems.forEach(item => {
                if (item.category && Array.isArray(item.category)) {
                    item.category.forEach(cat => categories.add(cat.toLowerCase()));
                }
            });
        }

        return [...categories];
    },

    /**
     * Get common categories between two features
     * @param {Object} featureA - First feature
     * @param {Object} featureB - Second feature
     * @returns {Array} Common categories
     */
    getCommonCategories(featureA, featureB) {
        const categoriesA = this.getCategories(featureA);
        const categoriesB = this.getCategories(featureB);

        const setA = new Set(categoriesA);
        const setB = new Set(categoriesB);

        return [...setA].filter(x => setB.has(x));
    },

    /**
     * Tokenize text into words
     * @param {String} text - Text to tokenize
     * @returns {Array} Words
     */
    tokenize(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => word.length > 0);
    },

    /**
     * Extract keywords from feature
     * @param {Object} feature - Feature
     * @returns {Array} Keywords
     */
    extractKeywords(feature) {
        const text = `${feature.name} ${feature.purpose || ''}`.toLowerCase();
        const words = this.tokenize(text);
        const cleanWords = this.removeStopWords(words);

        // Filter to significant words (length >= 3)
        return [...new Set(cleanWords.filter(w => w.length >= 3))];
    },

    /**
     * Remove common stop words
     * @param {Array} words - Words array
     * @returns {Array} Filtered words
     */
    removeStopWords(words) {
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
            'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should',
            'could', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'it',
            'its', 'they', 'them', 'their', 'we', 'our', 'you', 'your'
        ]);

        return words.filter(word => !stopWords.has(word) && word.length > 2);
    },

    /**
     * Infer correlation type based on metrics
     * @param {Object} correlation - Correlation metrics
     * @returns {String} Correlation type
     */
    inferCorrelationType(correlation) {
        if (correlation.score >= 0.8) {
            return 'high_similarity';
        } else if (correlation.categorySimilarity >= 0.6) {
            return 'thematic';
        } else if (correlation.keywordOverlap >= 0.5) {
            return 'functional';
        } else if (correlation.textSimilarity >= 0.4) {
            return 'complementary';
        }

        return 'thematic';
    },

    /**
     * Detect correlations for entire workspace
     * @param {String} workspaceId - Workspace ID
     * @param {Array} features - All features
     * @param {Number} minThreshold - Minimum correlation score
     * @returns {Promise<Array>} All detected correlations
     */
    async detectWorkspaceCorrelations(workspaceId, features, minThreshold = 0.3) {
        const workspaceFeatures = features.filter(f => f.workspaceId === workspaceId);
        const allCorrelations = [];

        for (let i = 0; i < workspaceFeatures.length; i++) {
            const correlations = await this.detectFeatureCorrelations(
                workspaceFeatures[i].id,
                features,
                minThreshold
            );

            // Add to collection (avoiding duplicates)
            for (const corr of correlations) {
                const exists = allCorrelations.some(existing =>
                    (existing.featureAId === corr.featureAId && existing.featureBId === corr.featureBId) ||
                    (existing.featureAId === corr.featureBId && existing.featureBId === corr.featureAId)
                );

                if (!exists) {
                    allCorrelations.push(corr);
                }
            }
        }

        // Save to database
        await this.saveCorrelations(allCorrelations, workspaceId);

        console.log(`✅ Detected ${allCorrelations.length} correlations for workspace ${workspaceId}`);

        return allCorrelations;
    },

    /**
     * Save correlations to database
     * @param {Array} correlations - Correlations to save
     * @param {String} workspaceId - Workspace ID
     */
    async saveCorrelations(correlations, workspaceId) {
        if (typeof supabaseService === 'undefined' || !supabaseService.isConnected) {
            return;
        }

        try {
            const records = correlations.map(corr => ({
                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                workspace_id: workspaceId,
                user_id: 'default',
                feature_a_id: corr.featureAId < corr.featureBId ? corr.featureAId : corr.featureBId,
                feature_b_id: corr.featureAId < corr.featureBId ? corr.featureBId : corr.featureAId,
                correlation_score: corr.correlationScore,
                cosine_similarity: corr.cosineSimilarity,
                keyword_overlap_score: corr.keywordOverlapScore,
                category_similarity: corr.categorySimilarity,
                correlation_type: corr.correlationType,
                common_keywords: corr.commonKeywords,
                common_categories: corr.commonCategories,
                confidence: corr.confidence,
                relevance: corr.relevance,
                detection_method: 'tfidf_cosine',
                status: 'detected',
                detected_at: new Date().toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }));

            const { error } = await supabaseService.client
                .from('feature_correlations')
                .upsert(records, {
                    onConflict: 'feature_a_id,feature_b_id'
                });

            if (error) throw error;

            console.log(`✅ Saved ${records.length} correlations to database`);
        } catch (error) {
            console.error('❌ Error saving correlations:', error);
        }
    },

    /**
     * Get correlations for a feature
     * @param {String} featureId - Feature ID
     * @param {Number} minScore - Minimum correlation score
     * @returns {Promise<Array>} Correlations
     */
    async getFeatureCorrelations(featureId, minScore = 0.3) {
        if (typeof supabaseService === 'undefined' || !supabaseService.isConnected) {
            return [];
        }

        try {
            const { data, error } = await supabaseService.client
                .from('feature_correlations')
                .select('*')
                .or(`feature_a_id.eq.${featureId},feature_b_id.eq.${featureId}`)
                .gte('correlation_score', minScore)
                .in('status', ['detected', 'reviewed', 'accepted'])
                .order('correlation_score', { ascending: false });

            if (error) throw error;

            return data.map(corr => this.mapFromDatabase(corr, featureId));
        } catch (error) {
            console.error('❌ Error fetching correlations:', error);
            return [];
        }
    },

    /**
     * Map database record to application format
     * @param {Object} dbRecord - Database record
     * @param {String} perspectiveFeatureId - Feature ID to get correlations for
     * @returns {Object} Application format
     */
    mapFromDatabase(dbRecord, perspectiveFeatureId) {
        const correlatedFeatureId = dbRecord.feature_a_id === perspectiveFeatureId
            ? dbRecord.feature_b_id
            : dbRecord.feature_a_id;

        return {
            id: dbRecord.id,
            featureId: perspectiveFeatureId,
            correlatedFeatureId,
            correlationScore: dbRecord.correlation_score,
            cosineSimilarity: dbRecord.cosine_similarity,
            keywordOverlapScore: dbRecord.keyword_overlap_score,
            categorySimilarity: dbRecord.category_similarity,
            correlationType: dbRecord.correlation_type,
            commonKeywords: dbRecord.common_keywords || [],
            commonCategories: dbRecord.common_categories || [],
            confidence: dbRecord.confidence,
            status: dbRecord.status,
            detectedAt: dbRecord.detected_at
        };
    },

    /**
     * Update correlation status
     * @param {String} correlationId - Correlation ID
     * @param {String} status - New status
     */
    async updateStatus(correlationId, status) {
        if (typeof supabaseService === 'undefined' || !supabaseService.isConnected) {
            return;
        }

        try {
            await supabaseService.client
                .from('feature_correlations')
                .update({
                    status,
                    user_reviewed: true,
                    reviewed_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', correlationId);
        } catch (error) {
            console.error('❌ Error updating correlation status:', error);
        }
    }
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = correlationService;
}
