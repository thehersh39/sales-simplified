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
    
    console.log('Received body:', JSON.stringify(body, null, 2));
    
    // Test Francis's exact single person call
    if (body.test_single_person) {
      console.log('Running single person test for:', body.first_name, body.last_name);
      
      const requestPayload = {
        first_name: body.first_name,
        last_name: body.last_name,
        domain: body.domain,
        reveal_personal_emails: false,
        reveal_phone_number: false
      };
      
      console.log('Apollo request payload:', JSON.stringify(requestPayload, null, 2));
      
      const response = await fetch('https://api.apollo.io/api/v1/people/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'x-api-key': 'cgAc0fBksS1tJePYf0n4DA',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      });
      
      console.log('Apollo response status:', response.status);
      
      const data = await response.json();
      console.log('Apollo response data:', JSON.stringify(data, null, 2));
      
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      };
    }
    
    // Regular search logic (your existing 2-step workflow)
    console.log('Running regular search for domain:', body.q_organization_domains);
    
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
    
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(discoveredData)
    };
    
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
