exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      headers, 
      body: JSON.stringify({ error: 'Method not allowed' }) 
    };
  }

  try {
    const body = JSON.parse(event.body);
    
    // STEP 1: Discover contacts using mixed_people/search
    const discoverResponse = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'cgAc0fBksS1tJePYf0n4DA'
      },
      body: JSON.stringify({
        q_organization_domains: [body.q_organization_domains],
        page: body.page || 1,
        per_page: body.per_page || 10,
        person_titles: ["Founder", "VP", "CTO", "Director", "Manager", "Head", "Chief"]
      })
    });
    
    const discoveredData = await discoverResponse.json();
    
    if (!discoveredData.people || discoveredData.people.length === 0) {
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ people: [] })
      };
    }
    
    // STEP 2: Enrich with emails using bulk_match
    const peopleToEnrich = discoveredData.people.map(person => ({
      first_name: person.first_name,
      last_name: person.last_name,
      organization_name: person.organization?.name,
      organization_domain: body.q_organization_domains
    }));
    
    const enrichResponse = await fetch('https://api.apollo.io/api/v1/people/bulk_match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'x-api-key': 'cgAc0fBksS1tJePYf0n4DA'
      },
      body: JSON.stringify({
        reveal_personal_emails: false,
        people: peopleToEnrich
      })
    });
    
    const enrichedData = await enrichResponse.json();
    
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...discoveredData,
        people: enrichedData.matches || []
      })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
