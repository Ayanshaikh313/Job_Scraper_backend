const axios = require('axios');

/**
 * Fetch jobs from RemoteOK API
 * @param {string} search - Search query
 * @returns {Promise<Array>} Normalized jobs array
 */
const fetchRemoteOKJobs = async (search = '') => {
  try {
    const url = 'https://remoteok.com/api';
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Job-Scraper-Platform/1.0',
      },
    });

    let jobs = response.data || [];

    // Filter out non-job entries (RemoteOK returns metadata in first element)
    jobs = jobs.filter((job) => job.id && typeof job.id === 'number');

    // Filter by search query if provided
    if (search) {
      const searchLower = search.toLowerCase();
      jobs = jobs.filter(
        (job) =>
          (job.title && job.title.toLowerCase().includes(searchLower)) ||
          (job.company && job.company.toLowerCase().includes(searchLower))
      );
    }

    // Normalize data to common format
    return jobs.map((job) => ({
      title: job.title || 'N/A',
      company: job.company || 'N/A',
      location: job.location || 'Remote',
      applyUrl: job.url || '',
      source: 'RemoteOK',
    }));
  } catch (error) {
    console.error('RemoteOK API Error:', error.message);
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
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Job-Scraper-Platform/1.0',
      },
    });

    let jobs = response.data?.data || [];

    // Filter by search query if provided
    if (search) {
      const searchLower = search.toLowerCase();
      jobs = jobs.filter(
        (job) =>
          (job.title && job.title.toLowerCase().includes(searchLower)) ||
          (job.company && job.company.toLowerCase().includes(searchLower))
      );
    }

    // Normalize data to common format
    return jobs.map((job) => ({
      title: job.title || 'N/A',
      company: job.company || 'N/A',
      location: job.location || 'N/A',
      applyUrl: job.url || '',
      source: 'Arbeitnow',
    }));
  } catch (error) {
    console.error('Arbeitnow API Error:', error.message);
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
    // Fetch from both APIs in parallel
    const [remoteOKJobs, arbeitnowJobs] = await Promise.all([
      fetchRemoteOKJobs(search),
      fetchArbeitnowJobs(search),
    ]);

    // Merge results
    const allJobs = [...remoteOKJobs, ...arbeitnowJobs];

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

    return uniqueJobs;
  } catch (error) {
    console.error('External Job Service Error:', error.message);
    return [];
  }
};

module.exports = {
  fetchRemoteOKJobs,
  fetchArbeitnowJobs,
  fetchExternalJobs,
};
