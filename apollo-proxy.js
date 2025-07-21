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
    
    // First, search for people using the original endpoint
    const searchResponse = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'cgAc0fBksS1tJePYf0n4DA'  // lowercase!
      },
      body: JSON.stringify(body)
    });
    
    const searchData = await searchResponse.json();
    
    // Then enrich each person using the correct enrichment endpoint
    const enrichedPeople = [];
    for (const person of searchData.people?.slice(0, 10) || []) {
      try {
        const enrichUrl = `https://api.apollo.io/api/v1/people/match?reveal_personal_emails=false`;
        
        const enrichResponse = await fetch(enrichUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'x-api-key': 'cgAc0fBksS1tJePYf0n4DA'  // lowercase!
          },
          body: JSON.stringify({
            first_name: person.first_name,
            last_name: person.last_name,
            organization_name: person.organization?.name
          })
        });
        
        const enrichedData = await enrichResponse.json();
        enrichedPeople.push(enrichedData.person || person);
        
      } catch (e) {
        enrichedPeople.push(person);
      }
    }
    
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...searchData, people: enrichedPeople })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
