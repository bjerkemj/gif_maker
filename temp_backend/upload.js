const fetch = require('node-fetch');
const fs = require('fs');

const presignedUrl = "https://tauro-assignment2.s3.ap-southeast-2.amazonaws.com/12-May.gif?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIA5DYSEEJ46A2XUN4J%2F20231025%2Fap-southeast-2%2Fs3%2Faws4_request&X-Amz-Date=20231025T010414Z&X-Amz-Expires=900&X-Amz-Security-Token=IQoJb3JpZ2luX2VjECkaDmFwLXNvdXRoZWFzdC0yIkcwRQIgKXDe6Wt5ztrRMIYG7DMJrIhdHtmUzFt0z0rdq5i4b8cCIQDJFYIxw67AMBDQccyi0jZfLO6nUpaGpb6duESmlbQcSyqlAwhSEAMaDDkwMTQ0NDI4MDk1MyIM9ZAfLCV5uSrgnVErKoIDweZIi%2BE94HGc18K6IgvCrF9reEuhoA5QTR33EfF5qm7T1sIwUKkWIDzgtSe82WbDgg%2BsaJ%2FF25RPWFQmL0ZOrvPomEUh%2ByGDTGHoywBrvgC9LarOKOhV%2FwSYlzFbJwd1viD7lJQxHE5Kz1sBcV2%2BJHij0md%2FTvdgUM0DMoh%2FlaifW%2BrKPn5xdCsivMIfNe6Dd2eeNxo1qGm1wbPzklKbxpY78QOaOHuS2a0K2PkxPRuT6bZJDObBRAyStBcHDGJm7KcCfDnJCIKW%2Bgd11lrRBa2CIbVzsHIFbB1BjmRiT6KJCz0FzNmc4JSK2kWK6y6TEmN3DSl0t8CY%2BV0PpylIMo%2BlGpajSwF%2F%2Fak4%2FuW6OzFk3QIJUdffYoAhM%2BDoFxK0AAlSqi9bM%2F95chSqfPQZZXkODIxjdyHc2AglSnJrWsUbB5UPE2NB%2FTeHk2azGLucSqNbV8s2jOFIyYL8nBgU%2BJVOJ5fUWUxhiFpkLALQtK4KfAcgvPIJgEQGpr1MEv34e%2FwwkMHhqQY6pgGQ%2FMnJzbm%2Fwric8pkpgpZhC1rHk3pizW9fvA1%2B3CEQnp1qFlTIjFCF9yGi%2Fx97lEH2Mrhjcsjm9CiTyzP5Kf6lTDDEzos9B6FogDuSPWS3P%2F64kLbkAuJhIP0RRBcN9L4AAkj%2FuQMQteWoNvvBu%2F%2Bs4puGdZZjxHfsbBb%2FOTebUhxZlnhHJAi7LKI3wyc4u1FRnJQRZNaNAFXzE2GFbg%2FH3zKwlKjM&X-Amz-Signature=fab051c842fb7c15e3d3f8d3676ccc1b857afef33ceca88dd4f20d6eb8365f54&X-Amz-SignedHeaders=host";

async function uploadToS3() {
    const fileBuffer = fs.readFileSync('earth.gif');
    
    try {
        const response = await fetch(presignedUrl, {
            method: 'PUT',
            body: fileBuffer,
            headers: {
                'Content-Type': 'image/gif'
            }
        });

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
