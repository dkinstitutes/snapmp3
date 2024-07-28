function submit(x) {
    if (!x) return;

    const api = "https://co.wuk.sh/api/json"; // Make sure this URL is correct
    const cURL = extractURL(x);
    if (!cURL) {
        status.error('Invalid URL');
        return;
    }
    const encodedUrl = encodeURIComponent(cURL[0]); // Use the first URL from the array
    console.log(`Encoded URL: ${encodedUrl}`);

    const vQuality = vQualitySelector.value || 720;
    const isAudioOnly = audioCheckbox.checked || false;
    const aFormat = isAudioOnly ? (document.getElementById('aFormat').value || 'best') : null;

    const requestBody = {
        url: encodedUrl,
        filenamePattern: 'pretty',
        vQuality: vQuality,
        isAudioOnly: isAudioOnly,
        aFormat: aFormat
    };

    const requestOptions = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
    };

    status.loading();

    fetch(api, requestOptions)
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => {
                    throw new Error(`Network response was not ok: ${text}`);
                });
            }
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            if (data.status === 'error') {
                status.error(data.text || 'Error');
                return;
            }
            if (data.status === 'redirect') {
                window.open(data.url, '_blank');
                status.success('Redirected');
                return;
            }

            const fileUrl = data.url;
            fetch(fileUrl)
                .then(response => {
                    if (!response.ok) {
                        throw new Error('File download failed');
                    }
                    const fileSize = response.headers.get('content-length');
                    if (fileSize) {
                        status.success(formatBytes(fileSize));
                    } else {
                        status.success('File size not available');
                    }
                    
                    // Create a download link
                    const downloadLink = document.createElement('a');
                    downloadLink.href = fileUrl;
                    downloadLink.download = 'file';
                    downloadLink.click();
                })
                .catch(error => {
                    status.error(`Error fetching file: ${error.message}`);
                });
        })
        .catch(error => {
            status.error(`Fetch error: ${error.message}`);
        });
}
