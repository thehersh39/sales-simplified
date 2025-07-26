const express = require('express');
const serverless = require('serverless-http');

const app = express();
app.use(express.json());

// CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Contact finder search endpoint (for enhanced dashboard)
app.post('/api/contact-finder/search', async (req, res) => {
  try {
    const { domain, limit } = req.body;
    
    if (!domain) {
      return res.status(400).json({ error: "Domain is required" });
    }

    console.log(`🔍 Contact finder search for: ${domain} (limit: ${limit})`);
    
    // Hunter.io API integration
    const HUNTER_API_KEY = process.env.HUNTER_API_KEY;
    if (!HUNTER_API_KEY) {
      return res.status(500).json({ error: "Hunter.io API key not configured" });
    }

    // Company enrichment (simplified)
    const enrichedCompanyData = {
      name: domain.includes('partake') ? 'Partake Foods' : 
            domain.includes('mccain') ? 'McCain Foods' :
            domain.includes('stripe') ? 'Stripe' :
            domain.charAt(0).toUpperCase() + domain.split('.')[0].slice(1),
      industry: domain.includes('partake') || domain.includes('mccain') ? 'Consumer Packaged Goods' :
                domain.includes('stripe') ? 'Technology' : 'Business',
      description: `Professional company providing business services and solutions.`,
      domain: domain
    };

    // Hunter.io contact search
    let contacts = [];
    
    try {
      const hunterLimit = Math.min(limit || 10, 10);
      const hunterUrl = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${HUNTER_API_KEY}&limit=${hunterLimit}`;
      
      const response = await fetch(hunterUrl);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Hunter.io API error: ${response.status} - ${errorText}`);
        throw new Error(`Hunter.io API error: ${response.status}`);
      }
      
      const data = await response.json();
      const emails = data.data?.emails || [];
      console.log(`Hunter.io found ${emails.length} contacts for ${domain}`);
      
      if (emails.length > 0) {
        contacts = emails.map((contact) => ({
          first_name: contact.first_name,
          last_name: contact.last_name,
          email: contact.value || contact.email, // Hunter.io uses 'value' field for emails
          position: contact.position,
          company: enrichedCompanyData.name,
          confidence: contact.confidence || 100,
          department: contact.department,
          phone: contact.phone_number,
          linkedin: contact.linkedin_url
        }));
      }
    } catch (error) {
      console.error("❌ Hunter.io search failed:", error);
    }

    // Return results in format expected by dashboard
    res.json({
      contacts: contacts,
      company: {
        name: enrichedCompanyData.name,
        description: enrichedCompanyData.description,
        industry: enrichedCompanyData.industry,
        domain: domain
      },
      success: contacts.length > 0
    });

  } catch (error) {
    console.error("Contact finder search error:", error);
    res.status(500).json({ 
      error: "Search failed", 
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// Dashboard stats endpoint
app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalSearches: 0,
    contactsFound: 0,
    listsCreated: 0,
    verifiedEmails: 0
  });
});

// Contact lists endpoints
app.get('/api/contact-lists', (req, res) => {
  res.json([]);
});

app.post('/api/contact-lists', (req, res) => {
  res.json({ id: Date.now(), ...req.body });
});

// Search history endpoint
app.get('/api/search-history', (req, res) => {
  res.json([]);
});

// Export handler for Netlify Functions
exports.handler = serverless(app);
