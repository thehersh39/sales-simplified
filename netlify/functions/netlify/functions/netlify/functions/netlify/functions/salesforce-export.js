const axios = require('axios');

function parseCookies(cookieHeader) {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.split('=').map(c => c.trim());
      cookies[name] = value;
    });
  }
  return cookies;
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { 
      statusCode: 405, 
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const cookies = parseCookies(event.headers.cookie);
  const accessToken = cookies.sf_access_token;
  const instanceUrl = cookies.sf_instance_url;

  if (!accessToken || !instanceUrl) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Salesforce not connected' })
    };
  }

  try {
    const { contacts, exportType = 'Contact' } = JSON.parse(event.body);
    const results = [];

    for (const contact of contacts) {
      let recordData;
      
      if (exportType === 'Contact') {
        recordData = {
          FirstName: contact.name.split(' ')[0],
          LastName: contact.name.split(' ').slice(1).join(' ') || 'Unknown',
          Email: contact.email,
          Title: contact.title,
          Phone: contact.phone || '',
          Department: contact.department || '',
          Description: `Enhanced contact from Sales Simplified\n` +
                      `Source: ${contact.source}\n` +
                      `Confidence: ${contact.confidence}%\n` +
                      `Verified: ${contact.verified ? 'Yes' : 'No'}`,
          LeadSource: 'Sales Simplified'
        };
      } else {
        recordData = {
          FirstName: contact.name.split(' ')[0],
          LastName: contact.name.split(' ').slice(1).join(' ') || 'Unknown',
          Email: contact.email,
          Title: contact.title,
          Company: contact.company,
          Phone: contact.phone || '',
          LeadSource: 'Sales Simplified',
          Status: 'New',
          Description: `Enhanced lead from Sales Simplified\n` +
                      `Source: ${contact.source}\n` +
                      `Confidence: ${contact.confidence}%\n` +
                      `Verified: ${contact.verified ? 'Yes' : 'No'}`
        };
      }

      const endpoint = exportType === 'Contact' ? 'Contact' : 'Lead';
      const response = await axios.post(
        `${instanceUrl}/services/data/v58.0/sobjects/${endpoint}`,
        recordData,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      results.push({
        contact: contact.name,
        salesforceId: response.data.id,
        success: response.data.success,
        type: exportType
      });
    }

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        exported: results.length,
        exportType: exportType,
        results: results
      })
    };

  } catch (error) {
    console.error('Salesforce export error:', error.response?.data || error.message);
    
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: 'Export failed',
        details: error.response?.data || error.message 
      })
    };
  }
};
