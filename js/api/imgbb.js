export async function uploadImageToImgBB(file) {
    const formData = new FormData();
    formData.append('image', file);
    // User provided API Key
    formData.append('key', "db5343488b3526fe64fb53550dcb74c3");

    try {
        const response = await fetch('https://api.imgbb.com/1/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            throw new Error(`ImgBB upload failed with status ${response.status}`);
        }

        const result = await response.json();

        if (result.success) {
            return result.data.url;
        } else {
            throw new Error(`ImgBB Error: ${result.error.message}`);
        }
    } catch (error) {
        console.error("Upload error:", error);
        throw error;
    }
}
