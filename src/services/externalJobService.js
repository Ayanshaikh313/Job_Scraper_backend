const axios = require('axios');

/**
 * Fetch jobs from RemoteOK API
 * @param {string} search - Search query
 * @returns {Promise<Array>} Normalized jobs array
 */
const fetchRemoteOKJobs = async (search = '') => {
  try {
    const url = 'https://remoteok.com/api';
    console.log('[RemoteOK] Fetching from:', url);
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Job-Scraper-Platform/1.0',
      },
    });

    console.log('[RemoteOK] Response status:', response.status, 'Data length:', response.data?.length);

    let jobs = response.data || [];

    // Skip the first item if it doesn't have needed fields (metadata)
    if (jobs.length > 0 && !jobs[0].company) {
      console.log('[RemoteOK] Skipping first item (metadata)');
      jobs = jobs.slice(1);
    }

    console.log('[RemoteOK] Jobs after metadata removal:', jobs.length);

    // Log first few items to understand structure
    if (jobs.length > 0) {
      console.log('[RemoteOK] First item all fields:', Object.keys(jobs[0]));
      console.log('[RemoteOK] First item sample:', {
        title: jobs[0].title,
        position: jobs[0].position,
        name: jobs[0].name,
        company: jobs[0].company,
        location: jobs[0].location,
        url: jobs[0].url,
      });
    }

    // Filter to keep only valid job entries
    // Accept jobs with company name (all RemoteOK jobs should have this)
    jobs = jobs.filter((job) => {
      return job && job.company;
    });

    console.log('[RemoteOK] After company filter:', jobs.length);

    // Filter by search query if provided
    if (search) {
      const searchLower = search.toLowerCase();
      jobs = jobs.filter(
        (job) => {
          const company = job.company || '';
          const location = job.location || '';
          return company.toLowerCase().includes(searchLower) ||
                 location.toLowerCase().includes(searchLower);
        }
      );
      console.log('[RemoteOK] After search filter:', jobs.length);
    }

    // Normalize data to common format
    // Use any available title field
    const normalized = jobs.map((job) => ({
      title: job.title || job.position || job.name || job.company || 'Remote Job',
      company: job.company || 'N/A',
      location: job.location || 'Remote',
      applyUrl: job.url || '',
      source: 'RemoteOK',
    }));

    console.log('[RemoteOK] Final normalized jobs:', normalized.length);
    if (normalized.length > 0) {
      console.log('[RemoteOK] Sample normalized job:', normalized[0]);
    }
    return normalized;
  } catch (error) {
    console.error('[RemoteOK] API Error:', error.message);
    return [];
  }
};

/**
 * Fetch jobs from Arbeitnow API
 * @param {string} search - Search query
 * @returns {Promise<Array>} Normalized jobs array
 */
const fetchArbeitnowJobs = async (search = '') => {
  try {
    const url = 'https://www.arbeitnow.com/api/job-board-posts';
    console.log('[Arbeitnow] Fetching from:', url);
    
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Job-Scraper-Platform/1.0',
      },
    });

    console.log('[Arbeitnow] Response status:', response.status, 'Data length:', response.data?.data?.length);

    let jobs = response.data?.data || [];

    console.log('[Arbeitnow] Jobs count:', jobs.length);

    // Log first item to understand structure
    if (jobs.length > 0) {
      console.log('[Arbeitnow] First item sample:', {
        title: jobs[0].title?.substring(0, 50),
        company: jobs[0].company?.substring(0, 30),
        location: jobs[0].location,
      });
    }

    // Filter by search query if provided
    if (search) {
      const searchLower = search.toLowerCase();
      jobs = jobs.filter(
        (job) =>
          (job.title && job.title.toLowerCase().includes(searchLower)) ||
          (job.company && job.company.toLowerCase().includes(searchLower))
      );
      console.log('[Arbeitnow] After search filter:', jobs.length);
    }

    // Normalize data to common format
    const normalized = jobs.map((job) => ({
      title: job.title || 'N/A',
      company: job.company || 'N/A',
      location: job.location || 'N/A',
      applyUrl: job.url || '',
      source: 'Arbeitnow',
    }));

    console.log('[Arbeitnow] Final normalized jobs:', normalized.length);
    return normalized;
  } catch (error) {
    console.error('[Arbeitnow] API Error:', error.message);
    return [];
  }
};

/**
 * Fetch and merge jobs from all external sources
 * @param {string} search - Search query
 * @returns {Promise<Array>} Merged and normalized jobs
 */
const fetchExternalJobs = async (search = '') => {
  try {
    console.log('[ExternalJobService] Fetching external jobs, search:', search || 'none');
    
    // Fetch from both APIs in parallel
    const [remoteOKJobs, arbeitnowJobs] = await Promise.all([
      fetchRemoteOKJobs(search),
      fetchArbeitnowJobs(search),
    ]);

    console.log('[ExternalJobService] RemoteOK results:', remoteOKJobs.length, 'Arbeitnow results:', arbeitnowJobs.length);

    // Merge results
    const allJobs = [...remoteOKJobs, ...arbeitnowJobs];

    console.log('[ExternalJobService] Total jobs before dedup:', allJobs.length);

    // Remove duplicates based on title + company combination
    const uniqueJobs = [];
    const seen = new Set();

    for (const job of allJobs) {
      const key = `${job.title.toLowerCase()}-${job.company.toLowerCase()}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueJobs.push(job);
      }
    }

    console.log('[ExternalJobService] Total jobs after dedup:', uniqueJobs.length);
    return uniqueJobs;
  } catch (error) {
    console.error('[ExternalJobService] Error:', error.message);
    return [];
  }
};

module.exports = {
  fetchRemoteOKJobs,
  fetchArbeitnowJobs,
  fetchExternalJobs,
};
