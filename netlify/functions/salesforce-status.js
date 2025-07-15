exports.handler = async (event, context) => {
  const cookies = event.headers.cookie || '';
  const hasAccessToken = cookies.includes('sf_access_token=');
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      connected: hasAccessToken,
      hasTokens: hasAccessToken
    })
  };
};
