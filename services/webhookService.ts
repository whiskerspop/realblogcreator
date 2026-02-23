
import { GeneratedContent, ProductDetails } from '../types';

export const sendToWebhook = async (
    details: ProductDetails,
    content: GeneratedContent
) => {
    console.log('Sending data to local API proxy...');

    const payload = {
        product: {
            title: details.title,
            url: details.url,
            contentType: details.contentType,
            imageUrl: details.imageUrl,
            imageBase64: details.imageBase64 // Send base64 to server for upload
        },
        generatedContent: {
            blogHtml: content.blogHtml,
            pinterestPack: content.pinterestPack,
            images: content.images,
            structuredPins: content.structuredPins || []
        },
        timestamp: new Date().toISOString(),
        year: 2026
    };

    try {
        const response = await fetch('/api/webhook', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            console.log('Local API proxy sent successfully');
        } else {
            console.error('Local API proxy failed:', response.status, response.statusText);
            const errorText = await response.text();
            try {
                const errorJson = JSON.parse(errorText);
                throw new Error(errorJson.message || `Server error: ${response.status}`);
            } catch (e) {
                throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
        }
    } catch (error) {
        console.error('Webhook proxy error:', error);
        throw error;
    }
};
