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
    
    // First, search for people
    const searchResponse = await fetch('https://api.apollo.io/v1/mixed_people/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': 'cgAc0fBksS1tJePYf0n4DA'
      },
      body: JSON.stringify(body)
    });
    
    const searchData = await searchResponse.json();
    
    // Then enrich each person to unlock their email (spend credits)
    const enrichedPeople = [];
    for (const person of searchData.people?.slice(0, 10) || []) {
      try {
        const enrichResponse = await fetch('https://api.apollo.io/v1/people/match', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': 'cgAc0fBksS1tJePYf0n4DA'
          },
          body: JSON.stringify({
            first_name: person.first_name,
            last_name: person.last_name,
            organization_name: person.organization?.name,
            reveal_personal_emails: false
          })
        });
        
        const enrichedPerson = await enrichResponse.json();
        enrichedPeople.push(enrichedPerson.person || person);
      } catch (e) {
        enrichedPeople.push(person); // Fallback to original
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
