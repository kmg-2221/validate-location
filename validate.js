const express = require('express');
const { DOMParser } = require('xmldom');
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

app.get('/getinsured/', async (req, res) => {

    const loginapi = "https://ws2.mgasystems.com/ims_kmg_dev/logon.asmx?op=GenerateToken";
    const insuredurl = "https://ws2.mgasystems.com/ims_kmg_dev/InsuredFunctions.asmx?op=GetInsured"
    //const hazardAccessToken = "token=-FyaXtoLHcgEVbJdG5gs";
    const username = "stakroo";
    const password = "Stakroo@2023$$";
    const insuredguid = req.query.insuredguid;
    let token;


    const data = `
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <GenerateToken xmlns="http://tempuri.org/IMSWebServices/Logon">
          <Credentials>
            <Username>${username}</Username>
            <Password>${password}</Password>
          </Credentials>
        </GenerateToken>
      </soap:Body>
    </soap:Envelope>
    `;

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml'
        },
        body: data
    };

    try {
        const response = await fetch(loginapi, options)
        console.log(response);
        if (response.ok) {
            const loginResponse = await response.text();

            // Parse the XML response
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(loginResponse, 'text/xml');

            // Find the token element using XPath
            // const tokenElement = xmlDoc.evaluate('//Token', xmlDoc, null, XPathResult.ANY_TYPE, null);
            // token = tokenElement.iterateNext().textContent;
            const tokenElements = xmlDoc.getElementsByTagName('Token');
            if (tokenElements.length > 0) {
                // Assuming you only want the first Token element found
                const tokenNode = tokenElements[0];
                token = tokenNode.textContent;
                console.log("token: " + token);
            } else {
                throw new Error('Token element not found in XML response');
            }


            console.log(token);


        } else {
            throw new Error('Failed to fetch token from loginapi');
        }
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }

    const insureddata = `
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Header>
        <TokenHeader xmlns="http://tempuri.org/IMSWebServices/InsuredFunctions">
          <Token>${token}</Token>
          <Context>token</Context>
        </TokenHeader>
      </soap:Header>
      <soap:Body>
        <GetInsured xmlns="http://tempuri.org/IMSWebServices/InsuredFunctions">
          <insuredGuid>${insuredguid}</insuredGuid>
        </GetInsured>
      </soap:Body>
    </soap:Envelope>
    `;

    const option = {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml',
            //yy'Authorization': `Bearer ${token}` // Send the token in the Authorization header
        },
        body: insureddata
    };

    try {
        console.log("tokken:" + token)
        const responses = await fetch(insuredurl, option)
        console.log(responses);
        if (responses.ok) {
            const insuredResponse = await responses.text();

            // Parse the XML response
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(insuredResponse, 'text/xml');

            // Find the elements in the XML response
            const firstNameElement = xmlDoc.getElementsByTagName('FirstName')[0];
            const lastNameElement = xmlDoc.getElementsByTagName('LastName')[0];
            const nameOnPolicyElement = xmlDoc.getElementsByTagName('NameOnPolicy')[0];

            // Extract the text content of the elements
            let firstName = firstNameElement ? firstNameElement.textContent : '';
            let lastName = lastNameElement ? lastNameElement.textContent : '';
            let nameOnPolicy = nameOnPolicyElement ? nameOnPolicyElement.textContent : '';



            console.log(insuredResponse);
            res.status(200).json({
                successful: true,
                output_data: {
                    attributes: {
                        InsurrdFirstName: firstName,
                        InsuredLastName: lastName,
                        NameNoPolicy: nameOnPolicy
                    }
                }
            });
        } else {
            throw new Error('Failed to fetch insured data from insuredurl');
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
