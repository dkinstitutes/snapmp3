function formatBytes(a, b = 2) {
    if (!+a) return "0 Bytes";
    const c = 0 > b ? 0 : b;
    const d = Math.floor(Math.log(a) / Math.log(1024));
    return `${parseFloat((a / Math.pow(1024, d)).toFixed(c))} ${["Bytes", "KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"][d]}`;
}

const extractURL = inputText => inputText.match(/(https?|http):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|]/ig);
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const url = urlParams.get("url");
const audio = urlParams.get("audio");
const inputUrl = document.getElementById('url');
const statusDiv = document.getElementById("status");
const audioCheckbox = document.getElementById('isAudioOnly');
const vQualitySelector = document.getElementById("vQuality");

const status = {
    "loading": function() {
        statusDiv.innerHTML = '<i class="gg-loadbar-alt"></i>';
    },
    "success": function(fileSize) {
        statusDiv.innerHTML = `<i class="gg-check"></i><br><h4>${fileSize}</h4>`;
    },
    "error": function(msg) {
        statusDiv.innerHTML = `<i class="gg-error"></i><br><h4>${msg}</h4>`;
    }
};

function processUrl(x) {
    if (!x) return;
    inputUrl.value = extractURL(x);
    if (audio) {
        audioCheckbox.checked = true;
    }
    submit(x);
}
processUrl(url);

document.forms[0].addEventListener("submit", event => {
    event.preventDefault();
    submit(inputUrl.value);
});

audioCheckbox.addEventListener("change", () => {
    vQualitySelector.toggleAttribute("disabled");
});

function submit(x) {
    if (!x) return;
    const api = "https://co.wuk.sh/api/json";
    const cURL = extractURL(x);
    if (!cURL) {
        status.error('Invalid URL');
        return;
    }
    const url = encodeURIComponent(cURL[0]); // Use the first URL from the array

    const vQuality = vQualitySelector.value || 720;
    const isAudioOnly = audioCheckbox.checked || false;
    const aFormat = isAudioOnly ? (document.getElementById('aFormat').value || 'best') : null;

    const requestBody = {
        url: url,
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
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Response data:', data);
            if (data.status === 'error') {
                status.error(data.text);
                return;
            }
            if (data.status === 'redirect') {
                window.open(data.url, '_blank');
                status.success('Redirected');
                return;
            }

            const fileUrl = data.url;
            return fetch(fileUrl)
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
                });
        })
        .catch(error => {
            status.error(error.message);
        });
}
