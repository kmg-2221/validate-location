const express = require('express');
const app = express();
const port = 3000;

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.get('/validate/', async (req, res) => {

    const hazardhubApi = "https://api.hazardhub.com/";
    const hazardAccessToken = "token=-FyaXtoLHcgEVbJdG5gs";
    const address = req.query.address;
    const city = req.query.city;
    const state = req.query.state;
    const zip = req.query.zip;
    
    
        const url = `${hazardhubApi}v1/risks_and_enhanced_property_and_replacement_cost_data?address=${address}&city=${city}&state=${state}&zip=${zip}`;
    
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Token ${hazardAccessToken}`,
                    'Accept': 'application/json'
                }
            });
            
            if (response.ok) {
                const hazardHubResponse = await response.json();
                //console.log(hazardHubResponse);
                res.status(200).json({
                    successful: true,
                    output_data: {
                      attributes: {
                        lat: hazardHubResponse.risks.lat,
                        lng: hazardHubResponse.risks.lng,
                        enhanced_wildfire_text: hazardHubResponse.risks.enhanced_wildfire.text
                      }
                    }
                  });
                // TA Log
    
                // fill aqxml
                //const hazardHubMappingRule = new HazardHubMappingRule(requestXml, hazardHubResponse);
                //requestXml = hazardHubMappingRule.Map();
            } else {
                throw new Error('Failed to fetch data from HazardHub API');
            }
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    
        //return requestXml;
    
    

    // res.status(200).json(hazardHubResponse);
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
