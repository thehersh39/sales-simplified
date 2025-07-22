exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const body = JSON.parse(event.body);
    
    // Test Francis's exact single person call
    if (body.test_single_person) {
      const response = await fetch('https://api.apollo.io/api/v1/people/match', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'x-api-key': 'cgAc0fBksS1tJePYf0n4DA',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          first_name: body.first_name,
          last_name: body.last_name,
          domain: body.domain,
          reveal_personal_emails: false,
          reveal_phone_number: false
        })
      });
      
      const data = await response.json();
      
      return {
        statusCode: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      };
    }
    
    // ... rest of your existing code
    
  } catch (error) {
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
