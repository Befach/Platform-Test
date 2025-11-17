import { config } from 'dotenv';
import { Parallel } from 'parallel-web';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Initialize Parallel client with API key from environment
const client = new Parallel({
  apiKey: process.env.PARALLEL_API_KEY!
});

async function testParallelSearch() {
  try {
    console.log('🔍 Testing Parallel Search API...\n');

    // Test search query: Product roadmap UI/UX best practices
    const objective = 'Find best practices for product roadmap and mind mapping UI/UX design in 2025';
    const searchQueries = [
      'product roadmap UI design best practices 2025',
      'mind mapping UX patterns',
      'roadmap visualization techniques'
    ];

    console.log(`Objective: "${objective}"\n`);
    console.log(`Search Queries: ${searchQueries.join(', ')}\n`);
    console.log('Searching across multiple sources...\n');

    const results = await client.beta.search(
      {
        objective: objective,
        search_queries: searchQueries,
        max_results: 5,
        mode: 'one-shot',
        excerpts: {
          max_chars_per_result: 500
        }
      },
      {
        headers: {
          'parallel-beta': 'search-extract-2025-10-10'
        }
      }
    );

    console.log('✅ Search Results:\n');
    console.log('='.repeat(80));

    results.results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.title || 'No title'}`);
      console.log(`   URL: ${result.url}`);
      if (result.publish_date) {
        console.log(`   Published: ${result.publish_date}`);
      }
      if (result.excerpts && result.excerpts.length > 0) {
        console.log(`\n   Excerpts:`);
        result.excerpts.forEach((excerpt, i) => {
          console.log(`   ${i + 1}) ${excerpt}`);
        });
      }
      console.log('\n' + '-'.repeat(80));
    });

    console.log(`\n📊 Search ID: ${results.search_id}`);
    if (results.usage) {
      console.log(`\n💰 Usage:`);
      results.usage.forEach(item => {
        console.log(`   - ${item.name}: ${item.count}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
    if (error instanceof Error) {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

// Run the test
testParallelSearch();
