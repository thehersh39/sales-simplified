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
    
    // Step 1: Discover contacts
    const discoverResponse = await fetch('https://api.apollo.io/api/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': 'cgAc0fBksS1tJePYf0n4DA'
      },
      body: JSON.stringify({
        q_organization_domains: [body.q_organization_domains],
        page: body.page || 1,
        per_page: body.per_page || 10
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
    
    // Step 2: Enrich each person using Francis's exact structure
    const enrichedPeople = [];
    for (const person of discoveredData.people.slice(0, 10)) {
      try {
        const enrichResponse = await fetch('https://api.apollo.io/api/v1/people/match', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'x-api-key': 'cgAc0fBksS1tJePYf0n4DA',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            first_name: person.first_name,
            last_name: person.last_name,
            domain: body.q_organization_domains, // Use 'domain' not 'organization_domain'
            reveal_personal_emails: false,
            reveal_phone_number: false
          })
        });
        
        const enrichedData = await enrichResponse.json();
        
        // Merge the enriched data with original person data
        const mergedPerson = {
          ...person,
          email: enrichedData.person?.email || person.email,
          email_status: enrichedData.person?.email_status || person.email_status
        };
        
        enrichedPeople.push(mergedPerson);
        
      } catch (e) {
        enrichedPeople.push(person);
      }
    }
    
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...discoveredData,
        people: enrichedPeople
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
