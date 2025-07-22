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
    
    // Use the correct endpoint that actually returns emails
    const response = await fetch('https://api.apollo.io/api/v1/people/bulk_match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'x-api-key': 'cgAc0fBksS1tJePYf0n4DA'
      },
      body: JSON.stringify({
        reveal_personal_emails: false,
        details: [{
          organization_name: body.q_organization_domains,
          // We'll need to structure this correctly for bulk match
        }]
      })
    });
    
    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
