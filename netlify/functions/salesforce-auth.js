exports.handler = async (event, context) => {
  // This redirects users to Salesforce login
  const authUrl = `${process.env.SALESFORCE_LOGIN_URL}/services/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${process.env.SALESFORCE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.SALESFORCE_REDIRECT_URI)}&` +
    `scope=api refresh_token`;
  
  return {
    statusCode: 302,
    headers: {
      'Location': authUrl
    }
  };
};
