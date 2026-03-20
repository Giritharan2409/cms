import { insertSampleAnalyticsData } from './src/services/analyticsService.js';

(async () => {
  try {
    console.log('Initializing MongoDB with sample analytics data...');
    const result = await insertSampleAnalyticsData();
    console.log('MongoDB initialized successfully!');
    console.log(`Inserted ${result.insertedCount} records`);
    process.exit(0);
  } catch (error) {
    console.error('Failed to initialize MongoDB:', error);
    process.exit(1);
  }
})();
