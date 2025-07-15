const axios = require('axios');

exports.handler = async (event, context) => {
  const { code } = event.queryStringParameters;
  
  if (!code) {
    return {
      statusCode: 302,
      headers: {
        'Location': '/?salesforce_error=true'
      }
    };
  }

  try {
    // Exchange code for access token
    const response = await axios.post(
      `${process.env.SALESFORCE_LOGIN_URL}/services/oauth2/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        client_id: process.env.SALESFORCE_CLIENT_ID,
        client_secret: process.env.SALESFORCE_CLIENT_SECRET,
        redirect_uri: process.env.SALESFORCE_REDIRECT_URI
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const { access_token, refresh_token, instance_url } = response.data;
    
    // Store tokens in cookies (simple approach)
    const cookieOptions = 'HttpOnly; Secure; SameSite=Strict; Max-Age=3600';
    
    return {
      statusCode: 302,
      headers: {
        'Location': '/?salesforce_connected=true',
        'Set-Cookie': [
          `sf_access_token=${access_token}; ${cookieOptions}`,
          `sf_refresh_token=${refresh_token}; ${cookieOptions}`,
          `sf_instance_url=${instance_url}; ${cookieOptions}`
        ]
      }
    };

  } catch (error) {
    console.error('Salesforce OAuth error:', error.response?.data || error.message);
    return {
      statusCode: 302,
      headers: {
        'Location': '/?salesforce_error=true'
      }
    };
  }
};
