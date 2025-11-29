// test_ocr_connection.js

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const OCR_URL = 'https://yoko-limy-madilyn.ngrok-free.dev';

async function testOCRAPI() {
  try {
    // Test health
    console.log('Testing OCR API health...');
    const health = await axios.get(`${OCR_URL}/health`);
    console.log('✅ OCR API is healthy:', health.data);
    
    // Test processing (if you have a test image)
    if (fs.existsSync('./test_invoice.png')) {
      console.log('\nTesting invoice processing...');
      const form = new FormData();
      form.append('file', fs.createReadStream('./test_invoice.png'));
      form.append('useCache', 'true');
      form.append('useValidation', 'true');
      
      const response = await axios.post(`${OCR_URL}/api/v1/process`, form, {
        headers: form.getHeaders(),
        timeout: 200000
      });
      
      console.log('✅ OCR processing successful');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ OCR API test failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testOCRAPI();