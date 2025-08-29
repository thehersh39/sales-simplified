// api/test-apollo.js
// Deploy this to Vercel to test your Apollo integration

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  const API_KEY = 'cgAc0fBksS1tJePYf0n4DA';
  const results = {};
  
  try {
    // Test 1: Basic Search
    console.log('Running Test 1: Basic Search...');
    const searchResponse = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        q_organization_domains: 'stripe.com',
        per_page: 3,
        page: 1
      })
    });
    
    const searchData = await searchResponse.json();
    results.search = {
      status: searchResponse.status,
      success: searchResponse.ok,
      peopleCount: searchData.people?.length || 0,
      firstPerson: searchData.people?.[0] ? {
        name: `${searchData.people[0].first_name} ${searchData.people[0].last_name}`,
        title: searchData.people[0].title,
        hasEmail: !!searchData.people[0].email,
        email: searchData.people[0].email || 'Not visible'
      } : null,
      error: searchData.error || null
    };
    
    // Test 2: Email Reveal
    console.log('Running Test 2: Email Reveal...');
    const matchResponse = await fetch('https://api.apollo.io/api/v1/people/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        first_name: 'Patrick',
        last_name: 'Collison',
        domain: 'stripe.com',
        reveal_personal_emails: true,
        reveal_phone_number: true
      })
    });
    
    const matchData = await matchResponse.json();
    results.emailReveal = {
      status: matchResponse.status,
      success: matchResponse.ok,
      personFound: !!matchData.person,
      emailRevealed: !!matchData.person?.email,
      email: matchData.person?.email || 'Not revealed',
      phone: matchData.person?.phone_numbers?.[0]?.number || 'Not revealed',
      error: matchData.error || null
    };
    
    // Test 3: Rate Limits
    console.log('Running Test 3: Rate Limits...');
    const limitsResponse = await fetch('https://api.apollo.io/api/v1/rate_limits', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      }
    });
    
    const limitsData = await limitsResponse.json();
    results.rateLimits = {
      status: limitsResponse.status,
      success: limitsResponse.ok,
      data: limitsData,
      error: limitsData.error || null
    };
    
    // Summary
    results.summary = {
      apiKeyWorks: results.search.success || results.emailReveal.success,
      canSearchPeople: results.search.success && results.search.peopleCount > 0,
      canRevealEmails: results.emailReveal.emailRevealed,
      recommendation: getRecommendation(results)
    };
    
  } catch (error) {
    results.error = error.message;
  }
  
  res.status(200).json(results);
}

function getRecommendation(results) {
  if (!results.search.success && !results.emailReveal.success) {
    return 'API key appears invalid or expired. Check your Apollo dashboard.';
  }
  
  if (results.search.success && !results.emailReveal.emailRevealed) {
    return 'API key works but cannot reveal emails. Check: 1) Email credits remaining, 2) API permissions, 3) Account plan level';
  }
  
  if (results.search.success && results.emailReveal.emailRevealed) {
    return '✅ Everything works! Your API can search and reveal emails.';
  }
  
  return 'Partial success. Review the detailed results above.';
}
