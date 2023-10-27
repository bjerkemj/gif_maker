const fetch = require('node-fetch');
const fs = require('fs');

const presignedUrl = "https://tauro-assignment2.s3.ap-southeast-2.amazonaws.com/7-November.gif?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIA5DYSEEJ45LZWPVHB%2F20231026%2Fap-southeast-2%2Fs3%2Faws4_request&X-Amz-Date=20231026T040909Z&X-Amz-Expires=900&X-Amz-Security-Token=IQoJb3JpZ2luX2VjEEMaDmFwLXNvdXRoZWFzdC0yIkgwRgIhANkfi%2Fuo3YRwW3pSgycv1xaHIpFOiaR4bfW6GT2PANazAiEAgq%2BOtQXKbdOJR%2F9C66SruH4JJ3CazM86qQW8jYsRXLYqpQMIbBADGgw5MDE0NDQyODA5NTMiDCEZ3Fie0W3%2FqJTbNCqCA%2FPPB%2BcPAj2CNL%2Fd02pAs51sg%2Bot4F9ANGN%2Bh3g89ISqIGDfl9AnEXhACGyY5KyF1xcFlKTqGXT5lyUL3wLKmbZ%2B2kxditLrCXHqrMHIUY4luib6I1euvUrM%2BPSOl3wGEpz7e2zfjAHVOB%2F3rJjFXcN869iEfvZRpvbcUbgGqEKNiu6w26IGVoU%2FLo0DEv%2BmYtjeQ3nkgf7WBX%2Bw2ylDihk8cvnEyVrrpp7w%2F2G9pEwsbm4Dfc8b9DKoeDJ5bQSTVTTPeEG94mlYfBH80HZF4Lbl532p%2FmW8sHR9HUv883tfxUBn5o6AslaMDUo6lkmsI7pIyGxUBmAujRuOMupTBf1oXQz2lAMe1LqNC4LLk9yhDTPyIoRq2YiW8KsO7WePKxpKmVulygnfsvTJco0MR6NtRDczqWAiz6TfVT%2BbCekVW0BsWY1fdq3BpWCImutlTI7ZxToyT2UBVFHOB2dWKx7UKMfbK6%2F5nN%2B9dqMeB%2FzIAGUTLWo3aWMiS8RqfFfPq26RMNKc56kGOqUB25DleGMcFSbRs09Ts8KdavV1y9SZPm%2BmukowkztsJd3BDPLrEtsBJMznvjp8TunlnArLcdEtF89tPkEq235M7DE6nQx6fxhWWo0lau6gLWvjyZy16S8p4PSuBfVecO3DOZJnoZNQ8Z2o%2Fz8txZvEOGGVenKD7Uudo%2FTr69xkNMzM9TenXRJneH1DNt9%2BIp%2Fgavnw9tNAxa8ls6nosf4%2FbF8DlE3n&X-Amz-Signature=238891322a5285cf16113e7e4577ded474496e682972f457791716290716b0d9&X-Amz-SignedHeaders=host";

async function uploadToS3() {
    const fileBuffer = fs.readFileSync('earth.gif');
    
    try {
        console.time('Upload Time');  // Start the timer with a label

        const response = await fetch(presignedUrl, {
            method: 'PUT',
            body: fileBuffer,
            headers: {
                'Content-Type': 'image/gif'
            }
        });

        console.timeEnd('Upload Time');  // End the timer with the same label

        if (response.status === 200) {
            console.log('Successfully uploaded to S3');
        } else {
            console.error('Failed to upload to S3. Status:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('Error uploading to S3:', error);
    }
}

uploadToS3();