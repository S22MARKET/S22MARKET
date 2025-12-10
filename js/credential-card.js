/**
 * Generates a credential card image for the user.
 * @param {string} name - User's display name
 * @param {string} email - User's email
 * @param {string} password - User's password (as requested by user)
 * @returns {Promise<string>} - Data URL of the generated image
 */
export async function generateCredentialCard(name, email, password) {
    const width = 600;
    const height = 400;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Load fonts (we assume Tajawal is available or fallback)
    await document.fonts.ready;

    // 1. Background Gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#4f46e5'); // Indigo 600
    gradient.addColorStop(1, '#9333ea'); // Purple 600
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 2. Glass Effect Overlay
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fillRect(20, 20, width - 40, height - 40);
    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, width - 40, height - 40);

    // 3. Header Text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px "Tajawal", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('بطاقة عضوية S22 Market', width / 2, 80);

    // 4. Content Box
    const boxY = 120;
    const boxHeight = 220;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 15;
    ctx.roundRect(60, boxY, width - 120, boxHeight, 16);
    ctx.fill();
    ctx.shadowBlur = 0; // Reset shadow

    // 5. User Info
    ctx.textAlign = 'right';
    ctx.fillStyle = '#1f2937'; // Gray 800
    ctx.font = 'bold 24px "Tajawal", sans-serif';

    const rightX = width - 100;
    const labelX = rightX;
    const valueX = 100;

    // Name
    ctx.fillStyle = '#4b5563'; // Gray 600
    ctx.font = '18px "Tajawal", sans-serif';
    ctx.fillText('الاسم', labelX, boxY + 50);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 22px "Tajawal", sans-serif';
    ctx.fillText(name, labelX, boxY + 80);

    // Email
    ctx.fillStyle = '#4b5563';
    ctx.font = '18px "Tajawal", sans-serif';
    ctx.fillText('البريد الإلكتروني', labelX, boxY + 120);
    ctx.fillStyle = '#111827';
    ctx.font = 'bold 20px "Tajawal", sans-serif';
    ctx.fillText(email, labelX, boxY + 150);

    // Password
    ctx.fillStyle = '#4b5563';
    ctx.font = '18px "Tajawal", sans-serif';
    ctx.fillText('كلمة المرور', labelX, boxY + 190);
    ctx.fillStyle = '#dc2626'; // Red for caution/visibility
    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.fillText(password, labelX, boxY + 220); // Displaying password plainly as requested

    // 6. Footer
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px "Tajawal", sans-serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.8;
    ctx.fillText('احفظ هذه البطاقة في مكان آمن', width / 2, height - 25);

    return canvas.toDataURL('image/png');
}

// Add roundRect polyfill if needed for older browsers context
if (!CanvasRenderingContext2D.prototype.roundRect) {
    CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.arcTo(x + w, y, x + w, y + h, r);
        this.arcTo(x + w, y + h, x, y + h, r);
        this.arcTo(x, y + h, x, y, r);
        this.arcTo(x, y, x + w, y, r);
        this.closePath();
        return this;
    };
}
